package io.flowinquiry.modules.teams.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.flowinquiry.IntegrationTest;
import io.flowinquiry.exceptions.ResourceNotFoundException;
import io.flowinquiry.modules.teams.domain.EstimationUnit;
import io.flowinquiry.modules.teams.domain.ProjectStatus;
import io.flowinquiry.modules.teams.domain.TicketPriority;
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
        settingsDTO.setDefaultPriority(TicketPriority.Medium);
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

    @Test
    public void shouldUpdateExistingSettingsSuccessfully() {
        // First, create initial settings
        ProjectSettingDTO initialSettings = new ProjectSettingDTO();
        initialSettings.setProjectId(projectId);
        initialSettings.setSprintLengthDays(14);
        initialSettings.setDefaultPriority(TicketPriority.Low);
        initialSettings.setEstimationUnit(EstimationUnit.STORY_POINTS);
        initialSettings.setEnableEstimation(true);

        ProjectSettingDTO savedInitialSettings = projectSettingService.save(initialSettings);

        // Verify the settings were saved correctly
        ProjectSettingDTO retrievedBeforeUpdate = projectSettingService.getByProjectId(projectId);

        // Now create updated settings
        ProjectSettingDTO updatedSettings = new ProjectSettingDTO();
        // Set the ID from the saved settings to ensure we're updating the same record
        updatedSettings.setId(savedInitialSettings.getId());
        updatedSettings.setProjectId(projectId);
        updatedSettings.setSprintLengthDays(28);
        updatedSettings.setDefaultPriority(TicketPriority.High);
        updatedSettings.setEstimationUnit(EstimationUnit.DAYS);
        updatedSettings.setEnableEstimation(false);

        Map<String, Object> integrationSettings = new HashMap<>();
        integrationSettings.put("gitlabUrl", "https://gitlab.example.com");
        integrationSettings.put("gitlabToken", "xyz789");
        integrationSettings.put("enabled", true);
        updatedSettings.setIntegrationSettings(integrationSettings);

        // Update settings using updateByProjectId
        ProjectSettingDTO result =
                projectSettingService.updateByProjectId(projectId, updatedSettings);

        // Verify updated settings
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(savedInitialSettings.getId());
        assertThat(result.getProjectId()).isEqualTo(projectId);
        assertThat(result.getSprintLengthDays()).isEqualTo(28);
        assertThat(result.getDefaultPriority()).isEqualTo(1);
        assertThat(result.getEstimationUnit()).isEqualTo(EstimationUnit.DAYS);
        assertThat(result.isEnableEstimation()).isFalse();
        assertThat(result.getIntegrationSettings()).isNotNull();

        // Verify settings can be retrieved with updates
        ProjectSettingDTO retrievedSettings = projectSettingService.getByProjectId(projectId);
        assertThat(retrievedSettings).isNotNull();
        assertThat(retrievedSettings.getId()).isEqualTo(savedInitialSettings.getId());
        assertThat(retrievedSettings.getSprintLengthDays()).isEqualTo(28);
        assertThat(retrievedSettings.getEstimationUnit()).isEqualTo(EstimationUnit.DAYS);
    }

    @Test
    public void shouldCreateNewSettingsWhenUpdatingNonExistentSettings() {
        // Make sure no settings exist yet (using a clean project)
        ProjectSettingDTO defaultSettings = projectSettingService.getByProjectId(projectId);
        assertThat(defaultSettings.getId()).isNull(); // Default settings have no ID

        // Create settings to update with
        ProjectSettingDTO newSettings = new ProjectSettingDTO();
        newSettings.setSprintLengthDays(7);
        newSettings.setDefaultPriority(TicketPriority.Trivial);
        newSettings.setEstimationUnit(EstimationUnit.DAYS);
        newSettings.setEnableEstimation(true);

        // Update (which should create new settings)
        ProjectSettingDTO result = projectSettingService.updateByProjectId(projectId, newSettings);

        // Verify new settings were created
        assertThat(result).isNotNull();
        assertThat(result.getId()).isNotNull();
        assertThat(result.getProjectId()).isEqualTo(projectId);
        assertThat(result.getSprintLengthDays()).isEqualTo(7);
        assertThat(result.getDefaultPriority()).isEqualTo(4);
        assertThat(result.getEstimationUnit()).isEqualTo(EstimationUnit.DAYS);
        assertThat(result.isEnableEstimation()).isTrue();

        // Verify settings can be retrieved
        ProjectSettingDTO retrievedSettings = projectSettingService.getByProjectId(projectId);
        assertThat(retrievedSettings).isNotNull();
        assertThat(retrievedSettings.getId()).isEqualTo(result.getId());
        assertThat(retrievedSettings.getSprintLengthDays()).isEqualTo(7);
    }

    @Test
    public void shouldThrowExceptionWhenUpdatingSettingsForNonExistentProject() {
        // Try to update settings for a non-existent project
        Long nonExistentProjectId = 999999L;
        ProjectSettingDTO settingsDTO = new ProjectSettingDTO();
        settingsDTO.setSprintLengthDays(10);

        assertThatThrownBy(
                        () ->
                                projectSettingService.updateByProjectId(
                                        nonExistentProjectId, settingsDTO))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Project not found");
    }
}
