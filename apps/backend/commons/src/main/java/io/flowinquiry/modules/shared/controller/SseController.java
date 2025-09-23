package io.flowinquiry.modules.shared.controller;

import io.flowinquiry.modules.shared.domain.EventPayload;
import io.flowinquiry.modules.shared.domain.EventPayloadType;
import io.flowinquiry.sse.UserEventSinkManager;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@RestController
public class SseController {

    private final UserEventSinkManager sinkManager;

    public SseController(UserEventSinkManager sinkManager) {
        this.sinkManager = sinkManager;
    }

    @GetMapping(value = "/sse/events/{userId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<EventPayload>> streamEvents(@PathVariable Long userId) {
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
