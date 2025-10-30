package io.flowinquiry.config;

import org.apache.commons.lang3.BooleanUtils;
import org.springframework.boot.actuate.info.Info;
import org.springframework.boot.actuate.info.InfoContributor;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class FeatureFlagContributor implements InfoContributor {
    private final Environment environment;

    public FeatureFlagContributor(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void contribute(Info.Builder builder) {
        builder.withDetail("feature_flags", generateFeatureFlags());
    }

    private Map<String, Object> generateFeatureFlags() {
        Map<String, Object> featureFlags = new HashMap<>();
        featureFlags.put("kafka", retrieveFeatureFlag("features.kafka.enabled"));
        return featureFlags;
    }

    private String retrieveFeatureFlag(String property) {
        Boolean toggle = environment.getProperty(property, Boolean.class);
        return BooleanUtils.toString(toggle, "On", "Off", "?");
    }
}
