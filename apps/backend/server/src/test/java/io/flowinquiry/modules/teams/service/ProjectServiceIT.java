package io.flowinquiry.modules.teams.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.flowinquiry.IntegrationTest;
import io.flowinquiry.exceptions.ResourceNotFoundException;
import io.flowinquiry.modules.teams.domain.ProjectStatus;
import io.flowinquiry.modules.teams.service.dto.ProjectDTO;
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

    @Test
    public void shouldCreateProjectSuccessfully() {
        ProjectDTO projectDTO =
                ProjectDTO.builder()
                        .name("Sample project")
                        .description("Project description")
                        .shortName("SP")
                        .status(ProjectStatus.Active)
                        .teamId(1L)
                        .createdBy(1L)
                        .build();
        ProjectDTO savedProject = projectService.createProject(projectDTO);
        savedProject =
                projectService
                        .getProjectById(savedProject.getId())
                        .orElseThrow(
                                () -> new ResourceNotFoundException("Issue of saving project"));
        assertThat(savedProject)
                .extracting(ProjectDTO::getName, ProjectDTO::getDescription, ProjectDTO::getTeamId)
                .containsExactly("Sample project", "Project description", 1L);
    }

    @Test
    public void shouldCreateProjectFailedBecauseTeamIsNotExisted() {
        ProjectDTO projectDTO =
                ProjectDTO.builder()
                        .name("Sample project")
                        .description("Project description")
                        .status(ProjectStatus.Active)
                        .teamId(100L)
                        .build();
        assertThatThrownBy(() -> projectService.createProject(projectDTO))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    public void shouldDeleteProjectSuccessfully() {
        ProjectDTO projectDTO =
                ProjectDTO.builder()
                        .name("Sample project")
                        .description("Project description")
                        .shortName("SP")
                        .status(ProjectStatus.Active)
                        .createdBy(1L)
                        .teamId(1L)
                        .build();
        ProjectDTO savedProject = projectService.createProject(projectDTO);
        projectService.deleteProject(savedProject.getId());

        Optional<ProjectDTO> notFoundProject = projectService.getProjectById(savedProject.getId());
        assertThat(notFoundProject.isEmpty()).isTrue();
    }

    @Test
    public void shouldUpdateProjectSuccessfully() {
        ProjectDTO projectDTO =
                ProjectDTO.builder()
                        .name("Sample project")
                        .shortName("SP")
                        .description("Project description")
                        .status(ProjectStatus.Active)
                        .createdBy(1L)
                        .teamId(1L)
                        .build();
        ProjectDTO savedProject = projectService.createProject(projectDTO);
        savedProject.setName("New Project");
        savedProject.setStatus(ProjectStatus.Closed);
        projectService.updateProject(savedProject.getId(), savedProject);

        savedProject = projectService.getProjectById(savedProject.getId()).orElseThrow();
        assertThat(savedProject)
                .extracting(ProjectDTO::getName, ProjectDTO::getStatus)
                .containsExactly("New Project", ProjectStatus.Closed);
    }

    @Test
    public void shouldFindProjectsSuccessfully() {
        // Using teamId 1 as specified in the requirements
        Long teamId = 1L;

        // Create a test project with teamId 1
        ProjectDTO projectDTO =
                ProjectDTO.builder()
                        .name("Test Project for Query")
                        .description("Project for testing queries")
                        .shortName("TPQ")
                        .status(ProjectStatus.Active)
                        .teamId(teamId)
                        .createdBy(1L)
                        .build();
        projectService.createProject(projectDTO);

        // Create a query to find projects for team with ID 1
        QueryDTO queryDTO = new QueryDTO();

        // Create a filter for team = 1
        Filter teamIdFilter = new Filter("team.id", FilterOperator.EQ, teamId);
        queryDTO.setFilters(Collections.singletonList(teamIdFilter));

        // Get the first page with 10 items
        Pageable pageable = Pageable.ofSize(10);

        // Execute the findProjects method
        Page<ProjectDTO> projectsPage =
                projectService.findProjects(Optional.of(queryDTO), pageable);

        // Verify that we found at least one project
        assertThat(projectsPage).isNotEmpty();

        // Verify that all projects belong to the specified team
        assertThat(projectsPage.getContent())
                .allMatch(project -> project.getTeamId().equals(teamId));
    }

    @Test
    public void shouldGetProjectByShortNameSuccessfully() {
        // Create a project with a specific short name
        String shortName =
                "SP"
                        + System.currentTimeMillis()
                                % 10000; // Ensure unique short name within 10 chars
        String projectName = "Sample Project";
        String projectDescription = "Project description";

        ProjectDTO projectDTO =
                ProjectDTO.builder()
                        .name(projectName)
                        .description(projectDescription)
                        .shortName(shortName)
                        .status(ProjectStatus.Active)
                        .teamId(1L)
                        .createdBy(1L)
                        .build();

        // Save the project
        projectService.createProject(projectDTO);

        // Execute the getByShortName method
        ProjectDTO retrievedProject = projectService.getByShortName(shortName);

        // Verify that the project was found
        assertThat(retrievedProject).isNotNull();

        // Verify that the project has the correct short name and team ID
        assertThat(retrievedProject.getShortName()).isEqualTo(shortName);
        assertThat(retrievedProject.getTeamId()).isEqualTo(1L);

        // Verify other properties
        assertThat(retrievedProject.getName()).isEqualTo(projectName);
        assertThat(retrievedProject.getDescription()).isEqualTo(projectDescription);

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
}
