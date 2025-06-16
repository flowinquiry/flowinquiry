package io.flowinquiry.query;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** Enum representing the available filter operators for query operations. */
public enum FilterOperator {
    GT("gt"), // Greater Than
    LT("lt"), // Less Than
    EQ("eq"), // Equals
    NE("ne"), // Not Equals
    LK("lk"), // Like
    IN("in"); // In

    private final String value;

    FilterOperator(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    @JsonCreator
    public static FilterOperator fromValue(String value) {
        for (FilterOperator op : values()) {
            if (op.name().equalsIgnoreCase(value)) {
                return op;
            }
        }
        throw new IllegalArgumentException("Invalid FilterOperator: " + value);
    }

    @JsonValue
    public String toValue() {
        return name().toLowerCase(); // Output as "eq", "ne", etc.
    }
}
