package io.flowinquiry.modules.teams.service.listener;

import static io.flowinquiry.modules.shared.domain.EventPayloadType.NEW_TICKET;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
import io.flowinquiry.modules.shared.controller.SseController;
import io.flowinquiry.modules.teams.repository.TeamRepository;
import io.flowinquiry.modules.teams.service.TicketService;
import io.flowinquiry.modules.teams.service.dto.TicketDTO;
import io.flowinquiry.modules.teams.service.event.NewTicketCreatedEvent;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.repository.UserRepository;
import io.flowinquiry.modules.usermanagement.service.dto.UserWithTeamRoleDTO;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class NewTicketCreatedNotificationEventListenerTest {

    @Mock private TicketService ticketService;

    @Mock private NotificationRepository notificationRepository;

    @Mock private TeamRepository teamRepository;

    @Mock private ActivityLogRepository activityLogRepository;

    @Mock private UserRepository userRepository;

    @Mock private SseController sseController;

    private NewTicketCreatedNotificationEventListener listener;

    @BeforeEach
    public void setup() {
        listener =
                new NewTicketCreatedNotificationEventListener(
                        ticketService,
                        notificationRepository,
                        teamRepository,
                        activityLogRepository,
                        userRepository,
                        sseController);
    }

    @Test
    public void testOnNewTicketCreated_WithNoOtherUsers() {
        // Given
        Long ticketId = 1L;
        Long teamId = 10L;
        Long requestUserId = 100L;
        String requestTitle = "Test Ticket";

        TicketDTO ticketDTO =
                TicketDTO.builder()
                        .id(ticketId)
                        .teamId(teamId)
                        .requestUserId(requestUserId)
                        .requestTitle(requestTitle)
                        .build();

        NewTicketCreatedEvent event = new NewTicketCreatedEvent(this, ticketDTO);

        User requestUser =
                User.builder().id(requestUserId).firstName("John").lastName("Doe").build();

        UserWithTeamRoleDTO requestUserDTO =
                new UserWithTeamRoleDTO(
                        requestUserId,
                        "john.doe@example.com",
                        "John",
                        "Doe",
                        "UTC",
                        null,
                        "Developer",
                        teamId,
                        "MEMBER");

        when(ticketService.getTicketById(ticketId)).thenReturn(ticketDTO);
        when(userRepository.findOneById(requestUserId)).thenReturn(Optional.of(requestUser));
        when(teamRepository.findUsersByTeamId(teamId))
                .thenReturn(Collections.singletonList(requestUserDTO));

        // When
        listener.onNewTicketCreated(event);

        // Then
        verify(ticketService).getTicketById(ticketId);
        verify(userRepository).findOneById(requestUserId);
        verify(teamRepository).findUsersByTeamId(teamId);
        verify(notificationRepository).saveAll(Collections.emptyList());

        ArgumentCaptor<ActivityLog> activityLogCaptor = ArgumentCaptor.forClass(ActivityLog.class);
        verify(activityLogRepository).save(activityLogCaptor.capture());

        ActivityLog capturedActivityLog = activityLogCaptor.getValue();
        assert capturedActivityLog.getEntityId().equals(teamId);
        assert capturedActivityLog.getEntityType().equals(EntityType.Team);
    }

    @Test
    public void testOnNewTicketCreated_WithOtherUsers() {
        // Given
        Long ticketId = 1L;
        Long teamId = 10L;
        Long requestUserId = 100L;
        Long otherUserId1 = 101L;
        Long otherUserId2 = 102L;
        String requestTitle = "Test Ticket";

        TicketDTO ticketDTO =
                TicketDTO.builder()
                        .id(ticketId)
                        .teamId(teamId)
                        .requestUserId(requestUserId)
                        .requestTitle(requestTitle)
                        .build();

        NewTicketCreatedEvent event = new NewTicketCreatedEvent(this, ticketDTO);

        User requestUser =
                User.builder().id(requestUserId).firstName("John").lastName("Doe").build();

        UserWithTeamRoleDTO requestUserDTO =
                new UserWithTeamRoleDTO(
                        requestUserId,
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
                Arrays.asList(requestUserDTO, otherUser1DTO, otherUser2DTO);

        when(ticketService.getTicketById(ticketId)).thenReturn(ticketDTO);
        when(userRepository.findOneById(requestUserId)).thenReturn(Optional.of(requestUser));
        when(teamRepository.findUsersByTeamId(teamId)).thenReturn(usersInTeam);

        Notification notification1 =
                Notification.builder().id(1L).user(User.builder().id(otherUserId1).build()).build();

        Notification notification2 =
                Notification.builder().id(2L).user(User.builder().id(otherUserId2).build()).build();

        List<Notification> savedNotifications = Arrays.asList(notification1, notification2);
        when(notificationRepository.saveAll(any())).thenReturn(savedNotifications);

        // When
        listener.onNewTicketCreated(event);

        // Then
        verify(ticketService).getTicketById(ticketId);
        verify(userRepository).findOneById(requestUserId);
        verify(teamRepository).findUsersByTeamId(teamId);

        ArgumentCaptor<List<Notification>> notificationsCaptor =
                ArgumentCaptor.forClass(List.class);
        verify(notificationRepository).saveAll(notificationsCaptor.capture());

        List<Notification> capturedNotifications = notificationsCaptor.getValue();
        assert capturedNotifications.size() == 2;

        for (Notification notification : capturedNotifications) {
            assertEquals(NotificationType.INFO, notification.getType());
            assertFalse(notification.getIsRead());
        }

        verify(sseController, times(2))
                .sendEventToUser(anyLong(), eq(NEW_TICKET), any(Notification.class));

        ArgumentCaptor<ActivityLog> activityLogCaptor = ArgumentCaptor.forClass(ActivityLog.class);
        verify(activityLogRepository).save(activityLogCaptor.capture());

        ActivityLog capturedActivityLog = activityLogCaptor.getValue();
        assert capturedActivityLog.getEntityId().equals(teamId);
        assert capturedActivityLog.getEntityType().equals(EntityType.Team);
    }

    @Test
    public void testOnNewTicketCreated_UserNotFound() {
        // Given
        Long ticketId = 1L;
        Long teamId = 10L;
        Long requestUserId = 100L;
        String requestTitle = "Test Ticket";

        TicketDTO ticketDTO =
                TicketDTO.builder()
                        .id(ticketId)
                        .teamId(teamId)
                        .requestUserId(requestUserId)
                        .requestTitle(requestTitle)
                        .build();

        NewTicketCreatedEvent event = new NewTicketCreatedEvent(this, ticketDTO);

        when(ticketService.getTicketById(ticketId)).thenReturn(ticketDTO);
        when(userRepository.findOneById(requestUserId)).thenReturn(Optional.empty());

        // When & Then
        try {
            listener.onNewTicketCreated(event);
        } catch (ResourceNotFoundException e) {
            assert e.getMessage().contains("User not found");
        }

        verify(ticketService).getTicketById(ticketId);
        verify(userRepository).findOneById(requestUserId);
    }
}
