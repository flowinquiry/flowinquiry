package io.flexwork.modules.teams.service.listener;

import static j2html.TagCreator.*;

import com.flexwork.platform.utils.Obfuscator;
import io.flexwork.modules.collab.domain.ActivityLog;
import io.flexwork.modules.collab.domain.EntityType;
import io.flexwork.modules.collab.repository.ActivityLogRepository;
import io.flexwork.modules.teams.domain.TeamRequest;
import io.flexwork.modules.teams.domain.WorkflowState;
import io.flexwork.modules.teams.repository.TeamRequestRepository;
import io.flexwork.modules.teams.repository.WorkflowStateRepository;
import io.flexwork.modules.teams.service.WorkflowTransitionHistoryService;
import io.flexwork.modules.teams.service.event.TeamRequestWorkStateTransitionEvent;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class TeamRequestWorkStateTransitionEventListener {

    private final ActivityLogRepository activityLogRepository;

    private final TeamRequestRepository teamRequestRepository;

    private final WorkflowStateRepository workflowStateRepository;

    private final WorkflowTransitionHistoryService workflowTransitionHistoryService;

    public TeamRequestWorkStateTransitionEventListener(
            ActivityLogRepository activityLogRepository,
            TeamRequestRepository teamRequestRepository,
            WorkflowStateRepository workflowStateRepository,
            WorkflowTransitionHistoryService workflowTransitionHistoryService) {
        this.activityLogRepository = activityLogRepository;
        this.teamRequestRepository = teamRequestRepository;
        this.workflowStateRepository = workflowStateRepository;
        this.workflowTransitionHistoryService = workflowTransitionHistoryService;
    }

    @Async("auditLogExecutor")
    @EventListener
    @Transactional
    public void onWorkflowStateTransition(TeamRequestWorkStateTransitionEvent event) {
        Long teamRequestId = event.getTeamRequestId();
        Long sourceStateId = event.getSourceStateId();
        Long targetStateId = event.getTargetStateId();

        workflowTransitionHistoryService.recordWorkflowTransitionHistory(
                teamRequestId, sourceStateId, targetStateId);

        WorkflowState sourceState =
                workflowStateRepository
                        .findById(sourceStateId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Can not find workflow state with id "
                                                        + sourceStateId));
        WorkflowState targetState =
                workflowStateRepository
                        .findById(targetStateId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Can not find workflow state with id "
                                                        + targetStateId));

        TeamRequest teamRequest =
                teamRequestRepository
                        .findById(teamRequestId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Can not find team request with id "
                                                        + teamRequestId));
        String html =
                p().with(
                                a(teamRequest.getModifiedByUser().getFirstName()
                                                + " "
                                                + teamRequest.getModifiedByUser().getLastName())
                                        .withHref(
                                                "/portal/users/"
                                                        + Obfuscator.obfuscate(
                                                                teamRequest.getModifiedBy())),
                                text(" updated the ticket "),
                                a(teamRequest.getRequestTitle())
                                        .withHref(
                                                "/portal/teams/"
                                                        + Obfuscator.obfuscate(
                                                                teamRequest.getTeam().getId())
                                                        + "/requests/"
                                                        + Obfuscator.obfuscate(
                                                                teamRequest.getId())),
                                text(" status from "),
                                span(sourceState.getStateName()).withClass("status-old"),
                                text(" to "),
                                span(targetState.getStateName()).withClass("status-new"))
                        .render();
        ActivityLog activityLog =
                ActivityLog.builder()
                        .entityId(teamRequest.getTeam().getId())
                        .entityType(EntityType.Team)
                        .content(html)
                        .build();
        activityLogRepository.save(activityLog);
    }
}
