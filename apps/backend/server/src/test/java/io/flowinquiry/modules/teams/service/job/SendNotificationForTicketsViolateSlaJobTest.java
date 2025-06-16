package io.flowinquiry.modules.teams.service.job;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import io.flowinquiry.modules.collab.EmailContext;
import io.flowinquiry.modules.collab.domain.Notification;
import io.flowinquiry.modules.collab.domain.NotificationType;
import io.flowinquiry.modules.collab.service.MailService;
import io.flowinquiry.modules.shared.service.cache.DeduplicationCacheService;
import io.flowinquiry.modules.teams.domain.Team;
import io.flowinquiry.modules.teams.domain.Ticket;
import io.flowinquiry.modules.teams.domain.Workflow;
import io.flowinquiry.modules.teams.domain.WorkflowState;
import io.flowinquiry.modules.teams.domain.WorkflowTransitionHistory;
import io.flowinquiry.modules.teams.domain.WorkflowTransitionHistoryStatus;
import io.flowinquiry.modules.teams.service.TeamService;
import io.flowinquiry.modules.teams.service.WorkflowTransitionHistoryService;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.service.dto.UserDTO;
import io.flowinquiry.modules.usermanagement.service.mapper.UserMapper;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.MessageSource;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@ExtendWith(MockitoExtension.class)
public class SendNotificationForTicketsViolateSlaJobTest {

    @Mock private WorkflowTransitionHistoryService workflowTransitionHistoryService;

    @Mock private SimpMessagingTemplate messageTemplate;

    @Mock private MailService mailService;

    @Mock private DeduplicationCacheService deduplicationCacheService;

    @Mock private TeamService teamService;

    @Mock private UserMapper userMapper;

    @Mock private MessageSource messageSource;

    private SendNotificationForTicketsViolateSlaJob job;

    @BeforeEach
    public void setup() {
        job =
                new SendNotificationForTicketsViolateSlaJob(
                        messageTemplate,
                        teamService,
                        workflowTransitionHistoryService,
                        mailService,
                        deduplicationCacheService,
                        userMapper,
                        messageSource);
    }

    @Test
    public void testRunWithViolatingTickets() {
        // Given
        WorkflowState fromState = WorkflowState.builder().id(1L).stateName("From State").build();

        WorkflowState toState = WorkflowState.builder().id(2L).stateName("To State").build();

        Workflow workflow = Workflow.builder().id(3L).build();

        Team team = Team.builder().id(4L).name("Test Team").build();

        User assignUser =
                User.builder()
                        .id(5L)
                        .firstName("Assigned")
                        .lastName("User")
                        .email("assigned@example.com")
                        .build();

        Ticket ticket =
                Ticket.builder()
                        .id(6L)
                        .requestTitle("Test Ticket")
                        .team(team)
                        .assignUser(assignUser)
                        .workflow(workflow)
                        .build();

        Instant now = Instant.now();
        Instant slaDueDate = now.minusSeconds(3600); // Due date in the past (1 hour ago)

        WorkflowTransitionHistory violatingTicket =
                WorkflowTransitionHistory.builder()
                        .id(7L)
                        .ticket(ticket)
                        .fromState(fromState)
                        .toState(toState)
                        .eventName("Test Event")
                        .transitionDate(now.minusSeconds(7200)) // 2 hours ago
                        .slaDueDate(slaDueDate)
                        .status(WorkflowTransitionHistoryStatus.IN_PROGRESS)
                        .build();

        List<WorkflowTransitionHistory> violatingTickets = List.of(violatingTicket);

        User teamManager =
                User.builder()
                        .id(8L)
                        .firstName("Manager")
                        .lastName("User")
                        .email("manager@example.com")
                        .build();

        List<User> teamManagers = List.of(teamManager);

        UserDTO assignUserDTO = new UserDTO();
        assignUserDTO.setId(assignUser.getId());
        assignUserDTO.setEmail(assignUser.getEmail());

        UserDTO teamManagerDTO = new UserDTO();
        teamManagerDTO.setId(teamManager.getId());
        teamManagerDTO.setEmail(teamManager.getEmail());

        // Mock service calls
        when(workflowTransitionHistoryService.getViolatedTransitions())
                .thenReturn(violatingTickets);
        when(teamService.getTeamManagers(team.getId())).thenReturn(teamManagers);
        when(userMapper.toDto(assignUser)).thenReturn(assignUserDTO);
        when(userMapper.toDto(teamManager)).thenReturn(teamManagerDTO);
        when(deduplicationCacheService.containsKey(anyString())).thenReturn(false);

        // When
        job.run();

        // Then
        // Verify escalation
        verify(workflowTransitionHistoryService).escalateTransition(violatingTicket.getId());

        // Verify notifications sent to both assign user and team manager
        ArgumentCaptor<String> userIdCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Notification> notificationCaptor =
                ArgumentCaptor.forClass(Notification.class);

        // Should send 2 notifications (one to assignUser, one to teamManager)
        verify(messageTemplate, times(2))
                .convertAndSendToUser(
                        userIdCaptor.capture(),
                        eq("/queue/notifications"),
                        notificationCaptor.capture());

        List<String> capturedUserIds = userIdCaptor.getAllValues();
        List<Notification> capturedNotifications = notificationCaptor.getAllValues();

        // Verify notification properties
        for (Notification notification : capturedNotifications) {
            assert notification.getType() == NotificationType.SLA_BREACH;
            assert notification.getContent().contains("Test Ticket");
            assert !notification.getIsRead();
        }

        // Verify emails sent - just verify the method was called
        verify(mailService, times(2)).sendEmail(any(EmailContext.class));

        // Verify deduplication cache entries
        verify(deduplicationCacheService, times(2)).put(anyString(), any(Duration.class));
    }

