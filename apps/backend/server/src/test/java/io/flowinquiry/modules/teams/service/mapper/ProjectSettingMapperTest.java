package io.flowinquiry.modules.teams.service.mapper;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import io.flowinquiry.modules.teams.domain.EstimationUnit;
import io.flowinquiry.modules.teams.domain.Project;
import io.flowinquiry.modules.teams.domain.ProjectSetting;
import io.flowinquiry.modules.teams.domain.TicketPriority;
import io.flowinquiry.modules.teams.service.dto.ProjectSettingDTO;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

public class ProjectSettingMapperTest {

    private ProjectSettingMapper projectSettingMapper;

    @BeforeEach
    public void setup() {
        projectSettingMapper = Mappers.getMapper(ProjectSettingMapper.class);
    }

    @Test
    public void testToDto() {
        // Given
        Project project = Project.builder().id(1L).name("Test Project").build();

        Map<String, Object> integrationSettings = new HashMap<>();
        integrationSettings.put("key1", "value1");
        integrationSettings.put("key2", 123);

        Instant now = Instant.now();

        ProjectSetting setting =
                ProjectSetting.builder()
                        .id(2L)
                        .project(project)
                        .sprintLengthDays(14)
                        .defaultPriority(TicketPriority.Low)
                        .estimationUnit(EstimationUnit.STORY_POINTS)
                        .enableEstimation(true)
                        .integrationSettings(integrationSettings)
                        .createdBy(10L)
                        .createdAt(now)
                        .modifiedBy(11L)
                        .modifiedAt(now.plusSeconds(3600))
                        .build();

        // When
        ProjectSettingDTO settingDTO = projectSettingMapper.toDto(setting);

        // Then
        assertAll(
                () -> assertEquals(setting.getId(), settingDTO.getId()),
                () -> assertEquals(setting.getProject().getId(), settingDTO.getProjectId()),
                () -> assertEquals(setting.getSprintLengthDays(), settingDTO.getSprintLengthDays()),
                () -> assertEquals(setting.getDefaultPriority(), settingDTO.getDefaultPriority()),
                () -> assertEquals(setting.getEstimationUnit(), settingDTO.getEstimationUnit()),
                () -> assertEquals(setting.isEnableEstimation(), settingDTO.isEnableEstimation()),
                () ->
                        assertEquals(
                                setting.getIntegrationSettings(),
                                settingDTO.getIntegrationSettings()),
                () -> assertEquals(setting.getCreatedBy(), settingDTO.getCreatedBy()),
                () -> assertEquals(setting.getCreatedAt(), settingDTO.getCreatedAt()),
                () -> assertEquals(setting.getModifiedBy(), settingDTO.getModifiedBy()),
                () -> assertEquals(setting.getModifiedAt(), settingDTO.getModifiedAt()));
    }

    @Test
    public void testToEntity() {
        // Given
        Map<String, Object> integrationSettings = new HashMap<>();
        integrationSettings.put("key1", "value1");
        integrationSettings.put("key2", 123);

        Instant now = Instant.now();

        ProjectSettingDTO settingDTO =
                ProjectSettingDTO.builder()
                        .id(2L)
                        .projectId(1L)
                        .sprintLengthDays(14)
                        .defaultPriority(TicketPriority.Low)
                        .estimationUnit(EstimationUnit.STORY_POINTS)
                        .enableEstimation(true)
                        .integrationSettings(integrationSettings)
                        .createdBy(10L)
                        .createdAt(now)
                        .modifiedBy(11L)
                        .modifiedAt(now.plusSeconds(3600))
                        .build();

        // When
        ProjectSetting setting = projectSettingMapper.toEntity(settingDTO);

        // Then
        assertAll(
                () -> assertEquals(settingDTO.getId(), setting.getId()),
                () -> assertEquals(settingDTO.getProjectId(), setting.getProject().getId()),
                () -> assertEquals(settingDTO.getSprintLengthDays(), setting.getSprintLengthDays()),
                () -> assertEquals(settingDTO.getDefaultPriority(), setting.getDefaultPriority()),
                () -> assertEquals(settingDTO.getEstimationUnit(), setting.getEstimationUnit()),
                () -> assertEquals(settingDTO.isEnableEstimation(), setting.isEnableEstimation()),
                () ->
                        assertEquals(
                                settingDTO.getIntegrationSettings(),
                                setting.getIntegrationSettings()),
                () -> assertEquals(settingDTO.getCreatedBy(), setting.getCreatedBy()),
                () -> assertEquals(settingDTO.getCreatedAt(), setting.getCreatedAt()),
                () -> assertEquals(settingDTO.getModifiedBy(), setting.getModifiedBy()),
                () -> assertEquals(settingDTO.getModifiedAt(), setting.getModifiedAt()));
    }

