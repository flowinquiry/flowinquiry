package io.flowinquiry.modules.teams.service.listener;

import io.flowinquiry.modules.shared.controller.SseController;
import io.flowinquiry.modules.shared.domain.EventPayload;
import io.flowinquiry.modules.teams.repository.TicketRepository;
import io.flowinquiry.modules.teams.service.dto.ProjectEpicDTO;
import io.flowinquiry.modules.teams.service.event.ProjectEpicChangedByTicketEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ProjectEpicChangedByTicketEventListener {

    private TicketRepository ticketRepository;

    private SseController sseController;

    public ProjectEpicChangedByTicketEventListener(
            TicketRepository ticketRepository, SseController sseController) {
        this.ticketRepository = ticketRepository;
        this.sseController = sseController;
    }

    @Async("asyncTaskExecutor")
    @EventListener
    @Transactional
    public void onProjectEpicChangedByTicket(ProjectEpicChangedByTicketEvent event) {
        Long epicId = event.getTicket().getEpicId();
        if (epicId != null) {
            Long totalStoryPointsByEpicId =
                    ticketRepository.getTotalStoryPointsByEpicId(event.getTicket().getEpicId());
            sseController.sendEvent(
                    EventPayload.UPDATED_EPIC,
                    ProjectEpicDTO.builder()
                            .id(epicId)
                            .totalStoryPoints(totalStoryPointsByEpicId)
                            .build());
        }
    }
}
