package io.flowinquiry.modules.teams.service;

import static io.flowinquiry.modules.teams.domain.WorkflowTransitionHistoryStatus.COMPLETED;
import static io.flowinquiry.modules.teams.domain.WorkflowTransitionHistoryStatus.ESCALATED;
import static io.flowinquiry.modules.teams.domain.WorkflowTransitionHistoryStatus.IN_PROGRESS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.flowinquiry.IntegrationTest;
import io.flowinquiry.exceptions.ResourceNotFoundException;
import io.flowinquiry.modules.teams.domain.Team;
import io.flowinquiry.modules.teams.domain.Ticket;
import io.flowinquiry.modules.teams.domain.TicketPriority;
import io.flowinquiry.modules.teams.domain.Workflow;
import io.flowinquiry.modules.teams.domain.WorkflowState;
import io.flowinquiry.modules.teams.domain.WorkflowTransition;
import io.flowinquiry.modules.teams.domain.WorkflowTransitionHistory;
import io.flowinquiry.modules.teams.repository.TeamRepository;
import io.flowinquiry.modules.teams.repository.TicketRepository;
import io.flowinquiry.modules.teams.repository.WorkflowRepository;
import io.flowinquiry.modules.teams.repository.WorkflowStateRepository;
import io.flowinquiry.modules.teams.repository.WorkflowTransitionHistoryRepository;
import io.flowinquiry.modules.teams.repository.WorkflowTransitionRepository;
import io.flowinquiry.modules.teams.service.dto.TransitionItemCollectionDTO;
import io.flowinquiry.modules.teams.service.dto.TransitionItemDTO;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
public class WorkflowTransitionHistoryServiceIT {

    @Autowired private WorkflowTransitionHistoryService workflowTransitionHistoryService;

    @Autowired private WorkflowTransitionHistoryRepository workflowTransitionHistoryRepository;

    @Autowired private TicketRepository ticketRepository;

    @Autowired private WorkflowRepository workflowRepository;

    @Autowired private WorkflowStateRepository workflowStateRepository;

    @Autowired private WorkflowTransitionRepository workflowTransitionRepository;

    @Autowired private TeamRepository teamRepository;

    @Autowired private UserRepository userRepository;

    private Ticket testTicket;
    private WorkflowState fromState;
    private WorkflowState toState;
    private WorkflowTransition transition;

    @BeforeEach
    public void setup() {
        // Get existing workflow
        Workflow workflow = workflowRepository.findById(1L).orElseThrow();

        // Get or create workflow states
        fromState =
                workflowStateRepository
                        .findById(1L)
                        .orElseGet(
                                () -> {
                                    WorkflowState state = new WorkflowState();
                                    state.setWorkflow(workflow);
                                    state.setStateName("Test From State");
                                    state.setIsInitial(true);
                                    state.setIsFinal(false);
                                    return workflowStateRepository.save(state);
                                });

        toState =
                workflowStateRepository
                        .findById(2L)
                        .orElseGet(
                                () -> {
                                    WorkflowState state = new WorkflowState();
                                    state.setWorkflow(workflow);
                                    state.setStateName("Test To State");
                                    state.setIsInitial(false);
                                    state.setIsFinal(true);
                                    return workflowStateRepository.save(state);
                                });

        // Ensure toState is final
        if (!toState.getIsFinal()) {
            toState.setIsFinal(true);
            toState = workflowStateRepository.save(toState);
        }

        // Get or create workflow transition
        transition =
                workflowTransitionRepository
                        .findByWorkflowIdAndSourceStateIdAndTargetStateId(
                                workflow.getId(), fromState.getId(), toState.getId())
                        .orElseGet(
                                () -> {
                                    WorkflowTransition newTransition = new WorkflowTransition();
                                    newTransition.setWorkflow(workflow);
                                    newTransition.setSourceState(fromState);
                                    newTransition.setTargetState(toState);
                                    newTransition.setEventName("Test Transition");
                                    newTransition.setSlaDuration(24L); // 24 hours
                                    return workflowTransitionRepository.save(newTransition);
                                });

        // Get or create test ticket
        testTicket =
                ticketRepository
                        .findById(1L)
                        .orElseGet(
                                () -> {
                                    // Get a team
                                    Team team = workflow.getOwner();
                                    if (team == null) {
                                        team = new Team();
                                        team.setName("Test Team");
                                        team.setDescription("Test Team Description");
                                        team = teamRepository.save(team);
                                    }

                                    // Get a user
                                    User user = userRepository.findById(1L).orElseThrow();

                                    Ticket ticket =
                                            Ticket.builder()
                                                    .workflow(workflow)
                                                    .team(team)
                                                    .requestUser(user)
                                                    .requestTitle("Test Ticket")
                                                    .requestDescription("Test Description")
                                                    .currentState(fromState)
                                                    .projectTicketNumber(1L)
                                                    .priority(TicketPriority.Medium)
                                                    .build();
                                    return ticketRepository.save(ticket);
                                });
    }

