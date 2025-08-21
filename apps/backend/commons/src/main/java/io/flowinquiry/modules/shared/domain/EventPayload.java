package io.flowinquiry.modules.shared.domain;

import lombok.Getter;

@Getter
public class EventPayload<T> {
    public static final String UPDATED_EPIC = "UpdatedEpic";
    public static final String UPDATED_ITERATION = "UpdatedIteration";

    private String type;
    private T data;

    public EventPayload(String type, T data) {
        this.type = type;
        this.data = data;
    }
}
