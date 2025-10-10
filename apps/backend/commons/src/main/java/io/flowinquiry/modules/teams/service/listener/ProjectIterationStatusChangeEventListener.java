package io.flowinquiry.modules.teams.service.listener;

import io.flowinquiry.modules.shared.controller.SseController;
import io.flowinquiry.modules.shared.domain.EventPayloadType;
import io.flowinquiry.modules.teams.domain.ProjectIteration;
import io.flowinquiry.modules.teams.domain.ProjectIterationStatus;
import io.flowinquiry.modules.teams.domain.Team;
import io.flowinquiry.modules.teams.repository.TeamRepository;
import io.flowinquiry.modules.teams.service.event.ProjectIterationStatusChangeEvent;
import io.flowinquiry.modules.teams.service.mapper.ProjectIterationMapper;
import io.flowinquiry.modules.usermanagement.service.dto.UserWithTeamRoleDTO;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class ProjectIterationStatusChangeEventListener {
    private final TeamRepository teamRepository;
    private final SseController sseController;
    private final ProjectIterationMapper projectIterationMapper;

    @Async("asyncTaskExecutor")
    @EventListener
    @Transactional
    public void onProjectIterationStatusChange(ProjectIterationStatusChangeEvent event) {
        ProjectIteration iteration = event.getProjectIteration();
        Team team = iteration.getProject().getTeam();
        if (team != null && team.getId() != null) {
            List<Long> userIds =
                    teamRepository.findUsersByTeamId(team.getId()).stream()
                            .map(UserWithTeamRoleDTO::getId)
                            .toList();
            EventPayloadType payloadType =
                    iteration.getStatus() == ProjectIterationStatus.CLOSED
                            ? EventPayloadType.ITERATION_CLOSED
                            : EventPayloadType.ITERATION_CREATED;

            sseController.sendEventToUsers(
                    userIds, payloadType, projectIterationMapper.toDto(iteration));
        }
    }
}
