package io.flowinquiry.modules.teams.service;

import static io.flowinquiry.modules.teams.domain.WorkflowTransitionHistoryStatus.COMPLETED;
import static io.flowinquiry.modules.teams.domain.WorkflowTransitionHistoryStatus.ESCALATED;
import static io.flowinquiry.modules.teams.domain.WorkflowTransitionHistoryStatus.IN_PROGRESS;

import io.flowinquiry.exceptions.ResourceNotFoundException;
import io.flowinquiry.modules.teams.domain.Ticket;
import io.flowinquiry.modules.teams.domain.WorkflowTransition;
import io.flowinquiry.modules.teams.domain.WorkflowTransitionHistory;
import io.flowinquiry.modules.teams.repository.TicketRepository;
import io.flowinquiry.modules.teams.repository.WorkflowTransitionHistoryRepository;
import io.flowinquiry.modules.teams.repository.WorkflowTransitionRepository;
import io.flowinquiry.modules.teams.service.dto.TransitionItemCollectionDTO;
import io.flowinquiry.modules.teams.service.mapper.WorkflowTransitionHistoryMapper;
import jakarta.persistence.EntityNotFoundException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkflowTransitionHistoryService {

    private final WorkflowTransitionHistoryRepository workflowTransitionHistoryRepository;
    private final TicketRepository ticketRepository;
    private final WorkflowTransitionRepository workflowTransitionRepository;
    private final WorkflowTransitionHistoryMapper workflowTransitionHistoryMapper;

    public WorkflowTransitionHistoryService(
            WorkflowTransitionHistoryRepository workflowTransitionHistoryRepository,
            TicketRepository ticketRepository,
            WorkflowTransitionRepository workflowTransitionRepository,
            WorkflowTransitionHistoryMapper workflowTransitionHistoryMapper) {
        this.workflowTransitionHistoryRepository = workflowTransitionHistoryRepository;
        this.ticketRepository = ticketRepository;
        this.workflowTransitionRepository = workflowTransitionRepository;
        this.workflowTransitionHistoryMapper = workflowTransitionHistoryMapper;
    }

    /**
     * Records a state change in the workflow and persists it to WorkflowTransitionHistory.
     *
     * @param ticketId The ID of the ticket
     * @param fromStateId The ID of the source state
     * @param toStateId The ID of the target state
     */
    @Transactional
    public void recordWorkflowTransitionHistory(Long ticketId, Long fromStateId, Long toStateId) {
        // Fetch the associated entities
        Ticket ticket =
                ticketRepository
                        .findById(ticketId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Ticket not found: " + ticketId));

        WorkflowTransition transition =
                workflowTransitionRepository
                        .findByWorkflowIdAndSourceStateIdAndTargetStateId(
                                ticket.getWorkflow().getId(), fromStateId, toStateId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Transition not found for the given states"));

        // Calculate SLA due date
        Instant slaDueDate = null;
        if (transition.getSlaDuration() != null && transition.getSlaDuration() > 0) {
            slaDueDate = Instant.now().plus(transition.getSlaDuration(), ChronoUnit.HOURS);
        }

        // Create and save the WorkflowTransitionHistory entry
        WorkflowTransitionHistory history = new WorkflowTransitionHistory();
        history.setTicket(ticket);
        history.setFromState(transition.getSourceState());
        history.setToState(transition.getTargetState());
        history.setEventName(transition.getEventName());
        history.setTransitionDate(Instant.now());
        history.setSlaDueDate(slaDueDate);
        if (transition.getTargetState().getIsFinal()) {
            history.setStatus(COMPLETED);
        } else {
            history.setStatus(IN_PROGRESS);
        }

        workflowTransitionHistoryRepository.save(history);
    }

    public TransitionItemCollectionDTO getTransitionHistoryByTicketId(Long ticketId) {
        List<WorkflowTransitionHistory> histories =
                workflowTransitionHistoryRepository.findByTicketId(ticketId);

        if (histories.isEmpty()) {
            return new TransitionItemCollectionDTO(ticketId, Collections.emptyList());
        }

        return workflowTransitionHistoryMapper.toTicketHistoryDto(ticketId, histories);
    }

    @Transactional(readOnly = true)
    public List<WorkflowTransitionHistory> getViolatingTransitions(long checkTimeInSeconds) {
        Instant checkTime = Instant.now().plusSeconds(checkTimeInSeconds);
        return workflowTransitionHistoryRepository.findViolatingTransitions(checkTime);
    }

    /**
     * Retrieves workflow transitions that have already violated their SLA.
     *
     * @return A list of violated workflow transitions.
     */
    public List<WorkflowTransitionHistory> getViolatedTransitions() {
        return workflowTransitionHistoryRepository.findViolatingTransitions(Instant.now());
    }

    /**
     * Updates the given workflow transition to 'Escalated' and persists it.
     *
     * @param transitionId The workflow transition history entry to escalate.
     */
    @Transactional
    public void escalateTransition(Long transitionId) {
        WorkflowTransitionHistory violatedTicket =
                workflowTransitionHistoryRepository
                        .findById(transitionId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Transition not found: " + transitionId));

        violatedTicket.setStatus(ESCALATED);
        workflowTransitionHistoryRepository.save(violatedTicket);
    }
}
