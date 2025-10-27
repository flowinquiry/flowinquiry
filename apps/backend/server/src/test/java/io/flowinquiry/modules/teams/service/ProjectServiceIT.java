package io.flowinquiry.modules.teams.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.flowinquiry.exceptions.ResourceNotFoundException;
import io.flowinquiry.it.IntegrationTest;
import io.flowinquiry.it.WithMockFwUser;
import io.flowinquiry.modules.teams.domain.Project;
import io.flowinquiry.modules.teams.domain.ProjectStatus;
import io.flowinquiry.modules.teams.domain.TicketPriority;
import io.flowinquiry.modules.teams.repository.ProjectRepository;
import io.flowinquiry.modules.teams.service.dto.ProjectDTO;
import io.flowinquiry.modules.teams.service.dto.ProjectSettingDTO;
import io.flowinquiry.query.Filter;
import io.flowinquiry.query.FilterOperator;
import io.flowinquiry.query.QueryDTO;
import java.util.Collections;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
public class ProjectServiceIT {
    private @Autowired ProjectService projectService;

    private @Autowired ProjectRepository projectRepository;

    @Test
    public void shouldCreateProjectSuccessfully() {
        ProjectSettingDTO settingDTO = new ProjectSettingDTO();
        settingDTO.setProjectId(1L);
        settingDTO.setDefaultPriority(TicketPriority.Medium);
        settingDTO.setSprintLengthDays(14);

        ProjectDTO projectDTO = createProjectDTO();
        projectDTO.setProjectSetting(settingDTO);
        ProjectDTO savedProject = projectService.createProject(projectDTO);
        assertThat(savedProject)
                .extracting(ProjectDTO::getName, ProjectDTO::getDescription, ProjectDTO::getTeamId)
                .containsExactly("Sample project", "Project description", 1L);
    }