    @Test
    public void testUpdateEntity() {
        // Given
        Project project = Project.builder().id(1L).name("Test Project").build();

        Map<String, Object> originalSettings = new HashMap<>();
        originalSettings.put("key1", "original");

        Instant originalTime = Instant.now();

        ProjectSetting existingSetting =
                ProjectSetting.builder()
                        .id(2L)
                        .project(project)
                        .sprintLengthDays(7)
                        .defaultPriority(TicketPriority.High)
                        .estimationUnit(EstimationUnit.DAYS)
                        .enableEstimation(false)
                        .integrationSettings(originalSettings)
                        .createdBy(10L)
                        .createdAt(originalTime)
                        .modifiedBy(10L)
                        .modifiedAt(originalTime)
                        .build();

        Map<String, Object> updatedSettings = new HashMap<>();
        updatedSettings.put("key1", "updated");
        updatedSettings.put("key2", 456);

        Instant updateTime = originalTime.plusSeconds(7200);

        ProjectSettingDTO updateDTO =
                ProjectSettingDTO.builder()
                        .id(2L)
                        .projectId(1L)
                        .sprintLengthDays(14)
                        .defaultPriority(TicketPriority.Low)
                        .estimationUnit(EstimationUnit.STORY_POINTS)
                        .enableEstimation(true)
                        .integrationSettings(updatedSettings)
                        .createdBy(10L)
                        .createdAt(originalTime)
                        .modifiedBy(11L)
                        .modifiedAt(updateTime)
                        .build();

        // When
        projectSettingMapper.updateEntity(updateDTO, existingSetting);

        // Then
        assertAll(
                () -> assertEquals(updateDTO.getId(), existingSetting.getId()),
                () -> assertEquals(updateDTO.getProjectId(), existingSetting.getProject().getId()),
                () ->
                        assertEquals(
                                updateDTO.getSprintLengthDays(),
                                existingSetting.getSprintLengthDays()),
                () ->
                        assertEquals(
                                updateDTO.getDefaultPriority(),
                                existingSetting.getDefaultPriority()),
                () ->
                        assertEquals(
                                updateDTO.getEstimationUnit(), existingSetting.getEstimationUnit()),
                () ->
                        assertEquals(
                                updateDTO.isEnableEstimation(),
                                existingSetting.isEnableEstimation()),
                () ->
                        assertEquals(
                                updateDTO.getIntegrationSettings(),
                                existingSetting.getIntegrationSettings()),
                () -> assertEquals(updateDTO.getCreatedBy(), existingSetting.getCreatedBy()),
                () -> assertEquals(updateDTO.getCreatedAt(), existingSetting.getCreatedAt()),
                () -> assertEquals(updateDTO.getModifiedBy(), existingSetting.getModifiedBy()),
                () -> assertEquals(updateDTO.getModifiedAt(), existingSetting.getModifiedAt()));
    }

    @Test
    public void testNullValues() {
        // Test null entity
        assertNull(projectSettingMapper.toDto(null));

        // Test null DTO
        assertNull(projectSettingMapper.toEntity(null));
    }
}
