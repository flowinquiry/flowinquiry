package io.flowinquiry.modules.collab.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.flowinquiry.modules.collab.service.dto.*;
import io.flowinquiry.modules.teams.domain.Integration;
import io.flowinquiry.modules.teams.domain.Project;
import io.flowinquiry.modules.teams.repository.IntegrationSettingsRepository;
import io.flowinquiry.modules.teams.repository.ProjectRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class IntegrationService {

    private ProjectRepository projectRepository;
    private IntegrationSettingsRepository integrationSettingsRepository;
    private ObjectMapper objectMapper;

    public String validateEventPayload(byte[] rawBody, String signature, String projectName)
            throws JsonProcessingException {
        Project project = projectRepository.findByShortName(projectName).orElseThrow();
        String payload = new String(rawBody);
        GithubPayloadBase dto = objectMapper.readValue(payload, GithubPayloadBase.class);
        String repoName = dto.getGitHubRepository().getFullName();
        Integration settings =
                integrationSettingsRepository
                        .findByProjectIdAndRepoNameAndEnabled(project.getId(), repoName)
                        .orElseThrow();
        return verifySignature(rawBody, signature, settings.getWebhookSecret()) ? payload : null;
    }

    public void HandleEvent(String payload, String event) {
        try {
            switch (event) {
                case "pull_request":
                    objectMapper.readValue(payload, GitHubPullRequestDTO.class);

                    // do something with parsed payload
                    break;
                case "push":
                    objectMapper.readValue(payload, GitHubCommitPushDTO.class);
                    break;
                case "issues":
                    objectMapper.readValue(payload, GithubIssueDTO.class);
                    break;
                case "ping":
                    objectMapper.readValue(payload, GithubPingDTO.class);
                    break;
            }
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    private boolean verifySignature(byte[] rawBody, String signatureHeader, String secret) {

        try {
            String hex = signatureHeader.substring("sha256=".length()).trim();
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec =
                    new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] expectedDigest = mac.doFinal(rawBody);
            return MessageDigest.isEqual(hex(expectedDigest).getBytes(), hex.getBytes());
        } catch (Exception e) {
            return false;
        }
    }

    private String hex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte aByte : bytes) {
            result.append(String.format("%02x", aByte));
        }
        return result.toString();
    }
}
