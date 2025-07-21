package io.flowinquiry.modules.collab.service.event;

import static io.flowinquiry.modules.teams.domain.WorkflowTransitionHistoryStatus.COMPLETED;

import io.flowinquiry.modules.collab.EmailContext;
import io.flowinquiry.modules.collab.domain.EntityType;
import io.flowinquiry.modules.collab.service.EntityWatcherService;
import io.flowinquiry.modules.collab.service.MailService;
import io.flowinquiry.modules.teams.domain.Ticket;
import io.flowinquiry.modules.teams.repository.TicketRepository;
import io.flowinquiry.modules.usermanagement.service.UserService;
import io.flowinquiry.modules.usermanagement.service.dto.UserDTO;
import java.util.Locale;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Profile("!test")
@Component
public class EmailViolatedSLATicketWatchers {
    private final EntityWatcherService entityWatcherService;
    private final MailService mailService;
    private final UserService userService;
    private final TicketRepository ticketRepository;
    private final MessageSource messageSource;

    public EmailViolatedSLATicketWatchers(
            EntityWatcherService entityWatcherService,
            MailService mailService,
            UserService userService,
            TicketRepository ticketRepository,
            MessageSource messageSource) {
        this.entityWatcherService = entityWatcherService;
        this.mailService = mailService;
        this.userService = userService;
        this.ticketRepository = ticketRepository;
        this.messageSource = messageSource;
    }

    @Scheduled(cron = "0 0 0 * * ?") // Runs at midnight every day
    @SchedulerLock(
            name = "SendNotificationForTicketsViolateSlaJob",
            lockAtMostFor = "5m",
            lockAtLeastFor = "30s")
    public void notifyWatchers() {

        int page = 0;
        int size = 100;
        Page<Ticket> ticketsPage;

        do {
            ticketsPage =
                    ticketRepository.findAllOverdueTickets(COMPLETED, PageRequest.of(page, size));

            ticketsPage
                    .getContent()
                    .forEach(
                            ticket -> {
                                log.info(
                                        "Processing overdue ticket ID for sending emails to watchers: {}",
                                        ticket.getId());
                                entityWatcherService
                                        .getWatchersForEntity(EntityType.Ticket, ticket.getId())
                                        .forEach(
                                                watcher -> {
                                                    Optional<UserDTO> userinfo =
                                                            userService.getUserById(
                                                                    watcher.getWatchUserId());
                                                    if (userinfo.isPresent()) {
                                                        UserDTO user = userinfo.get();
                                                        Locale locale =
                                                                Locale.forLanguageTag(
                                                                        user.getLangKey() != null
                                                                                ? user.getLangKey()
                                                                                : "en");

                                                        EmailContext emailContext =
                                                                new EmailContext(
                                                                                locale,
                                                                                mailService
                                                                                        .getBaseUrl(),
                                                                                messageSource)
                                                                        .setToUser(user)
                                                                        .setTemplate(
                                                                                "mail/overdueTicketEmail")
                                                                        .setSubject(
                                                                                "email.ticket.sla.violation.title",
                                                                                ticket
                                                                                        .getRequestTitle())
                                                                        .addVariable(
                                                                                "requestTitle",
                                                                                ticket
                                                                                        .getRequestTitle())
                                                                        .addVariable(
                                                                                "slaDueDate",
                                                                                ticket
                                                                                        .getEstimatedCompletionDate())
                                                                        .addVariable(
                                                                                "obfuscatedTeamId",
                                                                                ticket.getTeam()
                                                                                        .getId())
                                                                        .addVariable(
                                                                                "obfuscatedTicketId",
                                                                                ticket.getId());

                                                        mailService.sendEmail(emailContext);
                                                        log.info(
                                                                "Sent overdue ticket mail to watcher: {}",
                                                                user.getId());
                                                    }
                                                });
                            });

            page++;

        } while (ticketsPage.hasNext());
    }
}
