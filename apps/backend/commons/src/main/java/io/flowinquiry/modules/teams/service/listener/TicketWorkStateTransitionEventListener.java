package io.flowinquiry.modules.teams.service.listener;

import static j2html.TagCreator.a;
import static j2html.TagCreator.p;
import static j2html.TagCreator.span;
import static j2html.TagCreator.text;

import io.flowinquiry.modules.collab.domain.ActivityLog;
import io.flowinquiry.modules.collab.domain.EntityType;
import io.flowinquiry.modules.collab.repository.ActivityLogRepository;
import io.flowinquiry.modules.teams.domain.Ticket;
import io.flowinquiry.modules.teams.domain.WorkflowState;
import io.flowinquiry.modules.teams.repository.TicketRepository;
import io.flowinquiry.modules.teams.repository.WorkflowStateRepository;
import io.flowinquiry.modules.teams.service.WorkflowTransitionHistoryService;
import io.flowinquiry.modules.teams.service.event.TicketWorkStateTransitionEvent;
import io.flowinquiry.utils.Obfuscator;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class TicketWorkStateTransitionEventListener {

    private final ActivityLogRepository activityLogRepository;
    private final TicketRepository ticketRepository;
    private final WorkflowStateRepository workflowStateRepository;
    private final WorkflowTransitionHistoryService workflowTransitionHistoryService;

    public TicketWorkStateTransitionEventListener(
            ActivityLogRepository activityLogRepository,
            TicketRepository ticketRepository,
            WorkflowStateRepository workflowStateRepository,
            WorkflowTransitionHistoryService workflowTransitionHistoryService) {
        this.activityLogRepository = activityLogRepository;
        this.ticketRepository = ticketRepository;
        this.workflowStateRepository = workflowStateRepository;
        this.workflowTransitionHistoryService = workflowTransitionHistoryService;
    }

    @Async("asyncTaskExecutor")
    @EventListener
    @Transactional
    public void onWorkflowStateTransition(TicketWorkStateTransitionEvent event) {
        Long ticketId = event.getTicketId();
        Long sourceStateId = event.getSourceStateId();
        Long targetStateId = event.getTargetStateId();

        workflowTransitionHistoryService.recordWorkflowTransitionHistory(
                ticketId, sourceStateId, targetStateId);

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

        Ticket ticket =
                ticketRepository
                        .findById(ticketId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Can not find ticket with id " + ticketId));
        // Handle case when modifiedByUser is null
        String userName = "System";
        String userLink = "";

        if (ticket.getModifiedByUser() != null) {
            userName =
                    ticket.getModifiedByUser().getFirstName()
                            + " "
                            + ticket.getModifiedByUser().getLastName();
            userLink = "/portal/users/" + Obfuscator.obfuscate(ticket.getModifiedBy());
        }

        String html =
                p().with(
                                a(userName).withHref(userLink),
                                text(" updated the ticket "),
                                a(ticket.getRequestTitle())
                                        .withHref(
                                                "/portal/teams/"
                                                        + Obfuscator.obfuscate(
                                                                ticket.getTeam().getId())
                                                        + "/tickets/"
                                                        + Obfuscator.obfuscate(ticket.getId())),
                                text(" status from "),
                                span(sourceState.getStateName()).withClass("status-old"),
                                text(" to "),
                                span(targetState.getStateName()).withClass("status-new"))
                        .render();
        ActivityLog activityLog =
                ActivityLog.builder()
                        .entityId(ticket.getTeam().getId())
                        .entityType(EntityType.Team)
                        .content(html)
                        .build();
        activityLogRepository.save(activityLog);
    }
}
