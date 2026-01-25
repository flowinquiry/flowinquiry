package io.flowinquiry.modules.collab.controller;

import io.flowinquiry.modules.collab.service.IntegrationService;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.Objects;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/integrations/webhook")
@AllArgsConstructor
public class IntegrationWebhook {
    private final IntegrationService integrationService;

    @PostMapping("/github")
    public ResponseEntity<?> githubWebhook(
            @RequestHeader("x-hub-signature-256") String signature,
            @RequestHeader("x-github-event") String event,
            @RequestParam("projectName") String projectName,
            HttpServletRequest request)
            throws IOException {
        byte[] requestBody = request.getInputStream().readAllBytes();
        String payload =
                integrationService.validateEventPayload(requestBody, signature, projectName);
        if (!Objects.nonNull(payload)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        integrationService.HandleEvent(payload, event);
        return ResponseEntity.ok("{\"message\":\"ok\"}");
    }
}
