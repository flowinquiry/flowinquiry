package io.flowinquiry.modules.teams.service.mapper;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;

import io.flowinquiry.modules.teams.domain.EstimationUnit;
import io.flowinquiry.modules.teams.domain.Project;
import io.flowinquiry.modules.teams.domain.ProjectSetting;
import io.flowinquiry.modules.teams.domain.ProjectStatus;
import io.flowinquiry.modules.teams.domain.Team;
import io.flowinquiry.modules.teams.domain.TicketPriority;
import io.flowinquiry.modules.teams.service.dto.ProjectDTO;
import io.flowinquiry.modules.teams.service.dto.ProjectSettingDTO;
import java.lang.reflect.Field;
import java.time.Instant;
import java.util.HashMap;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

public class ProjectMapperTest {

    private ProjectMapper projectMapper;
    private ProjectSettingMapper projectSettingMapper;

    @BeforeEach
    public void setup() throws Exception {
        projectMapper = Mappers.getMapper(ProjectMapper.class);
        projectSettingMapper = Mappers.getMapper(ProjectSettingMapper.class);

        // Set the projectSettingMapper field in the ProjectMapperImpl instance
        Field field = projectMapper.getClass().getDeclaredField("projectSettingMapper");
        field.setAccessible(true);
        field.set(projectMapper, projectSettingMapper);
    }

    @Test
    public void testToDto() {
        // Given
        Instant now = Instant.now();
        Team team = Team.builder().id(1L).name("Team Name").build();

        ProjectSetting projectSetting =
                ProjectSetting.builder()
                        .id(1L)
                        .sprintLengthDays(14)
                        .defaultPriority(TicketPriority.Medium)
                        .estimationUnit(EstimationUnit.STORY_POINTS)
                        .enableEstimation(true)
                        .integrationSettings(new HashMap<>())
                        .build();

        Project project =
                Project.builder()
                        .id(1L)
                        .name("Project Name")
                        .description("Project Description")
                        .shortName("PRJ")
                        .team(team)
                        .status(ProjectStatus.Active)
                        .startDate(now)
                        .endDate(now.plusSeconds(86400))
                        .projectSetting(projectSetting)
                        .build();

        // Set the project reference in the projectSetting
        projectSetting.setProject(project);

        // When
        ProjectDTO projectDTO = projectMapper.toDto(project);

        // Then
        assertAll(
                () -> assertEquals(project.getId(), projectDTO.getId()),
                () -> assertEquals(project.getName(), projectDTO.getName()),
                () -> assertEquals(project.getDescription(), projectDTO.getDescription()),
                () -> assertEquals(project.getShortName(), projectDTO.getShortName()),
                () -> assertEquals(project.getTeam().getId(), projectDTO.getTeamId()),
                () -> assertEquals(project.getStatus(), projectDTO.getStatus()),
                () -> assertEquals(project.getStartDate(), projectDTO.getStartDate()),
                () -> assertEquals(project.getEndDate(), projectDTO.getEndDate()),
                () ->
                        assertEquals(
                                project.getProjectSetting().getId(),
                                projectDTO.getProjectSetting().getId()),
                () ->
                        assertEquals(
                                project.getProjectSetting().getSprintLengthDays(),
                                projectDTO.getProjectSetting().getSprintLengthDays()),
                () ->
                        assertEquals(
                                project.getProjectSetting().getDefaultPriority(),
                                projectDTO.getProjectSetting().getDefaultPriority()),
                () ->
                        assertEquals(
                                project.getProjectSetting().getEstimationUnit(),
                                projectDTO.getProjectSetting().getEstimationUnit()),
                () ->
                        assertEquals(
                                project.getProjectSetting().isEnableEstimation(),
                                projectDTO.getProjectSetting().isEnableEstimation()),
                () ->
                        assertEquals(
                                project.getProjectSetting().getIntegrationSettings(),
                                projectDTO.getProjectSetting().getIntegrationSettings()));
    }

    @Test
    public void testToEntity() {
        // Given
        Instant now = Instant.now();

        ProjectSettingDTO projectSettingDTO =
                ProjectSettingDTO.builder()
                        .id(1L)
                        .projectId(1L)
                        .sprintLengthDays(14)
                        .defaultPriority(TicketPriority.Medium)
                        .estimationUnit(EstimationUnit.STORY_POINTS)
                        .enableEstimation(true)
                        .integrationSettings(new HashMap<>())
                        .build();

        ProjectDTO projectDTO =
                ProjectDTO.builder()
                        .id(1L)
                        .name("Project Name")
                        .description("Project Description")
                        .shortName("PRJ")
                        .teamId(1L)
                        .status(ProjectStatus.Active)
                        .startDate(now)
                        .endDate(now.plusSeconds(86400))
                        .createdBy(2L)
                        .projectSetting(projectSettingDTO)
                        .build();

        // When
        Project project = projectMapper.toEntity(projectDTO);

        // Then
        assertAll(
                () -> assertEquals(projectDTO.getId(), project.getId()),
                () -> assertEquals(projectDTO.getName(), project.getName()),
                () -> assertEquals(projectDTO.getDescription(), project.getDescription()),
                () -> assertEquals(projectDTO.getShortName(), project.getShortName()),
                () -> assertEquals(projectDTO.getTeamId(), project.getTeam().getId()),
                () -> assertEquals(projectDTO.getStatus(), project.getStatus()),
                () -> assertEquals(projectDTO.getStartDate(), project.getStartDate()),
                () -> assertEquals(projectDTO.getEndDate(), project.getEndDate()),
                () -> assertEquals(projectDTO.getCreatedBy(), project.getCreatedByUser().getId()),
                () ->
                        assertEquals(
                                projectDTO.getProjectSetting().getId(),
                                project.getProjectSetting().getId()),
                () ->
                        assertEquals(
                                projectDTO.getProjectSetting().getSprintLengthDays(),
                                project.getProjectSetting().getSprintLengthDays()),
                () ->
                        assertEquals(
                                projectDTO.getProjectSetting().getDefaultPriority(),
                                project.getProjectSetting().getDefaultPriority()),
                () ->
                        assertEquals(
                                projectDTO.getProjectSetting().getEstimationUnit(),
                                project.getProjectSetting().getEstimationUnit()),
                () ->
                        assertEquals(
                                projectDTO.getProjectSetting().isEnableEstimation(),
                                project.getProjectSetting().isEnableEstimation()),
                () ->
                        assertEquals(
                                projectDTO.getProjectSetting().getIntegrationSettings(),
                                project.getProjectSetting().getIntegrationSettings()));
    }
}
