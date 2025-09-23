package io.flowinquiry.modules.shared.domain;

import lombok.Getter;

@Getter
public class EventPayload<T> {

    private EventPayloadType type;
    private T data;

    public EventPayload(EventPayloadType type, T data) {
        this.type = type;
        this.data = data;
    }
}
