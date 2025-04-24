package io.flowinquiry.modules.shared.controller;

import io.flowinquiry.config.FlowInquiryProperties;
import io.flowinquiry.modules.shared.service.dto.EditionType;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/versions")
public class VersionController {

    private final FlowInquiryProperties flowInquiryProperties;

    private final RestTemplate restTemplate;
    private static final String LATEST_VERSION_URL =
            "https://raw.githubusercontent.com/flowinquiry/flowinquiry/main/version.json";

    public VersionController(FlowInquiryProperties flowInquiryProperties) {
        this.flowInquiryProperties = flowInquiryProperties;

        this.restTemplate = new RestTemplate();
        List<HttpMessageConverter<?>> messageConverters = new ArrayList<>();
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
        converter.setSupportedMediaTypes(
                Arrays.asList(MediaType.APPLICATION_JSON, MediaType.TEXT_PLAIN));
        messageConverters.add(converter);
        restTemplate.setMessageConverters(messageConverters);
    }

    @GetMapping
    public Map<String, String> getVersion() {
        return Map.of(
                "version", flowInquiryProperties.getVersion(),
                "edition", flowInquiryProperties.getEdition().name().toLowerCase());
    }

    @GetMapping("/check")
    public ResponseEntity<?> checkVersion() {
        if (flowInquiryProperties.getEdition() == EditionType.CLOUD) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Not applicable for cloud-hosted users.");
        }
        try {
            String currentVersion = flowInquiryProperties.getVersion();

            ResponseEntity<Map> response = restTemplate.getForEntity(LATEST_VERSION_URL, Map.class);
            Map<String, String> latestVersionInfo = response.getBody();

            boolean isOutdated =
                    compareVersions(currentVersion, latestVersionInfo.get("latestVersion")) < 0;

            Map<String, Object> result = new HashMap<>();
            result.put("currentVersion", currentVersion);
            result.put("isOutdated", isOutdated);
            result.putAll(latestVersionInfo);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("Unable to fetch latest version info.");
        }
    }

    /**
     * Compare two semantic version strings in the format major.minor.patch. Returns: -1 if v1 < v2
     * 0 if v1 == v2 1 if v1 > v2
     */
    public static int compareVersions(String v1, String v2) {
        if (v1 == null || v2 == null) {
            throw new IllegalArgumentException("Version strings must not be null");
        }

        String[] parts1 = v1.split("\\.");
        String[] parts2 = v2.split("\\.");

        int length = Math.max(parts1.length, parts2.length);
        for (int i = 0; i < length; i++) {
            int num1 = i < parts1.length ? parsePart(parts1[i]) : 0;
            int num2 = i < parts2.length ? parsePart(parts2[i]) : 0;

            if (num1 != num2) {
                return Integer.compare(num1, num2);
            }
        }
        return 0;
    }

    private static int parsePart(String part) {
        try {
            return Integer.parseInt(part);
        } catch (NumberFormatException e) {
            return 0; // fallback to 0 if part is non-numeric
        }
    }
}
