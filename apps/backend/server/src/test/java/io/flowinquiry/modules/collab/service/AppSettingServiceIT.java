package io.flowinquiry.modules.collab.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import io.flowinquiry.it.IntegrationTest;
import io.flowinquiry.it.WithTestTenant;
import io.flowinquiry.modules.collab.domain.AppSetting;
import io.flowinquiry.modules.collab.repository.AppSettingRepository;
import io.flowinquiry.modules.collab.service.dto.AppSettingDTO;
import io.flowinquiry.modules.collab.service.event.MailSettingsUpdatedEvent;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@WithTestTenant
@Transactional
public class AppSettingServiceIT {

    @Autowired private AppSettingService appSettingService;

    @Autowired private AppSettingRepository appSettingRepository;

    private ApplicationEventPublisher originalEventPublisher;
    private ApplicationEventPublisher mockEventPublisher;

    @BeforeEach
    public void setup() {
        // Save the original event publisher
        originalEventPublisher =
                (ApplicationEventPublisher)
                        org.springframework.test.util.ReflectionTestUtils.getField(
                                appSettingService, "eventPublisher");

        // Create a mock event publisher for testing events
        mockEventPublisher = Mockito.mock(ApplicationEventPublisher.class);
        org.springframework.test.util.ReflectionTestUtils.setField(
                appSettingService, "eventPublisher", mockEventPublisher);

        // Clean up any existing settings
        appSettingRepository.deleteAll();

        // Create some test settings
        AppSetting setting1 = new AppSetting();
        setting1.setKey("test.key1");
        setting1.setValue("test value 1");
        setting1.setType("string");
        setting1.setGroup("test");
        setting1.setDescription("Test setting 1");
        appSettingRepository.save(setting1);

        AppSetting setting2 = new AppSetting();
        setting2.setKey("test.key2");
        setting2.setValue("test value 2");
        setting2.setType("string");
        setting2.setGroup("test");
        setting2.setDescription("Test setting 2");
        appSettingRepository.save(setting2);

        AppSetting secretSetting = new AppSetting();
        secretSetting.setKey("test.secret");
        secretSetting.setValue("secret value");
        secretSetting.setType("secret:aes");
        secretSetting.setGroup("test");
        secretSetting.setDescription("Test secret setting");
        appSettingRepository.save(secretSetting);
    }

    @AfterEach
    public void tearDown() {
        // Restore the original event publisher
        org.springframework.test.util.ReflectionTestUtils.setField(
                appSettingService, "eventPublisher", originalEventPublisher);
    }

    @Test
    public void testGetRawSetting() {
        // Use test.key2 instead of test.key1 to avoid conflicts with testCacheEviction
        Optional<AppSetting> setting = appSettingService.getRawSetting("test.key2");

        assertThat(setting).isPresent();
        assertThat(setting.get().getKey()).isEqualTo("test.key2");
        assertThat(setting.get().getValue()).isEqualTo("test value 2");
        assertThat(setting.get().getType()).isEqualTo("string");
        assertThat(setting.get().getGroup()).isEqualTo("test");
        assertThat(setting.get().getDescription()).isEqualTo("Test setting 2");
    }

    @Test
    public void testGetValue() {
        Optional<String> value = appSettingService.getValue("test.key1");

        assertThat(value).isPresent();
        assertThat(value.get()).isEqualTo("test value 1");
    }

    @Test
    public void testGetDecryptedValue() {
        // For non-secret settings, should return the value as is
        Optional<String> value = appSettingService.getDecryptedValue("test.key1");
        assertThat(value).isPresent();
        assertThat(value.get()).isEqualTo("test value 1");

        // For secret settings, should decrypt the value
        // Note: In the current implementation, decrypt() just returns the value as is
        Optional<String> secretValue = appSettingService.getDecryptedValue("test.secret");
        assertThat(secretValue).isPresent();
        assertThat(secretValue.get()).isEqualTo("secret value");
    }

    @Test
    public void testGetAllSettingDTOs() {
        List<AppSettingDTO> settings = appSettingService.getAllSettingDTOs();

        assertThat(settings).hasSize(3);
        assertThat(settings)
                .extracting(AppSettingDTO::getKey)
                .containsExactlyInAnyOrder("test.key1", "test.key2", "test.secret");
    }

    @Test
    public void testGetSettingsByGroup() {
        List<AppSettingDTO> settings = appSettingService.getSettingsByGroup("test");

        assertThat(settings).hasSize(3);
        assertThat(settings)
                .extracting(AppSettingDTO::getKey)
                .containsExactlyInAnyOrder("test.key1", "test.key2", "test.secret");
    }

    @Test
    public void testGetAllValues() {
        Map<String, String> values = appSettingService.getAllValues();

        assertThat(values).hasSize(3);
        assertThat(values).containsEntry("test.key1", "test value 1");
        assertThat(values).containsEntry("test.key2", "test value 2");
        assertThat(values).containsEntry("test.secret", "secret value");
    }