    @Test
    public void shouldCreateProjectFailedBecauseTeamIsNotExisted() {
        ProjectDTO projectDTO = createProjectDTO();
        projectDTO.setTeamId(100L);
        assertThatThrownBy(() -> projectService.createProject(projectDTO))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    public void shouldDeleteProjectSuccessfully() {
        ProjectDTO projectDTO = createProjectDTO();
        ProjectDTO savedProject = projectService.createProject(projectDTO);
        projectService.deleteProject(savedProject.getId());

        Optional<Project> expectedProject = projectRepository.findById(savedProject.getId());
        assertThat(expectedProject).isEmpty();
    }

    @Test
    public void shouldUpdateProjectSuccessfully() {
        ProjectDTO projectDTO = createProjectDTO();
        ProjectDTO savedProject = projectService.createProject(projectDTO);
        savedProject.setName("New Project");
        savedProject.setStatus(ProjectStatus.Closed);
        projectService.updateProject(savedProject.getId(), savedProject);

        Project actualProject = projectRepository.findById(savedProject.getId()).orElseThrow();
        assertThat(actualProject)
                .extracting(Project::getName, Project::getStatus)
                .containsExactly("New Project", ProjectStatus.Closed);
    }

    @Test
    public void shouldFindProjectsSuccessfully() {
        QueryDTO queryDTO = new QueryDTO();

        Filter teamIdFilter = new Filter("team.id", FilterOperator.EQ, 1L);

        queryDTO.setFilters(Collections.singletonList(teamIdFilter));
        Pageable pageable = Pageable.ofSize(10);

        Page<ProjectDTO> projectsPage =
                projectService.findProjects(Optional.of(queryDTO), pageable);

        assertThat(projectsPage).isNotEmpty();

        assertThat(projectsPage.getContent()).allMatch(project -> project.getTeamId().equals(1L));
    }

    @Test
    public void shouldGetProjectByShortNameSuccessfully() {
        String shortName = "cust";

        // Execute the getByShortName method
        ProjectDTO retrievedProject = projectService.getByShortName(shortName);

        // Verify that the project was found
        assertThat(retrievedProject).isNotNull();

        // Verify that the project has the correct short name and team ID
        assertThat(retrievedProject.getShortName()).isEqualTo(shortName);
        assertThat(retrievedProject.getTeamId()).isEqualTo(1L);

        // Verify that the project setting is included in the returned DTO
        assertThat(retrievedProject.getProjectSetting()).isNotNull();
        assertThat(retrievedProject.getProjectSetting().getProjectId())
                .isEqualTo(retrievedProject.getId());
        assertThat(retrievedProject.getProjectSetting().getSprintLengthDays())
                .isEqualTo(14); // Default value
        assertThat(retrievedProject.getProjectSetting().getDefaultPriority().toString())
                .isEqualTo("Low"); // Default value
        assertThat(retrievedProject.getProjectSetting().getEstimationUnit().toString())
                .isEqualTo("STORY_POINTS"); // Default value
        assertThat(retrievedProject.getProjectSetting().isEnableEstimation())
                .isTrue(); // Default value
    }

    @Test
    public void shouldThrowExceptionWhenProjectShortNameNotFound() {
        // Using a non-existent short name
        String nonExistentShortName = "nonexistent";

        // Execute the getByShortName method and expect an exception
        assertThatThrownBy(() -> projectService.getByShortName(nonExistentShortName))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(
                        "Cannot find project with short name '" + nonExistentShortName + "'");
    }

    @Test
    public void shouldGetProjectsByUserIdSuccessfully() {
        Long userId = 1L;
        Pageable pageable = Pageable.ofSize(20);

        Page<ProjectDTO> projectsPage = projectService.getProjectsByUserId(userId, pageable);

        assertThat(projectsPage).isNotEmpty();

        // Verify that all returned projects belong to teams that the user is a member of
        // User 1 is associated with teams 1, 2, 3, 7, and 11 according to fw_user_team_test.csv
        assertThat(projectsPage.getContent())
                .allMatch(
                        project ->
                                project.getTeamId().equals(1L)
                                        || project.getTeamId().equals(2L)
                                        || project.getTeamId().equals(3L)
                                        || project.getTeamId().equals(7L)
                                        || project.getTeamId().equals(11L));

        // Verify that projects from team 1 and team 2 are included
        // Team 1 has projects with IDs 1, 3, 5, 7, 9 and Team 2 has projects with IDs 2, 4, 6, 8,
        // 10
        assertThat(projectsPage.getContent()).anyMatch(project -> project.getTeamId().equals(1L));
        assertThat(projectsPage.getContent()).anyMatch(project -> project.getTeamId().equals(2L));
    }

    private ProjectDTO createProjectDTO() {
        return ProjectDTO.builder()
              .name("Sample project")
              .description("Project description")
              .shortName("SP")
              .status(ProjectStatus.Active)
              .teamId(1L)
              .createdBy(1L)
              .build();
    }

    @Test
    void shouldThrowExceptionWhenUserNotLoginAndProjectIsNotPublic(){
        assertThatExceptionOfType(ResourceNotFoundException.class)
              .isThrownBy(() -> projectService.getProjectById(1L));
    }

    @Test
    @WithMockFwUser
    void shouldGetPrivateProjectSuccessfulWhenUserIsAuthenticated(){
        ProjectDTO projectById = projectService.getProjectById(1L);
        assertThat(projectById)
              .extracting(ProjectDTO::getTeamId, ProjectDTO::isPublicAccess)
              .containsExactly(1L, false);
    }

    @Test
    void shouldGetPublicProjectSuccessfulWhenUserIsNotAuthenticated(){
        ProjectDTO projectDTO = createProjectDTO();
        projectDTO.setPublicAccess(true);
        ProjectDTO savedProject = projectService.createProject(projectDTO);

        ProjectDTO actualProject = projectService.getProjectById(savedProject.getId());
        assertThat(actualProject)
              .extracting(ProjectDTO::getId, ProjectDTO::isPublicAccess)
              .containsExactly(savedProject.getId(), true);
    }
}
