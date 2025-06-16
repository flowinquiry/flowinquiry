package io.flowinquiry.modules.teams.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.flowinquiry.IntegrationTest;
import io.flowinquiry.modules.teams.domain.Project;
import io.flowinquiry.modules.teams.domain.ProjectIteration;
import io.flowinquiry.modules.teams.domain.ProjectStatus;
import io.flowinquiry.modules.teams.domain.Team;
import io.flowinquiry.modules.teams.repository.ProjectIterationRepository;
import io.flowinquiry.modules.teams.repository.ProjectRepository;
import io.flowinquiry.modules.teams.repository.TeamRepository;
import io.flowinquiry.modules.teams.service.dto.ProjectIterationDTO;
import io.flowinquiry.modules.teams.service.mapper.ProjectIterationMapper;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
public class ProjectIterationServiceIT {

    @Autowired private ProjectIterationService projectIterationService;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private ProjectIterationRepository projectIterationRepository;
    @Autowired private ProjectIterationMapper projectIterationMapper;
    @Autowired private TeamRepository teamRepository;

    private Team team;
    private Project project;
    private ProjectIteration iteration;

    @BeforeEach
    public void setup() {
        // Create a team
        team = new Team();
        team.setName("Test Team");
        team = teamRepository.save(team);

        // Create a project
        project = new Project();
        project.setName("Test Project");
        project.setShortName(
                "TP-"
                        + (System.currentTimeMillis()
                                % 10000)); // Ensure uniqueness and stay within 10 char limit
        project.setTeam(team);
        project.setStatus(ProjectStatus.Active);
        project = projectRepository.save(project);

        // Create an iteration
        iteration = new ProjectIteration();
        iteration.setName("Test Iteration");
        iteration.setDescription("Test Description");
        iteration.setProject(project);
        iteration.setStatus("ACTIVE");
        iteration.setStartDate(Instant.now());
        iteration.setEndDate(Instant.now().plusSeconds(86400)); // One day later
        iteration = projectIterationRepository.save(iteration);
    }

    @Test
    public void shouldFindIterationsByProjectIdSuccessfully() {
        // When: Finding iterations by project ID
        List<ProjectIterationDTO> iterations =
                projectIterationService.findByProjectId(project.getId());

        // Then: Verify iterations are returned
        assertThat(iterations).isNotEmpty();
        assertThat(iterations)
                .allMatch(iterationDto -> iterationDto.getProjectId().equals(project.getId()));
        assertThat(iterations)
                .extracting(ProjectIterationDTO::getName)
                .contains(iteration.getName());
    }

    @Test
    public void shouldReturnEmptyListForNonExistentProject() {
        // When: Finding iterations for a non-existent project
        List<ProjectIterationDTO> iterations = projectIterationService.findByProjectId(999L);

        // Then: Verify an empty list is returned
        assertThat(iterations).isEmpty();
    }

    @Test
    public void shouldGetIterationByIdSuccessfully() {
        // When: Getting the iteration by ID
        Optional<ProjectIterationDTO> result =
                projectIterationService.getIterationById(iteration.getId());

        // Then: Verify the iteration is returned
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(iteration.getId());
        assertThat(result.get().getName()).isEqualTo(iteration.getName());
        assertThat(result.get().getDescription()).isEqualTo(iteration.getDescription());
    }

    @Test
    public void shouldReturnEmptyOptionalForNonExistentIteration() {
        // When: Getting a non-existent iteration
        Optional<ProjectIterationDTO> result = projectIterationService.getIterationById(999L);

        // Then: Verify an empty optional is returned
        assertThat(result).isEmpty();
    }

    @Test
    public void shouldSaveIterationSuccessfully() {
        // Given: A new iteration DTO
        ProjectIterationDTO iterationDTO = new ProjectIterationDTO();
        iterationDTO.setProjectId(project.getId());
        iterationDTO.setName("New Test Iteration");
        iterationDTO.setDescription("New Test Description");
        iterationDTO.setStartDate(Instant.now());
        iterationDTO.setEndDate(Instant.now().plusSeconds(86400)); // One day later

        // When: Saving the iteration
        ProjectIterationDTO savedIteration = projectIterationService.save(iterationDTO);

        // Then: Verify the iteration is saved correctly
        assertThat(savedIteration).isNotNull();
        assertThat(savedIteration.getId()).isNotNull();
        assertThat(savedIteration.getName()).isEqualTo("New Test Iteration");
        assertThat(savedIteration.getDescription()).isEqualTo("New Test Description");
        assertThat(savedIteration.getProjectId()).isEqualTo(project.getId());

        // Verify the iteration exists in the database
        assertThat(projectIterationRepository.findById(savedIteration.getId())).isPresent();
    }

    @Test
    public void shouldThrowExceptionWhenSavingIterationWithNonExistentProject() {
        // Given: An iteration DTO with a non-existent project ID
        ProjectIterationDTO iterationDTO = new ProjectIterationDTO();
        iterationDTO.setProjectId(999L);
        iterationDTO.setName("Test Iteration");

        // When/Then: Verify an exception is thrown when saving
        assertThatThrownBy(() -> projectIterationService.save(iterationDTO))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Project not found");
    }

    @Test
    public void shouldUpdateIterationSuccessfully() {
        // Given: An update DTO
        ProjectIterationDTO updateDTO = new ProjectIterationDTO();
        updateDTO.setName("Updated Iteration Name");
        updateDTO.setDescription("Updated Description");
        updateDTO.setStartDate(Instant.now());
        updateDTO.setEndDate(Instant.now().plusSeconds(172800)); // Two days later

        // When: Updating the iteration
        ProjectIterationDTO updatedIteration =
                projectIterationService.updateIteration(iteration.getId(), updateDTO);

        // Then: Verify the iteration is updated correctly
        assertThat(updatedIteration).isNotNull();
        assertThat(updatedIteration.getId()).isEqualTo(iteration.getId());
        assertThat(updatedIteration.getName()).isEqualTo("Updated Iteration Name");
        assertThat(updatedIteration.getDescription()).isEqualTo("Updated Description");

        // Verify the iteration is updated in the database
        ProjectIteration dbIteration =
                projectIterationRepository.findById(iteration.getId()).orElseThrow();
        assertThat(dbIteration.getName()).isEqualTo("Updated Iteration Name");
        assertThat(dbIteration.getDescription()).isEqualTo("Updated Description");
    }

    @Test
    public void shouldThrowExceptionWhenUpdatingNonExistentIteration() {
        // Given: An update DTO
        ProjectIterationDTO updateDTO = new ProjectIterationDTO();
        updateDTO.setName("Updated Iteration Name");

        // When/Then: Verify an exception is thrown when updating a non-existent iteration
        assertThatThrownBy(() -> projectIterationService.updateIteration(999L, updateDTO))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Iteration not found");
    }

    @Test
    public void shouldDeleteIterationSuccessfully() {
        // Given: The ID of the existing iteration
        Long iterationId = iteration.getId();

        // When: Deleting the iteration
        projectIterationService.deleteIteration(iterationId);

        // Then: Verify the iteration is deleted from the database
        assertThat(projectIterationRepository.findById(iterationId)).isEmpty();
    }
}