    @Test
    public void testRunWithNoViolatingTickets() {
        // Given
        when(workflowTransitionHistoryService.getViolatedTransitions())
                .thenReturn(Collections.emptyList());

        // When
        job.run();

        // Then
        verify(workflowTransitionHistoryService, never()).escalateTransition(anyLong());
        verify(teamService, never()).getTeamManagers(anyLong());
        verify(messageTemplate, never()).convertAndSendToUser(anyString(), anyString(), any());
        verify(mailService, never()).sendEmail(any(EmailContext.class));
        verify(deduplicationCacheService, never()).put(anyString(), any(Duration.class));
    }

    @Test
    public void testRunWithNullAssignUser() {
        // Given
        WorkflowState fromState = WorkflowState.builder().id(1L).stateName("From State").build();

        WorkflowState toState = WorkflowState.builder().id(2L).stateName("To State").build();

        Workflow workflow = Workflow.builder().id(3L).build();

        Team team = Team.builder().id(4L).name("Test Team").build();

        // Ticket with null assignUser
        Ticket ticket =
                Ticket.builder()
                        .id(6L)
                        .requestTitle("Test Ticket")
                        .team(team)
                        .assignUser(null) // No assigned user
                        .workflow(workflow)
                        .build();

        Instant now = Instant.now();
        Instant slaDueDate = now.minusSeconds(3600); // Due date in the past (1 hour ago)

        WorkflowTransitionHistory violatingTicket =
                WorkflowTransitionHistory.builder()
                        .id(7L)
                        .ticket(ticket)
                        .fromState(fromState)
                        .toState(toState)
                        .eventName("Test Event")
                        .transitionDate(now.minusSeconds(7200)) // 2 hours ago
                        .slaDueDate(slaDueDate)
                        .status(WorkflowTransitionHistoryStatus.IN_PROGRESS)
                        .build();

        List<WorkflowTransitionHistory> violatingTickets = List.of(violatingTicket);

        User teamManager =
                User.builder()
                        .id(8L)
                        .firstName("Manager")
                        .lastName("User")
                        .email("manager@example.com")
                        .build();

        List<User> teamManagers = List.of(teamManager);

        UserDTO teamManagerDTO = new UserDTO();
        teamManagerDTO.setId(teamManager.getId());
        teamManagerDTO.setEmail(teamManager.getEmail());

        // Mock service calls
        when(workflowTransitionHistoryService.getViolatedTransitions())
                .thenReturn(violatingTickets);
        when(teamService.getTeamManagers(team.getId())).thenReturn(teamManagers);
        when(userMapper.toDto(teamManager)).thenReturn(teamManagerDTO);
        when(deduplicationCacheService.containsKey(anyString())).thenReturn(false);

        // When
        job.run();

        // Then
        // Verify escalation
        verify(workflowTransitionHistoryService).escalateTransition(violatingTicket.getId());

        // Verify notifications sent to team manager only
        ArgumentCaptor<String> userIdCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Notification> notificationCaptor =
                ArgumentCaptor.forClass(Notification.class);

        // Should send 1 notification (to teamManager only)
        verify(messageTemplate, times(1))
                .convertAndSendToUser(
                        userIdCaptor.capture(),
                        eq("/queue/notifications"),
                        notificationCaptor.capture());

        String capturedUserId = userIdCaptor.getValue();
        Notification capturedNotification = notificationCaptor.getValue();

        // Verify notification properties
        assert capturedUserId.equals(String.valueOf(teamManager.getId()));
        assert capturedNotification.getType() == NotificationType.SLA_BREACH;
        assert capturedNotification.getContent().contains("Test Ticket");
        assert !capturedNotification.getIsRead();

        // Verify email sent - just verify the method was called
        verify(mailService, times(1)).sendEmail(any(EmailContext.class));

        // Verify deduplication cache entry
        verify(deduplicationCacheService, times(1)).put(anyString(), any(Duration.class));
    }

