package io.flowinquiry.modules.teams.service.listener;

import static io.flowinquiry.modules.shared.domain.EventPayloadType.ITERATION_CLOSED;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import io.flowinquiry.modules.collab.domain.ActivityLog;
import io.flowinquiry.modules.shared.controller.SseController;
import io.flowinquiry.modules.teams.domain.*;
import io.flowinquiry.modules.teams.repository.TeamRepository;
import io.flowinquiry.modules.teams.service.dto.ProjectIterationDTO;
import io.flowinquiry.modules.teams.service.event.ProjectIterationStatusChangeEvent;
import io.flowinquiry.modules.teams.service.mapper.ProjectIterationMapper;
import io.flowinquiry.modules.usermanagement.service.dto.UserWithTeamRoleDTO;
import java.util.Arrays;
import java.util.List;
import org.junit.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class ProjectIterationStatusChangeEventListenerTest {
    @Mock private TeamRepository teamRepository;
    @Mock private SseController sseController;
    @Mock private ProjectIterationMapper projectIterationMapper;
    private ProjectIterationStatusChangeEventListener listener;

    @BeforeEach
    public void setup() {
        listener =
                new ProjectIterationStatusChangeEventListener(
                        teamRepository, sseController, projectIterationMapper);
    }

    @Test
    public void testOnClosingEventOnly_Success() {
        Long teamId = 1L;
        Long userId1 = 101L;
        Long userId2 = 102L;
        List<Long> userIds = Arrays.asList(userId1, userId2);

        Team team = Team.builder().id(teamId).name("Test Team").build();

        UserWithTeamRoleDTO user1 =
                new UserWithTeamRoleDTO(
                        userId1, "abc@def.com", "jhon", "doe", "", "", "", teamId, "");

        UserWithTeamRoleDTO user2 =
                new UserWithTeamRoleDTO(
                        userId2, "abc123@def.com", "jane", "doe", "", "", "", teamId, "");
        ;
        Project project =
                Project.builder()
                        .id(1L)
                        .team(team)
                        .name("new project")
                        .projectSetting(
                                ProjectSetting.builder().id(1L).sprintLengthDays(14).build())
                        .build();

        ProjectIteration iteration =
                ProjectIteration.builder()
                        .project(project)
                        .id(1L)
                        .name("iteration 1")
                        .status(ProjectIterationStatus.CLOSED)
                        .build();

        ProjectIterationStatusChangeEvent event =
                new ProjectIterationStatusChangeEvent(this, iteration);

        listener.onProjectIterationStatusChange(event);

        when(teamRepository.findUsersByTeamId(teamId)).thenReturn(List.of(user1, user2));

        verify(sseController, times(2))
                .sendEventToUser(anyLong(), eq(ITERATION_CLOSED), any(ProjectIterationDTO.class));

        ArgumentCaptor<ActivityLog> activityLogCaptor = ArgumentCaptor.forClass(ActivityLog.class);
        ActivityLog capturedActivityLog = activityLogCaptor.getValue();
        assert capturedActivityLog.getEntityId().equals(1L);
        assert capturedActivityLog.getContent().contains("iteration 1");
        assert capturedActivityLog.getContent().contains("CLOSED");
    }
}
