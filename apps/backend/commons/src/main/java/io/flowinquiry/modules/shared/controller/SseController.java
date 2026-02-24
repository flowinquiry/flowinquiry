package io.flowinquiry.modules.shared.controller;

import io.flowinquiry.modules.shared.domain.EventPayload;
import io.flowinquiry.modules.shared.domain.EventPayloadType;
import io.flowinquiry.security.SecurityUtils;
import io.flowinquiry.security.service.JwtService;
import io.flowinquiry.sse.UserEventSinkManager;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;

@RestController
public class SseController {

    private final UserEventSinkManager sinkManager;
    private final JwtService jwtService;

    public SseController(UserEventSinkManager sinkManager, JwtService jwtService) {
        this.sinkManager = sinkManager;
        this.jwtService = jwtService;
    }

    @GetMapping(value = "/sse/events/{userId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<EventPayload>> streamEvents(
            @PathVariable Long userId,
            @RequestParam(required = false) String token,
            HttpServletResponse response) {
        // Validate token is provided
        if (token == null || token.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token is required");
        }

        // Authenticate the token
        Authentication authentication = jwtService.authenticateToken(token);
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired token");
        }

        // Extract userId from token and verify it matches the path parameter
        Long tokenUserId = SecurityUtils.getUserId(authentication).orElse(null);
        if (tokenUserId == null || !tokenUserId.equals(userId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "User ID in token does not match the requested user ID");
        }

        return sinkManager
                .getSink(userId)
                .map(
                        payload ->
                                ServerSentEvent.<EventPayload>builder()
                                        .event(payload.getType().name())
                                        .data(payload)
                                        .build());
    }

    public void sendEventToUser(Long userId, EventPayloadType type, Object data) {
        sinkManager.emitToUser(userId, new EventPayload(type, data));
    }

    public void sendEventToUsers(List<Long> userIds, EventPayloadType type, Object data) {
        userIds.forEach(userId -> sendEventToUser(userId, type, data));
    }

    public void broadcastEvent(EventPayloadType type, Object data) {
        sinkManager.broadcast(new EventPayload(type, data));
    }
}
