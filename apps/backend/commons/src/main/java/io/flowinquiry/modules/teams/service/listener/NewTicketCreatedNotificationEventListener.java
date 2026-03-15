package io.flowinquiry.modules.teams.service.listener;

import static io.flowinquiry.modules.shared.domain.EventPayloadType.NOTIFICATION;
import static io.flowinquiry.utils.HtmlUtils.NOTIFICATION_CONTAINER_STYLE;
import static io.flowinquiry.utils.HtmlUtils.buildTicketPath;
import static io.flowinquiry.utils.HtmlUtils.userAvatarLink;
import static j2html.TagCreator.a;
import static j2html.TagCreator.div;
import static j2html.TagCreator.span;

import io.flowinquiry.exceptions.ResourceNotFoundException;
import io.flowinquiry.modules.collab.domain.ActivityLog;
import io.flowinquiry.modules.collab.domain.EntityType;
import io.flowinquiry.modules.collab.domain.Notification;
import io.flowinquiry.modules.collab.domain.NotificationType;
import io.flowinquiry.modules.collab.repository.ActivityLogRepository;
import io.flowinquiry.modules.collab.repository.NotificationRepository;
import io.flowinquiry.modules.shared.controller.SseController;
import io.flowinquiry.modules.teams.repository.TeamRepository;
import io.flowinquiry.modules.teams.service.TicketService;
import io.flowinquiry.modules.teams.service.dto.TicketDTO;
import io.flowinquiry.modules.teams.service.event.NewTicketCreatedEvent;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.repository.UserRepository;
import io.flowinquiry.modules.usermanagement.service.dto.UserWithTeamRoleDTO;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@AllArgsConstructor
public class NewTicketCreatedNotificationEventListener {
    private final TicketService ticketService;
    private final NotificationRepository notificationRepository;
    private final TeamRepository teamRepository;
    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final SseController sseController;

    @Async("asyncTaskExecutor")
    @Transactional
    @EventListener
    public void onNewTicketCreated(NewTicketCreatedEvent event) {
        TicketDTO ticketDTO = ticketService.getTicketById(event.getTicket().getId());
        User requestUser =
                userRepository
                        .findOneById(ticketDTO.getRequestUserId())
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "User not found: " + ticketDTO.getRequestUserId()));
        String html =
                div().withStyle(NOTIFICATION_CONTAINER_STYLE)
                        .with(
                                userAvatarLink(requestUser),
                                span(" has created a new ticket "),
                                a(ticketDTO.getRequestTitle()).withHref(buildTicketPath(ticketDTO)))
                        .render();

        List<UserWithTeamRoleDTO> usersInTeam =
                teamRepository.findUsersByTeamId(ticketDTO.getTeamId());

        List<Notification> notifications = new ArrayList<>();

        for (UserWithTeamRoleDTO user : usersInTeam) {
            if (!user.getId().equals(ticketDTO.getRequestUserId())) {
                Notification notification =
                        Notification.builder()
                                .content(html)
                                .type(NotificationType.INFO)
                                .user(User.builder().id(user.getId()).build())
                                .isRead(false)
                                .build();

                notifications.add(notification);
            }
        }

        List<Notification> savedNotifications = notificationRepository.saveAll(notifications);
        for (Notification notification : savedNotifications) {
            sseController.sendEventToUser(
                    notification.getUser().getId(), NOTIFICATION, notification);
        }

        ActivityLog activityLog =
                ActivityLog.builder()
                        .entityId(ticketDTO.getTeamId())
                        .entityType(EntityType.Team)
                        .content(html)
                        .build();
        activityLogRepository.save(activityLog);
    }
}
