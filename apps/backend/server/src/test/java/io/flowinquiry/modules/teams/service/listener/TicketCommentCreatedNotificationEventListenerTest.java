package io.flowinquiry.modules.teams.service.listener;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import io.flowinquiry.exceptions.ResourceNotFoundException;
import io.flowinquiry.modules.collab.domain.ActivityLog;
import io.flowinquiry.modules.collab.domain.EntityType;
import io.flowinquiry.modules.collab.domain.Notification;
import io.flowinquiry.modules.collab.domain.NotificationType;
import io.flowinquiry.modules.collab.repository.ActivityLogRepository;
import io.flowinquiry.modules.collab.repository.NotificationRepository;
import io.flowinquiry.modules.collab.service.dto.CommentDTO;
import io.flowinquiry.modules.shared.controller.SseController;
import io.flowinquiry.modules.shared.domain.EventPayloadType;
import io.flowinquiry.modules.teams.repository.TeamRepository;
import io.flowinquiry.modules.teams.service.TicketService;
import io.flowinquiry.modules.teams.service.dto.TicketDTO;
import io.flowinquiry.modules.teams.service.event.TicketCommentCreatedEvent;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.repository.UserRepository;
import io.flowinquiry.modules.usermanagement.service.dto.UserWithTeamRoleDTO;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class TicketCommentCreatedNotificationEventListenerTest {

    @Mock private UserRepository userRepository;

    @Mock private TicketService ticketService;

    @Mock private TeamRepository teamRepository;

    @Mock private NotificationRepository notificationRepository;

    @Mock private ActivityLogRepository activityLogRepository;

    @Mock private SseController sseController;

    private TicketCommentCreatedNotificationEventListener listener;

    @BeforeEach
    public void setup() {
        listener =
                new TicketCommentCreatedNotificationEventListener(
                        userRepository,
                        ticketService,
                        teamRepository,
                        notificationRepository,
                        activityLogRepository,
                        sseController);
    }

    @Test
    public void testOnTicketCommentCreated_Success() {
        // Given
        Long commentId = 1L;
        Long ticketId = 10L;
        Long teamId = 100L;
        Long commenterId = 1001L;
        Long otherUserId1 = 1002L;
        Long otherUserId2 = 1003L;
        String commentContent = "This is a test comment";

        CommentDTO commentDTO = new CommentDTO();
        commentDTO.setId(commentId);
        commentDTO.setContent(commentContent);
        commentDTO.setCreatedById(commenterId);
        commentDTO.setEntityId(ticketId);
        commentDTO.setEntityType(EntityType.Ticket);

        User commenterUser =
                User.builder().id(commenterId).firstName("John").lastName("Doe").build();

        TicketDTO ticketDTO =
                TicketDTO.builder().id(ticketId).teamId(teamId).requestTitle("Test Ticket").build();

        UserWithTeamRoleDTO commenterDTO =
                new UserWithTeamRoleDTO(
                        commenterId,
                        "john.doe@example.com",
                        "John",
                        "Doe",
                        "UTC",
                        null,
                        "Developer",
                        teamId,
                        "MEMBER");

        UserWithTeamRoleDTO otherUser1DTO =
                new UserWithTeamRoleDTO(
                        otherUserId1,
                        "jane.smith@example.com",
                        "Jane",
                        "Smith",
                        "UTC",
                        null,
                        "Manager",
                        teamId,
                        "ADMIN");

        UserWithTeamRoleDTO otherUser2DTO =
                new UserWithTeamRoleDTO(
                        otherUserId2,
                        "bob.johnson@example.com",
                        "Bob",
                        "Johnson",
                        "UTC",
                        null,
                        "Designer",
                        teamId,
                        "MEMBER");

        List<UserWithTeamRoleDTO> usersInTeam =
                Arrays.asList(commenterDTO, otherUser1DTO, otherUser2DTO);

        Notification notification1 =
                Notification.builder().id(1L).user(User.builder().id(otherUserId1).build()).build();

        Notification notification2 =
                Notification.builder().id(2L).user(User.builder().id(otherUserId2).build()).build();

        List<Notification> savedNotifications = Arrays.asList(notification1, notification2);

        TicketCommentCreatedEvent event = new TicketCommentCreatedEvent(this, commentDTO);

        when(userRepository.findById(commenterId)).thenReturn(Optional.of(commenterUser));
        when(ticketService.getTicketById(ticketId)).thenReturn(ticketDTO);
        when(teamRepository.findUsersByTeamId(teamId)).thenReturn(usersInTeam);
        when(notificationRepository.saveAll(any())).thenReturn(savedNotifications);

        // When
        listener.onTicketCommentCreated(event);

        // Then
        verify(userRepository).findById(commenterId);
        verify(ticketService).getTicketById(ticketId);
        verify(teamRepository).findUsersByTeamId(teamId);

        ArgumentCaptor<List<Notification>> notificationsCaptor =
                ArgumentCaptor.forClass(List.class);
        verify(notificationRepository).saveAll(notificationsCaptor.capture());

        List<Notification> capturedNotifications = notificationsCaptor.getValue();
        assert capturedNotifications.size() == 2;

        for (Notification notification : capturedNotifications) {
            assert notification.getType().equals(NotificationType.INFO);
            assert notification.getIsRead().equals(false);
        }

        verify(sseController, times(2))
                .sendEventToUser(
                        anyLong(), eq(EventPayloadType.NOTIFICATION), any(Notification.class));

        ArgumentCaptor<ActivityLog> activityLogCaptor = ArgumentCaptor.forClass(ActivityLog.class);
        verify(activityLogRepository).save(activityLogCaptor.capture());

        ActivityLog capturedActivityLog = activityLogCaptor.getValue();
        assert capturedActivityLog.getEntityId().equals(teamId);
        assert capturedActivityLog.getEntityType().equals(EntityType.Team);
    }

    @Test
    public void testOnTicketCommentCreated_UserNotFound() {
        // Given
        Long commentId = 1L;
        Long ticketId = 10L;
        Long commenterId = 1001L;
        String commentContent = "This is a test comment";

        CommentDTO commentDTO = new CommentDTO();
        commentDTO.setId(commentId);
        commentDTO.setContent(commentContent);
        commentDTO.setCreatedById(commenterId);
        commentDTO.setEntityId(ticketId);
        commentDTO.setEntityType(EntityType.Ticket);

        TicketCommentCreatedEvent event = new TicketCommentCreatedEvent(this, commentDTO);

        when(userRepository.findById(commenterId)).thenReturn(Optional.empty());

        // When & Then
        try {
            listener.onTicketCommentCreated(event);
        } catch (ResourceNotFoundException e) {
            assert e.getMessage().contains("User not found");
        }

        verify(userRepository).findById(commenterId);
    }
}