    @Test
    public void testRecordWorkflowTransitionHistory() {
        // When: Record a workflow transition
        workflowTransitionHistoryService.recordWorkflowTransitionHistory(
                testTicket.getId(), fromState.getId(), toState.getId());

        // Then: Verify the transition was recorded
        List<WorkflowTransitionHistory> histories =
                workflowTransitionHistoryRepository.findByTicketId(testTicket.getId());

        assertThat(histories).isNotEmpty();
        WorkflowTransitionHistory history = histories.get(histories.size() - 1);

        assertThat(history.getTicket().getId()).isEqualTo(testTicket.getId());
        assertThat(history.getFromState().getId()).isEqualTo(fromState.getId());
        assertThat(history.getToState().getId()).isEqualTo(toState.getId());
        assertThat(history.getEventName()).isEqualTo(transition.getEventName());

        // Since toState is final, status should be COMPLETED
        assertThat(history.getStatus()).isEqualTo(COMPLETED);

        // Verify SLA due date is set correctly (approximately 24 hours from now)
        assertThat(history.getSlaDueDate()).isNotNull();
        long secondsDifference =
                ChronoUnit.SECONDS.between(history.getTransitionDate(), history.getSlaDueDate());
        // Allow for a small timing difference (within 10 seconds)
        assertThat(secondsDifference)
                .isBetween(
                        transition.getSlaDuration() * 3600 - 10,
                        transition.getSlaDuration() * 3600 + 10);
    }

    @Test
    public void testRecordWorkflowTransitionHistoryWithNonFinalState() {
        // Create a non-final target state
        WorkflowState nonFinalState = new WorkflowState();
        nonFinalState.setWorkflow(testTicket.getWorkflow());
        nonFinalState.setStateName("Non-Final State");
        nonFinalState.setIsInitial(false);
        nonFinalState.setIsFinal(false);
        nonFinalState = workflowStateRepository.save(nonFinalState);

        // Create a transition to the non-final state
        WorkflowTransition nonFinalTransition = new WorkflowTransition();
        nonFinalTransition.setWorkflow(testTicket.getWorkflow());
        nonFinalTransition.setSourceState(fromState);
        nonFinalTransition.setTargetState(nonFinalState);
        nonFinalTransition.setEventName("To Non-Final");
        nonFinalTransition.setSlaDuration(12L); // 12 hours
        nonFinalTransition = workflowTransitionRepository.save(nonFinalTransition);

        // When: Record a workflow transition to a non-final state
        workflowTransitionHistoryService.recordWorkflowTransitionHistory(
                testTicket.getId(), fromState.getId(), nonFinalState.getId());

        // Then: Verify the transition was recorded with In_Progress status
        List<WorkflowTransitionHistory> histories =
                workflowTransitionHistoryRepository.findByTicketId(testTicket.getId());

        assertThat(histories).isNotEmpty();
        WorkflowTransitionHistory history = histories.get(histories.size() - 1);

        assertThat(history.getToState().getId()).isEqualTo(nonFinalState.getId());
        assertThat(history.getStatus()).isEqualTo(IN_PROGRESS);
    }