    @Test
    public void testRunWithDuplicateNotification() {
        // Given
        WorkflowState fromState = WorkflowState.builder().id(1L).stateName("From State").build();

        WorkflowState toState = WorkflowState.builder().id(2L).stateName("To State").build();

        Workflow workflow = Workflow.builder().id(3L).build();

        Team team = Team.builder().id(4L).name("Test Team").build();

        User assignUser =
                User.builder()
                        .id(5L)
                        .firstName("Assigned")
                        .lastName("User")
                        .email("assigned@example.com")
                        .build();

        Ticket ticket =
                Ticket.builder()
                        .id(6L)
                        .requestTitle("Test Ticket")
                        .team(team)
                        .assignUser(assignUser)
                        .workflow(workflow)
                        .build();

        Instant now = Instant.now();
        Instant slaDueDate = now.minusSeconds(3600); // Due date in the past (1 hour ago)

        WorkflowTransitionHistory violatingTicket =
                WorkflowTransitionHistory.builder()
                        .id(7L)
                        .ticket(ticket)
                        .fromState(fromState)
                        .toState(toState)
                        .eventName("Test Event")
                        .transitionDate(now.minusSeconds(7200)) // 2 hours ago
                        .slaDueDate(slaDueDate)
                        .status(WorkflowTransitionHistoryStatus.IN_PROGRESS)
                        .build();

        List<WorkflowTransitionHistory> violatingTickets = List.of(violatingTicket);

        User teamManager =
                User.builder()
                        .id(8L)
                        .firstName("Manager")
                        .lastName("User")
                        .email("manager@example.com")
                        .build();

        List<User> teamManagers = List.of(teamManager);

        // Mock service calls
        when(workflowTransitionHistoryService.getViolatedTransitions())
                .thenReturn(violatingTickets);
        when(teamService.getTeamManagers(team.getId())).thenReturn(teamManagers);

        // Simulate that notifications have already been sent (keys exist in cache)
        when(deduplicationCacheService.containsKey(anyString())).thenReturn(true);

        // When
        job.run();

        // Then
        // Verify escalation still happens
        verify(workflowTransitionHistoryService).escalateTransition(violatingTicket.getId());

        // Verify no notifications are sent for duplicate violations
        verify(messageTemplate, never()).convertAndSendToUser(anyString(), anyString(), any());
        verify(mailService, never()).sendEmail(any(EmailContext.class));
        verify(deduplicationCacheService, never()).put(anyString(), any(Duration.class));
    }
}
