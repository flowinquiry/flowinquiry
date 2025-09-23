package io.flowinquiry.modules.teams.service.listener;

import static io.flowinquiry.modules.shared.domain.EventPayloadType.UPDATED_EPIC;

import io.flowinquiry.modules.shared.controller.SseController;
import io.flowinquiry.modules.teams.repository.TeamRepository;
import io.flowinquiry.modules.teams.repository.TicketRepository;
import io.flowinquiry.modules.teams.service.dto.ProjectEpicDTO;
import io.flowinquiry.modules.teams.service.event.ProjectEpicChangedByTicketEvent;
import io.flowinquiry.modules.usermanagement.service.dto.UserWithTeamRoleDTO;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@AllArgsConstructor
public class ProjectEpicChangedByTicketEventListener {

    private final TeamRepository teamRepository;
    private final TicketRepository ticketRepository;
    private final SseController sseController;

    @Async("asyncTaskExecutor")
    @EventListener
    @Transactional
    public void onProjectEpicChangedByTicket(ProjectEpicChangedByTicketEvent event) {
        Long epicId = event.getTicket().getEpicId();
        Long teamId = event.getTicket().getTeamId();
        if (epicId != null) {
            List<Long> userIds =
                    teamRepository.findUsersByTeamId(teamId).stream()
                            .map(UserWithTeamRoleDTO::getId)
                            .toList();
            Long totalStoryPointsByEpicId =
                    ticketRepository.getTotalStoryPointsByEpicId(event.getTicket().getEpicId());
            sseController.sendEventToUsers(
                    userIds,
                    UPDATED_EPIC,
                    ProjectEpicDTO.builder()
                            .id(epicId)
                            .totalStoryPoints(totalStoryPointsByEpicId)
                            .build());
        }
    }
}
