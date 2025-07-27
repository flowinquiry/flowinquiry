package io.flowinquiry.modules.collab.service;

import io.flowinquiry.modules.collab.domain.AppSetting;
import io.flowinquiry.modules.collab.repository.AppSettingRepository;
import io.flowinquiry.modules.collab.service.dto.AppSettingDTO;
import io.flowinquiry.modules.collab.service.event.MailSettingsUpdatedEvent;
import java.util.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
public class AppSettingService {

    private final AppSettingRepository appSettingRepository;
    private final ApplicationEventPublisher eventPublisher;

    public AppSettingService(
            AppSettingRepository appSettingRepository, ApplicationEventPublisher eventPublisher) {
        this.appSettingRepository = appSettingRepository;
        this.eventPublisher = eventPublisher;
    }

    @Cacheable(value = "appSettings", key = "#key")
    public Optional<AppSetting> getRawSetting(String key) {
        return appSettingRepository.findById(key);
    }

    public Optional<String> getValue(String key) {
        return getRawSetting(key).map(AppSetting::getValue);
    }

    public Optional<String> getDecryptedValue(String key) {
        return getRawSetting(key)
                .map(
                        setting -> {
                            if (setting.getType() != null
                                    && setting.getType().startsWith("secret:")) {
                                String algorithm = setting.getType().substring("secret:".length());
                                return decrypt(setting.getValue(), algorithm);
                            } else {
                                return setting.getValue();
                            }
                        });
    }

    public List<AppSettingDTO> getAllSettingDTOs() {
        List<AppSetting> settings = appSettingRepository.findAll();
        return settings.stream()
                .map(
                        s ->
                                new AppSettingDTO(
                                        s.getKey(),
                                        s.getValue(),
                                        s.getType(),
                                        s.getGroup(),
                                        s.getDescription()))
                .toList();
    }

    public List<AppSettingDTO> getSettingsByGroup(String group) {
        List<AppSetting> settings =
                appSettingRepository.findAll(); // or create a custom query for better performance
        return settings.stream()
                .filter(s -> Objects.equals(s.getGroup(), group))
                .map(
                        s ->
                                new AppSettingDTO(
                                        s.getKey(),
                                        s.getValue(),
                                        s.getType(),
                                        s.getGroup(),
                                        s.getDescription()))
                .toList();
    }

    public Map<String, String> getAllValues() {
        List<AppSetting> all = appSettingRepository.findAll();
        Map<String, String> result = new LinkedHashMap<>();
        for (AppSetting setting : all) {
            result.put(setting.getKey(), setting.getValue());
        }
        return result;
    }

    @Transactional
    @CacheEvict(value = "appSettings", key = "#key")
    public void updateValue(String key, String value) {
        AppSetting setting =
                appSettingRepository
                        .findById(key)
                        .orElseGet(
                                () -> {
                                    AppSetting s = new AppSetting();
                                    s.setKey(key);
                                    s.setType("string"); // default type
                                    return s;
                                });
        setting.setValue(value);
        appSettingRepository.save(setting);

        log.info("Updated setting: {} = {}", key, value);

        if (key.startsWith("mail.")) {
            eventPublisher.publishEvent(new MailSettingsUpdatedEvent(this));
        }
    }

    @Transactional
    public void updateSettings(List<AppSettingDTO> settings) {
        boolean hasMailSettings = false;

        for (AppSettingDTO dto : settings) {
            AppSetting setting =
                    appSettingRepository.findById(dto.getKey()).orElseGet(AppSetting::new);
            setting.setKey(dto.getKey());
            setting.setValue(dto.getValue());
            setting.setType(dto.getType());
            setting.setGroup(dto.getGroup());
            setting.setDescription(dto.getDescription());
            appSettingRepository.save(setting);
            cacheEvict(dto.getKey());

            log.info("Bulk updated setting: {} = {}", dto.getKey(), dto.getValue());

            // Check if this is a mail setting, but don't publish event yet
            if (dto.getKey().startsWith("mail.")) {
                hasMailSettings = true;
            }
        }

        // Publish event only once after all settings are updated
        if (hasMailSettings) {
            eventPublisher.publishEvent(new MailSettingsUpdatedEvent(this));
        }
    }

    @CacheEvict(value = "appSettings", key = "#key")
    public void cacheEvict(String key) {
        // This is required for Spring to process @CacheEvict internally
    }

    // 🔐 Placeholder for encryption — replace with real implementation
    private String decrypt(String encryptedValue, String algorithm) {
        return encryptedValue;
    }

    private String encrypt(String plainValue, String algorithm) {
        return plainValue;
    }
}
