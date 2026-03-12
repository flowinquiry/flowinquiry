package io.flowinquiry.query;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * A fully self-contained aggregation query that describes:
 *
 * <ul>
 *   <li>Which JPA entity to query (simple class name, e.g. {@code "Ticket"})
 *   <li>Which fields to GROUP BY
 *   <li>Which metrics to compute (COUNT, SUM, AVG, …)
 *   <li>Optional WHERE filters via {@link QueryDTO}
 *   <li>Optional post-aggregation sort
 * </ul>
 *
 * <p>This lets the {@code ReportEngine} handle any "group-by + aggregate" report without a new
 * {@code @Query} per report.
 *
 * <p>Example – channel distribution for a team:
 *
 * <pre>{@code
 * AggregationQuery q = new AggregationQuery();
 * q.setEntity("Ticket");
 * q.setGroupByFields(List.of("channel"));
 * q.setAggregations(List.of(new AggregationField("id", AggregationFunction.COUNT, "ticketCount")));
 * q.setFilters(queryDtoWithTeamIdAndDateFilters);
 * q.setSorts(List.of(new SortField("ticketCount", SortDirection.DESC)));
 * }</pre>
 */
@Getter
@Setter
public class AggregationQuery {

    /**
     * Simple JPA entity class name, e.g. {@code "Ticket"}. The {@code ReportEngine} resolves this
     * to the concrete {@link Class}.
     */
    @NotEmpty private String entity;

    /**
     * Fields to GROUP BY. Supports dot-notation for joins, e.g. {@code "assignUser.firstName"}.
     * Each entry becomes both a SELECT expression and a GROUP BY expression.
     */
    @NotEmpty private List<String> groupByFields;

    /** One or more metrics to compute over each group. */
    @NotEmpty private List<@Valid AggregationField> aggregations;

    /**
     * Optional WHERE filters. Reuses the existing {@link QueryDTO} / {@link GroupFilter}
     * infrastructure from {@code QueryUtils.createSpecification()}.
     */
    private QueryDTO filters;

    /**
     * Optional post-aggregation sort. Fields must match either a groupBy field name or an {@link
     * AggregationField#getAlias()}.
     */
    private List<SortField> sorts;
}
