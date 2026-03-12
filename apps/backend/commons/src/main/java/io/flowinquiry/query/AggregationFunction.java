package io.flowinquiry.query;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** Supported aggregation functions for the ReportEngine. */
public enum AggregationFunction {
    COUNT("count"),
    SUM("sum"),
    AVG("avg"),
    MIN("min"),
    MAX("max");

    private final String value;

    AggregationFunction(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static AggregationFunction fromValue(String value) {
        for (AggregationFunction f : values()) {
            if (f.value.equalsIgnoreCase(value) || f.name().equalsIgnoreCase(value)) {
                return f;
            }
        }
        throw new IllegalArgumentException("Unknown aggregation function: " + value);
    }
}
