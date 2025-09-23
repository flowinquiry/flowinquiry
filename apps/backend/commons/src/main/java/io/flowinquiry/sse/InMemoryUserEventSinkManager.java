package io.flowinquiry.sse;

import io.flowinquiry.modules.shared.domain.EventPayload;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

@Component
public class InMemoryUserEventSinkManager implements UserEventSinkManager {

    private final Map<Long, Sinks.Many<EventPayload>> sinks = new ConcurrentHashMap<>();

    @Override
    public Flux<EventPayload> getSink(Long userId) {
        return sinks.computeIfAbsent(userId, id -> Sinks.many().multicast().onBackpressureBuffer())
                .asFlux();
    }

    @Override
    public void emitToUser(Long userId, EventPayload payload) {
        Sinks.Many<EventPayload> sink = sinks.get(userId);
        if (sink != null) {
            sink.tryEmitNext(payload);
        }
    }

    @Override
    public void broadcast(EventPayload payload) {
        sinks.values().forEach(sink -> sink.tryEmitNext(payload));
    }
}
