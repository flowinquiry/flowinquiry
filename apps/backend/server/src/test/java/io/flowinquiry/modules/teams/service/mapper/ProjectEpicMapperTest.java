package io.flowinquiry.modules.teams.service.mapper;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import io.flowinquiry.modules.teams.domain.Project;
import io.flowinquiry.modules.teams.domain.ProjectEpic;
import io.flowinquiry.modules.teams.service.dto.ProjectEpicDTO;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

public class ProjectEpicMapperTest {

    private ProjectEpicMapper projectEpicMapper;

    @BeforeEach
    public void setup() {
        projectEpicMapper = Mappers.getMapper(ProjectEpicMapper.class);
    }

    @Test
    public void testToDto() {
        // Given
        Project project = Project.builder().id(1L).name("Test Project").build();

        ProjectEpic epic = new ProjectEpic();
        epic.setId(2L);
        epic.setProject(project);
        epic.setName("Test Epic");
        epic.setDescription("Epic Description");
        epic.setStatus("ACTIVE");
        epic.setPriority(1);
        Instant now = Instant.now();
        epic.setStartDate(now);
        epic.setEndDate(now.plusSeconds(86400)); // plus one day
        epic.setTotalTickets(5L);

        // When
        ProjectEpicDTO epicDTO = projectEpicMapper.toDto(epic);

        // Then
        assertAll(
                () -> assertEquals(epic.getId(), epicDTO.getId()),
                () -> assertEquals(epic.getProject().getId(), epicDTO.getProjectId()),
                () -> assertEquals(epic.getName(), epicDTO.getName()),
                () -> assertEquals(epic.getDescription(), epicDTO.getDescription()),
                () -> assertEquals(epic.getStartDate(), epicDTO.getStartDate()),
                () -> assertEquals(epic.getEndDate(), epicDTO.getEndDate()),
                () -> assertEquals(epic.getTotalTickets(), epicDTO.getTotalTickets()));
    }

    @Test
    public void testToEntity() {
        // Given
        ProjectEpicDTO epicDTO =
                ProjectEpicDTO.builder()
                        .id(2L)
                        .projectId(1L)
                        .name("Test Epic")
                        .description("Epic Description")
                        .startDate(Instant.now())
                        .endDate(Instant.now().plusSeconds(86400)) // plus one day
                        .totalTickets(5L)
                        .build();

        // When
        ProjectEpic epic = projectEpicMapper.toEntity(epicDTO);

        // Then
        assertAll(
                () -> assertEquals(epicDTO.getId(), epic.getId()),
                () -> assertEquals(epicDTO.getProjectId(), epic.getProject().getId()),
                () -> assertEquals(epicDTO.getName(), epic.getName()),
                () -> assertEquals(epicDTO.getDescription(), epic.getDescription()),
                () -> assertEquals(epicDTO.getStartDate(), epic.getStartDate()),
                () -> assertEquals(epicDTO.getEndDate(), epic.getEndDate()),
                () -> assertEquals(epicDTO.getTotalTickets(), epic.getTotalTickets()));
    }

    @Test
    public void testUpdateFromDto() {
        // Given
        Project project = Project.builder().id(1L).name("Test Project").build();

        ProjectEpic existingEpic = new ProjectEpic();
        existingEpic.setId(2L);
        existingEpic.setProject(project);
        existingEpic.setName("Original Epic");
        existingEpic.setDescription("Original Description");
        existingEpic.setStatus("ACTIVE");
        existingEpic.setPriority(1);
        Instant now = Instant.now();
        existingEpic.setStartDate(now);
        existingEpic.setEndDate(now.plusSeconds(86400)); // plus one day
        existingEpic.setTotalTickets(5L);

        ProjectEpicDTO updateDTO =
                ProjectEpicDTO.builder()
                        .id(2L)
                        .projectId(1L)
                        .name("Updated Epic")
                        .description("Updated Description")
                        .startDate(now.plusSeconds(3600)) // plus one hour
                        .endDate(now.plusSeconds(172800)) // plus two days
                        .build();

        // When
        projectEpicMapper.updateFromDto(updateDTO, existingEpic);

        // Then
        assertAll(
                () -> assertEquals(updateDTO.getId(), existingEpic.getId()),
                () -> assertEquals(updateDTO.getProjectId(), existingEpic.getProject().getId()),
                () -> assertEquals(updateDTO.getName(), existingEpic.getName()),
                () -> assertEquals(updateDTO.getDescription(), existingEpic.getDescription()),
                () -> assertEquals(updateDTO.getStartDate(), existingEpic.getStartDate()),
                () -> assertEquals(updateDTO.getEndDate(), existingEpic.getEndDate()),
                () -> assertEquals("ACTIVE", existingEpic.getStatus()),
                () -> assertEquals(Integer.valueOf(1), existingEpic.getPriority()));
    }

    @Test
    public void testNullValues() {
        // Test null entity
        assertNull(projectEpicMapper.toDto(null));

        // Test null DTO
        assertNull(projectEpicMapper.toEntity(null));
    }
}
