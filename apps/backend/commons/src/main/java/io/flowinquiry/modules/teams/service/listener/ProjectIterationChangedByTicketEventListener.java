package io.flowinquiry.modules.teams.service.listener;

import io.flowinquiry.modules.shared.controller.SseController;
import io.flowinquiry.modules.shared.domain.EventPayload;
import io.flowinquiry.modules.teams.repository.TicketRepository;
import io.flowinquiry.modules.teams.service.dto.ProjectIterationDTO;
import io.flowinquiry.modules.teams.service.event.ProjectIterationChangedByTicketEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ProjectIterationChangedByTicketEventListener {
    private TicketRepository ticketRepository;

    private SseController sseController;

    public ProjectIterationChangedByTicketEventListener(
            TicketRepository ticketRepository, SseController sseController) {
        this.ticketRepository = ticketRepository;
        this.sseController = sseController;
    }

    @Async("asyncTaskExecutor")
    @EventListener
    @Transactional
    public void onProjectIterationChangedByTicket(ProjectIterationChangedByTicketEvent event) {
        Long iterationId = event.getTicket().getEpicId();
        if (iterationId != null) {
            Long totalStoryPointsByEpicId =
                    ticketRepository.getTotalStoryPointsByIterationId(
                            event.getTicket().getIterationId());
            sseController.sendEvent(
                    EventPayload.UPDATED_ITERATION,
                    ProjectIterationDTO.builder()
                            .id(iterationId)
                            .totalStoryPoints(totalStoryPointsByEpicId)
                            .build());
        }
    }
}
