package io.flowinquiry.query;

import java.util.LinkedHashMap;
import java.util.Map;
import lombok.Getter;

/**
 * A single row returned by the {@code ReportEngine}.
 *
 * <p>Contains:
 *
 * <ul>
 *   <li>{@code dimensions} – the GROUP BY values, keyed by field name
 *   <li>{@code metrics} – the aggregated values, keyed by alias
 * </ul>
 *
 * <p>Using a generic map avoids defining a new DTO per report.
 */
@Getter
public class AggregationResult {

    /** GROUP BY field values, e.g. {@code {"channel": "email"}}. */
    private final Map<String, Object> dimensions = new LinkedHashMap<>();

    /** Aggregated metric values, e.g. {@code {"ticketCount": 42}}. */
    private final Map<String, Number> metrics = new LinkedHashMap<>();

    public void addDimension(String key, Object value) {
        dimensions.put(key, value);
    }

    public void addMetric(String key, Number value) {
        metrics.put(key, value);
    }
}
