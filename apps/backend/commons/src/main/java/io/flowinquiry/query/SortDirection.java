package io.flowinquiry.query;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** Sort direction for post-aggregation ordering. */
public enum SortDirection {
    ASC("asc"),
    DESC("desc");

    private final String value;

    SortDirection(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static SortDirection fromValue(String value) {
        for (SortDirection d : values()) {
            if (d.value.equalsIgnoreCase(value) || d.name().equalsIgnoreCase(value)) {
                return d;
            }
        }
        throw new IllegalArgumentException("Unknown sort direction: " + value);
    }
}
