package io.flexwork.modules.teams.service;

import static io.flexwork.modules.teams.domain.WorkflowTransitionHistoryStatus.Completed;
import static io.flexwork.modules.teams.domain.WorkflowTransitionHistoryStatus.In_Progress;

import io.flexwork.modules.teams.domain.TeamRequest;
import io.flexwork.modules.teams.domain.WorkflowTransition;
import io.flexwork.modules.teams.domain.WorkflowTransitionHistory;
import io.flexwork.modules.teams.repository.TeamRequestRepository;
import io.flexwork.modules.teams.repository.WorkflowTransitionHistoryRepository;
import io.flexwork.modules.teams.repository.WorkflowTransitionRepository;
import io.flexwork.modules.teams.service.dto.TransitionItemCollectionDTO;
import io.flexwork.modules.teams.service.mapper.WorkflowTransitionHistoryMapper;
import jakarta.transaction.Transactional;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class WorkflowTransitionHistoryService {

    private final WorkflowTransitionHistoryRepository workflowTransitionHistoryRepository;
    private final TeamRequestRepository teamRequestRepository;
    private final WorkflowTransitionRepository workflowTransitionRepository;
    private final WorkflowTransitionHistoryMapper workflowTransitionHistoryMapper;

    public WorkflowTransitionHistoryService(
            WorkflowTransitionHistoryRepository workflowTransitionHistoryRepository,
            TeamRequestRepository teamRequestRepository,
            WorkflowTransitionRepository workflowTransitionRepository,
            WorkflowTransitionHistoryMapper workflowTransitionHistoryMapper) {
        this.workflowTransitionHistoryRepository = workflowTransitionHistoryRepository;
        this.teamRequestRepository = teamRequestRepository;
        this.workflowTransitionRepository = workflowTransitionRepository;
        this.workflowTransitionHistoryMapper = workflowTransitionHistoryMapper;
    }

    /**
     * Records a state change in the workflow and persists it to WorkflowTransitionHistory.
     *
     * @param teamRequestId The ID of the team request
     * @param fromStateId The ID of the source state
     * @param toStateId The ID of the target state
     */
    @Transactional
    public void recordWorkflowTransitionHistory(
            Long teamRequestId, Long fromStateId, Long toStateId) {
        // Fetch the associated entities
        TeamRequest teamRequest =
                teamRequestRepository
                        .findById(teamRequestId)
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Team request not found: " + teamRequestId));

        WorkflowTransition transition =
                workflowTransitionRepository
                        .findByWorkflowIdAndSourceStateIdAndTargetStateId(
                                teamRequest.getWorkflow().getId(), fromStateId, toStateId)
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Transition not found for the given states"));

        // Calculate SLA due date
        ZonedDateTime slaDueDate = null;
        if (transition.getSlaDuration() != null && transition.getSlaDuration() > 0) {
            slaDueDate =
                    ZonedDateTime.now(ZoneId.of("UTC")).plusSeconds(transition.getSlaDuration());
        }

        // Create and save the WorkflowTransitionHistory entry
        WorkflowTransitionHistory history = new WorkflowTransitionHistory();
        history.setTeamRequest(teamRequest);
        history.setFromState(transition.getSourceState());
        history.setToState(transition.getTargetState());
        history.setEventName(transition.getEventName());
        history.setTransitionDate(ZonedDateTime.now(ZoneId.of("UTC")));
        history.setSlaDueDate(slaDueDate);
        if (transition.getTargetState().getIsFinal()) {
            history.setStatus(Completed);
        } else {
            history.setStatus(In_Progress);
        }

        workflowTransitionHistoryRepository.save(history);
    }

    public TransitionItemCollectionDTO getTransitionHistoryByTicketId(Long ticketId) {
        List<WorkflowTransitionHistory> histories =
                workflowTransitionHistoryRepository.findByTeamRequestId(ticketId);

        if (histories.isEmpty()) {
            return new TransitionItemCollectionDTO(ticketId, Collections.emptyList());
        }

        return workflowTransitionHistoryMapper.toTicketHistoryDto(ticketId, histories);
    }
}
