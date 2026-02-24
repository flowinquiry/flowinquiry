package io.flowinquiry.modules.teams.service.listener;

import static io.flowinquiry.modules.shared.domain.EventPayloadType.NOTIFICATION;
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
import io.flowinquiry.modules.teams.service.dto.ProjectDTO;
import io.flowinquiry.modules.teams.service.event.NewProjectCreatedEvent;
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
public class NewProjectCreatedNotificationEventListenerTest {

    @Mock private TeamRepository teamRepository;

    @Mock private NotificationRepository notificationRepository;

    @Mock private ActivityLogRepository activityLogRepository;

    @Mock private UserRepository userRepository;

    @Mock private SseController sseController;

    private NewProjectCreatedNotificationEventListener listener;

    @BeforeEach
    public void setup() {
        listener =
                new NewProjectCreatedNotificationEventListener(
                        teamRepository,
                        notificationRepository,
                        activityLogRepository,
                        userRepository,
                        sseController);
    }

    @Test
    public void testOnNewProjectCreated_WithNoOtherUsers() {
        // Given
        Long projectId = 1L;
        Long teamId = 10L;
        Long createdById = 100L;
        String projectName = "Test Project";

        ProjectDTO projectDTO =
                ProjectDTO.builder()
                        .id(projectId)
                        .name(projectName)
                        .teamId(teamId)
                        .createdBy(createdById)
                        .build();

        NewProjectCreatedEvent event = new NewProjectCreatedEvent(this, projectDTO);

        User creator = User.builder().id(createdById).firstName("John").lastName("Doe").build();

        UserWithTeamRoleDTO creatorDTO =
                new UserWithTeamRoleDTO(
                        createdById,
                        "john.doe@example.com",
                        "John",
                        "Doe",
                        "UTC",
                        null,
                        "Developer",
                        teamId,
                        "MEMBER");

        when(teamRepository.findUsersByTeamId(teamId))
                .thenReturn(Collections.singletonList(creatorDTO));
        when(userRepository.findOneById(createdById)).thenReturn(Optional.of(creator));

        // When
        listener.onNewProjectCreated(event);

        // Then
        verify(teamRepository).findUsersByTeamId(teamId);
        verify(userRepository).findOneById(createdById);
        verify(notificationRepository).saveAll(Collections.emptyList());

        ArgumentCaptor<ActivityLog> activityLogCaptor = ArgumentCaptor.forClass(ActivityLog.class);
        verify(activityLogRepository).save(activityLogCaptor.capture());

        ActivityLog capturedActivityLog = activityLogCaptor.getValue();
        assert capturedActivityLog.getEntityId().equals(teamId);
        assert capturedActivityLog.getEntityType().equals(EntityType.Team);
    }

    @Test
    public void testOnNewProjectCreated_WithOtherUsers() {
        // Given
        Long projectId = 1L;
        Long teamId = 10L;
        Long createdById = 100L;
        Long otherUserId1 = 101L;
        Long otherUserId2 = 102L;
        String projectName = "Test Project";

        ProjectDTO projectDTO =
                ProjectDTO.builder()
                        .id(projectId)
                        .name(projectName)
                        .teamId(teamId)
                        .createdBy(createdById)
                        .build();

        NewProjectCreatedEvent event = new NewProjectCreatedEvent(this, projectDTO);

        User creator = User.builder().id(createdById).firstName("John").lastName("Doe").build();

        UserWithTeamRoleDTO creatorDTO =
                new UserWithTeamRoleDTO(
                        createdById,
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
                Arrays.asList(creatorDTO, otherUser1DTO, otherUser2DTO);

        when(teamRepository.findUsersByTeamId(teamId)).thenReturn(usersInTeam);
        when(userRepository.findOneById(createdById)).thenReturn(Optional.of(creator));

        Notification notification1 =
                Notification.builder().id(1L).user(User.builder().id(otherUserId1).build()).build();

        Notification notification2 =
                Notification.builder().id(2L).user(User.builder().id(otherUserId2).build()).build();

        List<Notification> savedNotifications = Arrays.asList(notification1, notification2);
        when(notificationRepository.saveAll(any())).thenReturn(savedNotifications);

        // When
        listener.onNewProjectCreated(event);

        // Then
        verify(teamRepository).findUsersByTeamId(teamId);
        verify(userRepository).findOneById(createdById);

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
                .sendEventToUser(anyLong(), eq(NOTIFICATION), any(Notification.class));

        ArgumentCaptor<ActivityLog> activityLogCaptor = ArgumentCaptor.forClass(ActivityLog.class);
        verify(activityLogRepository).save(activityLogCaptor.capture());

        ActivityLog capturedActivityLog = activityLogCaptor.getValue();
        assert capturedActivityLog.getEntityId().equals(teamId);
        assert capturedActivityLog.getEntityType().equals(EntityType.Team);
    }

    @Test
    public void testOnNewProjectCreated_UserNotFound() {
        // Given
        Long projectId = 1L;
        Long teamId = 10L;
        Long createdById = 100L;
        String projectName = "Test Project";

        ProjectDTO projectDTO =
                ProjectDTO.builder()
                        .id(projectId)
                        .name(projectName)
                        .teamId(teamId)
                        .createdBy(createdById)
                        .build();

        NewProjectCreatedEvent event = new NewProjectCreatedEvent(this, projectDTO);

        when(teamRepository.findUsersByTeamId(teamId)).thenReturn(Collections.emptyList());
        when(userRepository.findOneById(createdById)).thenReturn(Optional.empty());

        // When & Then
        try {
            listener.onNewProjectCreated(event);
        } catch (ResourceNotFoundException e) {
            assert e.getMessage().contains("User not found");
        }

        verify(teamRepository).findUsersByTeamId(teamId);
        verify(userRepository).findOneById(createdById);
    }
}
