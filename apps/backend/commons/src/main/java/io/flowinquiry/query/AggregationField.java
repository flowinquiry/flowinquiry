package io.flowinquiry.query;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Describes a single metric to compute: e.g. COUNT(id) AS ticketCount.
 *
 * <p>Use {@code field = "*"} for COUNT(*).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AggregationField {

    /** JPA entity field to aggregate (use {@code "id"} for COUNT). */
    @NotEmpty private String field;

    /** Aggregation function to apply. */
    @NotNull private AggregationFunction function;

    /**
     * Alias used as the key in {@link AggregationResult#getMetrics()}. Defaults to {@code
     * function_field} when not specified.
     */
    @NotEmpty private String alias;
}
