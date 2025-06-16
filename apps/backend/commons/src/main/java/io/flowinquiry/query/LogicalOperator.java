package io.flowinquiry.query;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum LogicalOperator {
    AND,
    OR;

    @JsonCreator
    public static LogicalOperator fromValue(String value) {
        for (LogicalOperator op : values()) {
            if (op.name().equalsIgnoreCase(value)) {
                return op;
            }
        }
        throw new IllegalArgumentException("Invalid FilterOperator: " + value);
    }

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }
}
