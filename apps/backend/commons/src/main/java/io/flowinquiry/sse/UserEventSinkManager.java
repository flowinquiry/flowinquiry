package io.flowinquiry.sse;

import io.flowinquiry.modules.shared.domain.EventPayload;
import reactor.core.publisher.Flux;

public interface UserEventSinkManager {
    Flux<EventPayload> getSink(Long userId);

    void emitToUser(Long userId, EventPayload payload);

    void broadcast(EventPayload payload);
}
