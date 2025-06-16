package io.flowinquiry.modules.teams.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.flowinquiry.IntegrationTest;
import io.flowinquiry.modules.teams.domain.Project;
import io.flowinquiry.modules.teams.domain.ProjectEpic;
import io.flowinquiry.modules.teams.domain.ProjectStatus;
import io.flowinquiry.modules.teams.domain.Team;
import io.flowinquiry.modules.teams.repository.ProjectEpicRepository;
import io.flowinquiry.modules.teams.repository.ProjectRepository;
import io.flowinquiry.modules.teams.repository.TeamRepository;
import io.flowinquiry.modules.teams.service.dto.ProjectEpicDTO;
import io.flowinquiry.modules.teams.service.mapper.ProjectEpicMapper;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
public class ProjectEpicServiceIT {

    @Autowired private ProjectEpicService projectEpicService;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private ProjectEpicRepository projectEpicRepository;
    @Autowired private ProjectEpicMapper projectEpicMapper;
    @Autowired private TeamRepository teamRepository;

    private Team team;
    private Project project;
    private ProjectEpic epic;

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

        // Create an epic
        epic = new ProjectEpic();
        epic.setName("Test Epic");
        epic.setDescription("Test Description");
        epic.setProject(project);
        epic.setStatus("ACTIVE");
        epic.setStartDate(Instant.now());
        epic.setEndDate(Instant.now().plusSeconds(86400)); // One day later
        epic = projectEpicRepository.save(epic);
    }

    @Test
    public void shouldFindEpicsByProjectIdSuccessfully() {
        // When: Finding epics by project ID
        List<ProjectEpicDTO> epics = projectEpicService.findByProjectId(project.getId());

        // Then: Verify epics are returned
        assertThat(epics).isNotEmpty();
        assertThat(epics).allMatch(epicDto -> epicDto.getProjectId().equals(project.getId()));
        assertThat(epics).extracting(ProjectEpicDTO::getName).contains(epic.getName());
    }

    @Test
    public void shouldReturnEmptyListForNonExistentProject() {
        // When: Finding epics for a non-existent project
        List<ProjectEpicDTO> epics = projectEpicService.findByProjectId(999L);

        // Then: Verify an empty list is returned
        assertThat(epics).isEmpty();
    }

    @Test
    public void shouldGetEpicByIdSuccessfully() {
        // When: Getting the epic by ID
        Optional<ProjectEpicDTO> result = projectEpicService.getEpicById(epic.getId());

        // Then: Verify the epic is returned
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(epic.getId());
        assertThat(result.get().getName()).isEqualTo(epic.getName());
        assertThat(result.get().getDescription()).isEqualTo(epic.getDescription());
    }

    @Test
    public void shouldReturnEmptyOptionalForNonExistentEpic() {
        // When: Getting a non-existent epic
        Optional<ProjectEpicDTO> result = projectEpicService.getEpicById(999L);

        // Then: Verify an empty optional is returned
        assertThat(result).isEmpty();
    }

    @Test
    public void shouldSaveEpicSuccessfully() {
        // Given: A new epic DTO
        ProjectEpicDTO epicDTO = new ProjectEpicDTO();
        epicDTO.setProjectId(project.getId());
        epicDTO.setName("New Test Epic");
        epicDTO.setDescription("New Test Description");
        epicDTO.setStartDate(Instant.now());
        epicDTO.setEndDate(Instant.now().plusSeconds(86400)); // One day later

        // When: Saving the epic
        ProjectEpicDTO savedEpic = projectEpicService.save(epicDTO);

        // Then: Verify the epic is saved correctly
        assertThat(savedEpic).isNotNull();
        assertThat(savedEpic.getId()).isNotNull();
        assertThat(savedEpic.getName()).isEqualTo("New Test Epic");
        assertThat(savedEpic.getDescription()).isEqualTo("New Test Description");
        assertThat(savedEpic.getProjectId()).isEqualTo(project.getId());

        // Verify the epic exists in the database
        assertThat(projectEpicRepository.findById(savedEpic.getId())).isPresent();
    }

    @Test
    public void shouldThrowExceptionWhenSavingEpicWithNonExistentProject() {
        // Given: An epic DTO with a non-existent project ID
        ProjectEpicDTO epicDTO = new ProjectEpicDTO();
        epicDTO.setProjectId(999L);
        epicDTO.setName("Test Epic");

        // When/Then: Verify an exception is thrown when saving
        assertThatThrownBy(() -> projectEpicService.save(epicDTO))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Project not found");
    }

    @Test
    public void shouldUpdateEpicSuccessfully() {
        // Given: An update DTO
        ProjectEpicDTO updateDTO = new ProjectEpicDTO();
        updateDTO.setName("Updated Epic Name");
        updateDTO.setDescription("Updated Description");
        updateDTO.setStartDate(Instant.now());
        updateDTO.setEndDate(Instant.now().plusSeconds(172800)); // Two days later

        // When: Updating the epic
        ProjectEpicDTO updatedEpic = projectEpicService.updateEpic(epic.getId(), updateDTO);

        // Then: Verify the epic is updated correctly
        assertThat(updatedEpic).isNotNull();
        assertThat(updatedEpic.getId()).isEqualTo(epic.getId());
        assertThat(updatedEpic.getName()).isEqualTo("Updated Epic Name");
        assertThat(updatedEpic.getDescription()).isEqualTo("Updated Description");

        // Verify the epic is updated in the database
        ProjectEpic dbEpic = projectEpicRepository.findById(epic.getId()).orElseThrow();
        assertThat(dbEpic.getName()).isEqualTo("Updated Epic Name");
        assertThat(dbEpic.getDescription()).isEqualTo("Updated Description");
    }

    @Test
    public void shouldThrowExceptionWhenUpdatingNonExistentEpic() {
        // Given: An update DTO
        ProjectEpicDTO updateDTO = new ProjectEpicDTO();
        updateDTO.setName("Updated Epic Name");

        // When/Then: Verify an exception is thrown when updating a non-existent epic
        assertThatThrownBy(() -> projectEpicService.updateEpic(999L, updateDTO))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Epic not found");
    }

    @Test
    public void shouldDeleteEpicSuccessfully() {
        // Given: The ID of the existing epic
        Long epicId = epic.getId();

        // When: Deleting the epic
        projectEpicService.deleteEpic(epicId);

        // Then: Verify the epic is deleted from the database
        assertThat(projectEpicRepository.findById(epicId)).isEmpty();
    }
}
