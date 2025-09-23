package io.flowinquiry.modules.teams.service.job;

import static io.flowinquiry.modules.teams.utils.DeduplicationKeyBuilder.buildSlaWarningKey;
import static j2html.TagCreator.a;
import static j2html.TagCreator.p;
import static j2html.TagCreator.strong;
import static j2html.TagCreator.text;

import io.flowinquiry.modules.collab.domain.Notification;
import io.flowinquiry.modules.collab.domain.NotificationType;
import io.flowinquiry.modules.shared.controller.SseController;
import io.flowinquiry.modules.shared.domain.EventPayloadType;
import io.flowinquiry.modules.shared.service.cache.DeduplicationCacheService;
import io.flowinquiry.modules.teams.domain.Ticket;
import io.flowinquiry.modules.teams.domain.WorkflowTransitionHistory;
import io.flowinquiry.modules.teams.service.TeamService;
import io.flowinquiry.modules.teams.service.WorkflowTransitionHistoryService;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.utils.Obfuscator;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Profile("!test")
@Component
@AllArgsConstructor
public class SendWarningForUpcomingTicketsViolateSlaJob {

    // send the warning to people before 30 minutes the SLAs are violated, this value should get
    // from team settings
    private static final int PRIOR_SLA_WARNING_THRESHOLD_IN_SECONDS = 1800;

    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm z");

    private final TeamService teamService;

    private final WorkflowTransitionHistoryService workflowTransitionHistoryService;

    private final DeduplicationCacheService deduplicationCacheService;

    private final SseController sseController;

    @Scheduled(cron = "0 0/15 * * * ?")
    @SchedulerLock(name = "SendWarningForUpcomingTicketsViolateSlaJob")
    public void run() {
        List<WorkflowTransitionHistory> violatingTickets =
                workflowTransitionHistoryService.getViolatingTransitions(
                        PRIOR_SLA_WARNING_THRESHOLD_IN_SECONDS);

        for (WorkflowTransitionHistory violatingTicket : violatingTickets) {
            Ticket ticket = violatingTicket.getTicket();
            Instant slaDueDate = violatingTicket.getSlaDueDate();
            String formattedSlaDueDate = slaDueDate.atZone(ZoneId.of("UTC")).format(formatter);

            User assignUser = ticket.getAssignUser();
            List<User> recipients = new ArrayList<>();

            if (assignUser != null) {
                recipients.add(assignUser);
            } else {
                // ✅ If no assigned user, notify all team managers
                recipients = teamService.getTeamManagers(ticket.getTeam().getId());
            }

            for (User recipient : recipients) {
                String cacheKey =
                        buildSlaWarningKey(
                                recipient.getId(),
                                ticket.getId(),
                                violatingTicket.getTicket().getWorkflow().getId(),
                                violatingTicket.getEventName(),
                                violatingTicket.getToState().getId(),
                                "SendWarningForUpcomingTicketsViolateSlaJob");

                if (deduplicationCacheService.containsKey(cacheKey)) {
                    continue; // Skip if already sent
                }

                String html =
                        p(
                                        text("The ticket "),
                                        a(ticket.getRequestTitle())
                                                .withHref(
                                                        "/portal/teams/"
                                                                + Obfuscator.obfuscate(
                                                                        ticket.getTeam().getId())
                                                                + "/tickets/"
                                                                + Obfuscator.obfuscate(
                                                                        ticket.getId())),
                                        text(
                                                " assigned to your team is approaching its SLA deadline. The SLA is due on "),
                                        strong(text(formattedSlaDueDate)),
                                        text(". Please take necessary action."))
                                .render();

                Notification notification =
                        Notification.builder()
                                .content(html)
                                .type(NotificationType.SLA_WARNING)
                                .user(User.builder().id(recipient.getId()).build())
                                .isRead(false)
                                .build();

                sseController.sendEventToUser(
                        recipient.getId(), EventPayloadType.NOTIFICATION, notification);

                // ✅ Store Key in Deduplication Cache
                deduplicationCacheService.put(cacheKey, Duration.ofHours(24));
            }

            log.debug("Sending violating ticket {}", violatingTicket);
        }
    }
}
