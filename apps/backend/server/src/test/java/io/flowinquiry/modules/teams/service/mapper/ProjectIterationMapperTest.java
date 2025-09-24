package io.flowinquiry.modules.teams.service.mapper;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import io.flowinquiry.modules.teams.domain.Project;
import io.flowinquiry.modules.teams.domain.ProjectIteration;
import io.flowinquiry.modules.teams.domain.ProjectIterationStatus;
import io.flowinquiry.modules.teams.service.dto.ProjectIterationDTO;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

public class ProjectIterationMapperTest {

    private ProjectIterationMapper projectIterationMapper;

    @BeforeEach
    public void setup() {
        projectIterationMapper = Mappers.getMapper(ProjectIterationMapper.class);
    }

    @Test
    public void testToDto() {
        // Given
        Project project = Project.builder().id(1L).name("Test Project").build();

        ProjectIteration iteration = new ProjectIteration();
        iteration.setId(2L);
        iteration.setProject(project);
        iteration.setName("Test Iteration");
        iteration.setDescription("Iteration Description");
        iteration.setStatus(ProjectIterationStatus.ACTIVE);
        Instant now = Instant.now();
        iteration.setStartDate(now);
        iteration.setEndDate(now.plusSeconds(86400)); // plus one day
        iteration.setTotalTickets(5L);

        // When
        ProjectIterationDTO iterationDTO = projectIterationMapper.toDto(iteration);

        // Then
        assertAll(
                () -> assertEquals(iteration.getId(), iterationDTO.getId()),
                () -> assertEquals(iteration.getProject().getId(), iterationDTO.getProjectId()),
                () -> assertEquals(iteration.getName(), iterationDTO.getName()),
                () -> assertEquals(iteration.getDescription(), iterationDTO.getDescription()),
                () -> assertEquals(iteration.getStartDate(), iterationDTO.getStartDate()),
                () -> assertEquals(iteration.getEndDate(), iterationDTO.getEndDate()),
                () -> assertEquals(iteration.getTotalTickets(), iterationDTO.getTotalTickets()));
    }

    @Test
    public void testToEntity() {
        // Given
        ProjectIterationDTO iterationDTO =
                ProjectIterationDTO.builder()
                        .id(2L)
                        .projectId(1L)
                        .name("Test Iteration")
                        .description("Iteration Description")
                        .startDate(Instant.now())
                        .endDate(Instant.now().plusSeconds(86400)) // plus one day
                        .totalTickets(5L)
                        .build();

        // When
        ProjectIteration iteration = projectIterationMapper.toEntity(iterationDTO);

        // Then
        assertAll(
                () -> assertEquals(iterationDTO.getId(), iteration.getId()),
                () -> assertEquals(iterationDTO.getProjectId(), iteration.getProject().getId()),
                () -> assertEquals(iterationDTO.getName(), iteration.getName()),
                () -> assertEquals(iterationDTO.getDescription(), iteration.getDescription()),
                () -> assertEquals(iterationDTO.getStartDate(), iteration.getStartDate()),
                () -> assertEquals(iterationDTO.getEndDate(), iteration.getEndDate()),
                () -> assertEquals(iterationDTO.getTotalTickets(), iteration.getTotalTickets()));
    }

    @Test
    public void testUpdateFromDto() {
        // Given
        Project project = Project.builder().id(1L).name("Test Project").build();

        ProjectIteration existingIteration = new ProjectIteration();
        existingIteration.setId(2L);
        existingIteration.setProject(project);
        existingIteration.setName("Original Iteration");
        existingIteration.setDescription("Original Description");
        existingIteration.setStatus(ProjectIterationStatus.ACTIVE);
        Instant now = Instant.now();
        existingIteration.setStartDate(now);
        existingIteration.setEndDate(now.plusSeconds(86400)); // plus one day
        existingIteration.setTotalTickets(5L);

        ProjectIterationDTO updateDTO =
                ProjectIterationDTO.builder()
                        .id(2L)
                        .projectId(1L)
                        .name("Updated Iteration")
                        .description("Updated Description")
                        .startDate(now.plusSeconds(3600)) // plus one hour
                        .endDate(now.plusSeconds(172800)) // plus two days
                        .build();

        // When
        projectIterationMapper.updateFromDto(updateDTO, existingIteration);

        // Then
        assertAll(
                () -> assertEquals(updateDTO.getId(), existingIteration.getId()),
                () ->
                        assertEquals(
                                updateDTO.getProjectId(), existingIteration.getProject().getId()),
                () -> assertEquals(updateDTO.getName(), existingIteration.getName()),
                () -> assertEquals(updateDTO.getDescription(), existingIteration.getDescription()),
                () -> assertEquals(updateDTO.getStartDate(), existingIteration.getStartDate()),
                () -> assertEquals(updateDTO.getEndDate(), existingIteration.getEndDate()),
                // Status should not be changed as it is not in the DTO
                () -> assertEquals(ProjectIterationStatus.ACTIVE, existingIteration.getStatus()));
    }

    @Test
    public void testNullValues() {
        // Test null entity
        assertNull(projectIterationMapper.toDto(null));

        // Test null DTO
        assertNull(projectIterationMapper.toEntity(null));
    }
}
