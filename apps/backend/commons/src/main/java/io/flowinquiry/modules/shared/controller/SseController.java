package io.flowinquiry.modules.shared.controller;

import io.flowinquiry.modules.shared.domain.EventPayload;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

@RestController
public class SseController {

    private final Sinks.Many<EventPayload> sink = Sinks.many().multicast().onBackpressureBuffer();

    @GetMapping(value = "/sse/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<EventPayload>> streamEvents() {
        return sink.asFlux()
                .map(
                        payload ->
                                ServerSentEvent.<EventPayload>builder()
                                        .event(payload.getType())
                                        .data(payload)
                                        .build());
    }

    public void sendEvent(String type, Object data) {
        sink.tryEmitNext(new EventPayload(type, data));
    }
}
