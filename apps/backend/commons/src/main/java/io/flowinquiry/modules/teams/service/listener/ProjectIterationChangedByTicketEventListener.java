package io.flowinquiry.modules.teams.service.listener;

import static io.flowinquiry.modules.shared.domain.EventPayloadType.UPDATED_ITERATION;

import io.flowinquiry.modules.shared.controller.SseController;
import io.flowinquiry.modules.teams.repository.TeamRepository;
import io.flowinquiry.modules.teams.repository.TicketRepository;
import io.flowinquiry.modules.teams.service.dto.ProjectIterationDTO;
import io.flowinquiry.modules.teams.service.event.ProjectIterationChangedByTicketEvent;
import io.flowinquiry.modules.usermanagement.service.dto.UserWithTeamRoleDTO;
import java.util.List;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ProjectIterationChangedByTicketEventListener {

    private TeamRepository teamRepository;
    private TicketRepository ticketRepository;
    private SseController sseController;

    @Async("asyncTaskExecutor")
    @EventListener
    @Transactional
    public void onProjectIterationChangedByTicket(ProjectIterationChangedByTicketEvent event) {
        Long iterationId = event.getTicket().getEpicId();
        Long teamId = event.getTicket().getTeamId();
        if (iterationId != null) {
            List<Long> userIds =
                    teamRepository.findUsersByTeamId(teamId).stream()
                            .map(UserWithTeamRoleDTO::getId)
                            .toList();
            Long totalStoryPointsByEpicId =
                    ticketRepository.getTotalStoryPointsByIterationId(
                            event.getTicket().getIterationId());
            sseController.sendEventToUsers(
                    userIds,
                    UPDATED_ITERATION,
                    ProjectIterationDTO.builder()
                            .id(iterationId)
                            .totalStoryPoints(totalStoryPointsByEpicId)
                            .build());
        }
    }
}