    @Test
    public void testRecordWorkflowTransitionHistoryWithInvalidTicket() {
        // When/Then: Attempt to record a transition for a non-existent ticket
        assertThatThrownBy(
                        () ->
                                workflowTransitionHistoryService.recordWorkflowTransitionHistory(
                                        999L, fromState.getId(), toState.getId()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Ticket not found");
    }

    @Test
    public void testRecordWorkflowTransitionHistoryWithInvalidTransition() {
        // When/Then: Attempt to record a non-existent transition
        assertThatThrownBy(
                        () ->
                                workflowTransitionHistoryService.recordWorkflowTransitionHistory(
                                        testTicket.getId(), 999L, 998L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Transition not found");
    }

    @Test
    public void testGetTransitionHistoryByTicketId() {
        // Given: Create some transition history
        workflowTransitionHistoryService.recordWorkflowTransitionHistory(
                testTicket.getId(), fromState.getId(), toState.getId());

        // When: Get transition history for the ticket
        TransitionItemCollectionDTO historyCollection =
                workflowTransitionHistoryService.getTransitionHistoryByTicketId(testTicket.getId());

        // Then: Verify the history collection
        assertThat(historyCollection).isNotNull();
        assertThat(historyCollection.getTicketId()).isEqualTo(testTicket.getId());
        assertThat(historyCollection.getTransitions()).isNotEmpty();

        // Verify the most recent transition
        TransitionItemDTO lastTransition =
                historyCollection
                        .getTransitions()
                        .get(historyCollection.getTransitions().size() - 1);

        assertThat(lastTransition.getFromState()).isEqualTo(fromState.getStateName());
        assertThat(lastTransition.getToState()).isEqualTo(toState.getStateName());
        assertThat(lastTransition.getEventName()).isEqualTo(transition.getEventName());
        assertThat(lastTransition.getStatus()).isEqualTo(COMPLETED.name());
    }

    @Test
    public void testGetTransitionHistoryByNonExistentTicketId() {
        // When: Get transition history for a non-existent ticket
        TransitionItemCollectionDTO historyCollection =
                workflowTransitionHistoryService.getTransitionHistoryByTicketId(999L);

        // Then: Verify an empty collection is returned
        assertThat(historyCollection).isNotNull();
        assertThat(historyCollection.getTicketId()).isEqualTo(999L);
        assertThat(historyCollection.getTransitions()).isEmpty();
    }

    @Test
    public void testGetViolatingTransitions() {
        // Given: Create a transition with a soon-to-expire SLA
        WorkflowTransitionHistory history = new WorkflowTransitionHistory();
        history.setTicket(testTicket);
        history.setFromState(fromState);
        history.setToState(toState);
        history.setEventName("Test Event");
        history.setTransitionDate(Instant.now().minus(23, ChronoUnit.HOURS));
        history.setSlaDueDate(Instant.now().plus(1, ChronoUnit.HOURS)); // Due in 1 hour
        history.setStatus(IN_PROGRESS);
        workflowTransitionHistoryRepository.save(history);

        // When: Check for transitions that will violate SLA in the next 2 hours
        List<WorkflowTransitionHistory> violatingTransitions =
                workflowTransitionHistoryService.getViolatingTransitions(
                        7200); // 2 hours in seconds

        // Then: Verify our transition is in the list
        assertThat(violatingTransitions)
                .isNotEmpty()
                .anyMatch(t -> t.getId().equals(history.getId()));
    }

    @Test
    public void testGetViolatedTransitions() {
        // Given: Create a transition with an expired SLA
        WorkflowTransitionHistory history = new WorkflowTransitionHistory();
        history.setTicket(testTicket);
        history.setFromState(fromState);
        history.setToState(toState);
        history.setEventName("Test Event");
        history.setTransitionDate(Instant.now().minus(25, ChronoUnit.HOURS));
        history.setSlaDueDate(Instant.now().minus(1, ChronoUnit.HOURS)); // Expired 1 hour ago
        history.setStatus(IN_PROGRESS);
        workflowTransitionHistoryRepository.save(history);

        // When: Check for transitions that have already violated SLA
        List<WorkflowTransitionHistory> violatedTransitions =
                workflowTransitionHistoryService.getViolatedTransitions();

        // Then: Verify our transition is in the list
        assertThat(violatedTransitions)
                .isNotEmpty()
                .anyMatch(t -> t.getId().equals(history.getId()));
    }

    @Test
    public void testEscalateTransition() {
        // Given: Create a transition
        WorkflowTransitionHistory history = new WorkflowTransitionHistory();
        history.setTicket(testTicket);
        history.setFromState(fromState);
        history.setToState(toState);
        history.setEventName("Test Event");
        history.setTransitionDate(Instant.now());
        history.setSlaDueDate(Instant.now().plus(24, ChronoUnit.HOURS));
        history.setStatus(IN_PROGRESS);
        history = workflowTransitionHistoryRepository.save(history);

        // When: Escalate the transition
        workflowTransitionHistoryService.escalateTransition(history.getId());

        // Then: Verify the transition status is updated to Escalated
        WorkflowTransitionHistory updatedHistory =
                workflowTransitionHistoryRepository.findById(history.getId()).orElseThrow();

        assertThat(updatedHistory.getStatus()).isEqualTo(ESCALATED);
    }

    @Test
    public void testEscalateNonExistentTransition() {
        // When/Then: Attempt to escalate a non-existent transition
        assertThatThrownBy(() -> workflowTransitionHistoryService.escalateTransition(999L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Transition not found");
    }
}