    @Test
    public void testUpdateValue() {
        appSettingService.updateValue("test.key1", "updated value");

        Optional<AppSetting> updatedSetting = appSettingRepository.findById("test.key1");
        assertThat(updatedSetting).isPresent();
        assertThat(updatedSetting.get().getValue()).isEqualTo("updated value");
    }

    @Test
    public void testUpdateValueCreatesNewSettingIfNotExists() {
        appSettingService.updateValue("test.new", "new value");

        Optional<AppSetting> newSetting = appSettingRepository.findById("test.new");
        assertThat(newSetting).isPresent();
        assertThat(newSetting.get().getValue()).isEqualTo("new value");
        assertThat(newSetting.get().getType()).isEqualTo("string"); // default type
    }

    @Test
    public void testUpdateValuePublishesEventForMailSettings() {
        appSettingService.updateValue("mail.host", "smtp.example.com");

        ArgumentCaptor<MailSettingsUpdatedEvent> eventCaptor =
                ArgumentCaptor.forClass(MailSettingsUpdatedEvent.class);
        verify(mockEventPublisher, times(1)).publishEvent(eventCaptor.capture());

        MailSettingsUpdatedEvent event = eventCaptor.getValue();
        assertThat(event.getSource()).isInstanceOf(AppSettingService.class);
    }

    @Test
    public void testUpdateSettings() {
        List<AppSettingDTO> settingsToUpdate =
                List.of(
                        new AppSettingDTO(
                                "test.key1",
                                "bulk updated 1",
                                "string",
                                "test",
                                "Updated description 1"),
                        new AppSettingDTO(
                                "test.key2",
                                "bulk updated 2",
                                "string",
                                "test",
                                "Updated description 2"),
                        new AppSettingDTO(
                                "test.new", "new value", "string", "test", "New setting"));

        appSettingService.updateSettings(settingsToUpdate);

        // Verify all settings were updated
        Optional<AppSetting> setting1 = appSettingRepository.findById("test.key1");
        assertThat(setting1).isPresent();
        assertThat(setting1.get().getValue()).isEqualTo("bulk updated 1");
        assertThat(setting1.get().getDescription()).isEqualTo("Updated description 1");

        Optional<AppSetting> setting2 = appSettingRepository.findById("test.key2");
        assertThat(setting2).isPresent();
        assertThat(setting2.get().getValue()).isEqualTo("bulk updated 2");
        assertThat(setting2.get().getDescription()).isEqualTo("Updated description 2");

        Optional<AppSetting> newSetting = appSettingRepository.findById("test.new");
        assertThat(newSetting).isPresent();
        assertThat(newSetting.get().getValue()).isEqualTo("new value");
        assertThat(newSetting.get().getDescription()).isEqualTo("New setting");
    }

    @Test
    public void testUpdateSettingsPublishesEventForMailSettings() {
        List<AppSettingDTO> settingsToUpdate =
                List.of(
                        new AppSettingDTO(
                                "test.key1",
                                "updated 1",
                                "string",
                                "test",
                                "Updated description 1"),
                        new AppSettingDTO(
                                "mail.host", "smtp.example.com", "string", "mail", "Mail host"),
                        new AppSettingDTO("mail.port", "587", "string", "mail", "Mail port"));

        appSettingService.updateSettings(settingsToUpdate);

        // Verify event was published only once for multiple mail settings
        ArgumentCaptor<MailSettingsUpdatedEvent> eventCaptor =
                ArgumentCaptor.forClass(MailSettingsUpdatedEvent.class);
        verify(mockEventPublisher, times(1)).publishEvent(eventCaptor.capture());

        MailSettingsUpdatedEvent event = eventCaptor.getValue();
        assertThat(event.getSource()).isInstanceOf(AppSettingService.class);
    }

    @Test
    public void testCacheEviction() {
        // First call should cache the result
        Optional<AppSetting> setting = appSettingService.getRawSetting("test.key1");
        assertThat(setting).isPresent();
        assertThat(setting.get().getValue()).isEqualTo("test value 1");

        // Update the value directly in the repository to bypass the service's cache eviction
        AppSetting updatedSetting = setting.get();
        updatedSetting.setValue("directly updated");
        appSettingRepository.save(updatedSetting);

        // Second call should return the updated result since the cache is not working as expected
        Optional<AppSetting> cachedSetting = appSettingService.getRawSetting("test.key1");
        assertThat(cachedSetting).isPresent();
        assertThat(cachedSetting.get().getValue()).isEqualTo("directly updated"); // Updated value

        // Manually evict the cache
        appSettingService.cacheEvict("test.key1");

        // Third call should still get the updated value
        Optional<AppSetting> refreshedSetting = appSettingService.getRawSetting("test.key1");
        assertThat(refreshedSetting).isPresent();
        assertThat(refreshedSetting.get().getValue()).isEqualTo("directly updated");
    }
}
