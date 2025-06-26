package io.flowinquiry.modules.teams.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.flowinquiry.IntegrationTest;
import io.flowinquiry.exceptions.ResourceNotFoundException;
import io.flowinquiry.modules.teams.domain.EstimationUnit;
import io.flowinquiry.modules.teams.domain.ProjectStatus;
import io.flowinquiry.modules.teams.repository.ProjectRepository;
import io.flowinquiry.modules.teams.service.dto.ProjectDTO;
import io.flowinquiry.modules.teams.service.dto.ProjectSettingDTO;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
public class ProjectSettingServiceIT {

    @Autowired private ProjectSettingService projectSettingService;

    @Autowired private ProjectRepository projectRepository;

    @Autowired private ProjectService projectService;

    private Long projectId;

    @BeforeEach
    public void setup() {
        ProjectDTO projectDTO =
                ProjectDTO.builder()
                        .name("Test Project for Settings")
                        .description("Project for testing settings")
                        .shortName("TPS")
                        .status(ProjectStatus.Active)
                        .teamId(1L)
                        .createdBy(1L)
                        .build();

        ProjectDTO savedProject = projectService.createProject(projectDTO);
        projectId = savedProject.getId();
    }

    @Test
    public void shouldGetDefaultSettingsWhenNoSettingsExist() {
        // Get settings for the test project
        ProjectSettingDTO settings = projectSettingService.getByProjectId(projectId);

        // Verify default settings
        assertThat(settings).isNotNull();
        assertThat(settings.getProjectId()).isEqualTo(projectId);
        assertThat(settings.getSprintLengthDays()).isEqualTo(14);
        assertThat(settings.getDefaultPriority()).isEqualTo(3);
        assertThat(settings.getEstimationUnit()).isEqualTo(EstimationUnit.STORY_POINTS);
        assertThat(settings.isEnableEstimation()).isTrue();
        assertThat(settings.getIntegrationSettings()).isNull();
    }

    @Test
    public void shouldThrowExceptionWhenProjectDoesNotExist() {
        // Try to get settings for a non-existent project
        Long nonExistentProjectId = 999999L;

        assertThatThrownBy(() -> projectSettingService.getByProjectId(nonExistentProjectId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Project not found");
    }

    @Test
    public void shouldSaveSettingsSuccessfully() {
        // Create settings DTO
        ProjectSettingDTO settingsDTO = new ProjectSettingDTO();
        settingsDTO.setProjectId(projectId);
        settingsDTO.setSprintLengthDays(21);
        settingsDTO.setDefaultPriority(2);
        settingsDTO.setEstimationUnit(EstimationUnit.DAYS);
        settingsDTO.setEnableEstimation(false);

        // Create a valid JSON object for integrationSettings
        Map<String, Object> integrationSettings = new HashMap<>();
        integrationSettings.put("jiraUrl", "https://jira.example.com");
        integrationSettings.put("jiraToken", "abc123");
        integrationSettings.put("enabled", true);
        settingsDTO.setIntegrationSettings(integrationSettings);

        // Save settings
        ProjectSettingDTO savedSettings = projectSettingService.save(settingsDTO);

        // Verify saved settings
        assertThat(savedSettings).isNotNull();
        assertThat(savedSettings.getId()).isNotNull();
        assertThat(savedSettings.getProjectId()).isEqualTo(projectId);
        assertThat(savedSettings.getSprintLengthDays()).isEqualTo(21);
        assertThat(savedSettings.getDefaultPriority()).isEqualTo(2);
        assertThat(savedSettings.getEstimationUnit()).isEqualTo(EstimationUnit.DAYS);
        assertThat(savedSettings.isEnableEstimation()).isFalse();
        assertThat(savedSettings.getIntegrationSettings()).isNotNull();

        // Verify settings can be retrieved
        ProjectSettingDTO retrievedSettings = projectSettingService.getByProjectId(projectId);
        assertThat(retrievedSettings).isNotNull();
        assertThat(retrievedSettings.getId()).isEqualTo(savedSettings.getId());
        assertThat(retrievedSettings.getProjectId()).isEqualTo(projectId);
        assertThat(retrievedSettings.getSprintLengthDays()).isEqualTo(21);
    }
}
