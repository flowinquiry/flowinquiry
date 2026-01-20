package io.flowinquiry.modules.teams.service.listener;

import static io.flowinquiry.modules.collab.domain.EntityType.Team;
import static io.flowinquiry.modules.shared.domain.EventPayloadType.NOTIFICATION;
import static io.flowinquiry.modules.teams.utils.PathUtils.buildTicketPath;
import static j2html.TagCreator.a;
import static j2html.TagCreator.p;
import static j2html.TagCreator.text;

import io.flowinquiry.exceptions.ResourceNotFoundException;
import io.flowinquiry.modules.collab.domain.ActivityLog;
import io.flowinquiry.modules.collab.domain.Notification;
import io.flowinquiry.modules.collab.domain.NotificationType;
import io.flowinquiry.modules.collab.repository.ActivityLogRepository;
import io.flowinquiry.modules.collab.repository.NotificationRepository;
import io.flowinquiry.modules.collab.service.dto.CommentDTO;
import io.flowinquiry.modules.shared.controller.SseController;
import io.flowinquiry.modules.teams.repository.TeamRepository;
import io.flowinquiry.modules.teams.service.TicketService;
import io.flowinquiry.modules.teams.service.dto.TicketDTO;
import io.flowinquiry.modules.teams.service.event.TicketCommentCreatedEvent;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.repository.UserRepository;
import io.flowinquiry.modules.usermanagement.service.dto.UserWithTeamRoleDTO;
import io.flowinquiry.utils.Obfuscator;
import io.flowinquiry.utils.StringUtils;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@AllArgsConstructor
public class TicketCommentCreatedNotificationEventListener {

    private final UserRepository userRepository;
    private final TicketService ticketService;
    private final TeamRepository teamRepository;
    private final NotificationRepository notificationRepository;
    private final ActivityLogRepository activityLogRepository;
    private final SseController sseController;

    @Async("asyncTaskExecutor")
    @Transactional
    @EventListener
    public void onTicketCommentCreated(TicketCommentCreatedEvent event) {
        CommentDTO commentDTO = event.getCommentDTO();

        User createdUser =
                userRepository
                        .findById(commentDTO.getCreatedById())
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "User not found " + commentDTO.getCreatedById()));
        TicketDTO ticket = ticketService.getTicketById(commentDTO.getEntityId());

        String commentContent = StringUtils.polishedHtmlTagsMessage(commentDTO.getContent());
        String truncatedContent =
                commentContent.length() > 50
                        ? commentContent.substring(0, 50) + "..."
                        : commentContent;

        String html =
                p(
                                a(createdUser.getFirstName() + " " + createdUser.getLastName())
                                        .withHref(
                                                "/portal/users/"
                                                        + Obfuscator.obfuscate(
                                                                createdUser.getId())),
                                text(" has created a new comment for the ticket "),
                                a(buildTicketPath(ticket)),
                                text(": " + truncatedContent))
                        .render();

        List<UserWithTeamRoleDTO> usersInTeam =
                teamRepository.findUsersByTeamId(ticket.getTeamId());

        List<Notification> notifications = new ArrayList<>();

        for (UserWithTeamRoleDTO user : usersInTeam) {
            if (!user.getId().equals(commentDTO.getCreatedById())) {
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
                        .entityId(ticket.getTeamId())
                        .entityType(Team)
                        .content(html)
                        .build();
        activityLogRepository.save(activityLog);
    }
}
