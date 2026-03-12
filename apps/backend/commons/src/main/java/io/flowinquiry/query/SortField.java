package io.flowinquiry.query;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Specifies a sort on a dimension or metric alias after aggregation.
 *
 * <p>Example: sort by "ticketCount" DESC.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SortField {

    /** The alias of a groupBy field or an {@link AggregationField#getAlias()}. */
    @NotEmpty private String field;

    private SortDirection direction = SortDirection.DESC;
}
