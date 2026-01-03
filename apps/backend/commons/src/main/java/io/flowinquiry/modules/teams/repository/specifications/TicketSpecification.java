package io.flowinquiry.modules.teams.repository.specifications;

import static io.flowinquiry.query.QueryUtils.createSpecification;
import static java.util.Objects.nonNull;

import io.flowinquiry.modules.teams.domain.Ticket;
import io.flowinquiry.modules.teams.service.dto.report.TicketThroughputQueryParams;
import io.flowinquiry.query.Filter;
import io.flowinquiry.query.FilterOperator;
import io.flowinquiry.query.GroupFilter;
import io.flowinquiry.query.LogicalOperator;
import io.flowinquiry.query.QueryDTO;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import lombok.experimental.UtilityClass;
import org.apache.commons.collections4.CollectionUtils;
import org.springframework.data.jpa.domain.Specification;

@UtilityClass
public class TicketSpecification {

    public static Specification<Ticket> buildThroughputReportSpecification(
          TicketThroughputQueryParams queryParams) {
        List<Filter> filters = new ArrayList<>();
        filters.add(new Filter("project.id", FilterOperator.EQ, queryParams.getProjectId()));
        filters.add(new Filter("isCompleted", FilterOperator.EQ, true));

        Long iterationId = queryParams.getIterationId();
        if (nonNull(iterationId)) {
            filters.add(new Filter("iteration.id", FilterOperator.EQ, iterationId));
        }

        List<String> statuses = queryParams.getStatuses();
        if (CollectionUtils.isNotEmpty(statuses)) {
            filters.add(new Filter("currentState.stateName", FilterOperator.IN, statuses));
        }

        List<String> priorities = queryParams.getPriorities();
        if (CollectionUtils.isNotEmpty(priorities)) {
            filters.add(new Filter("priority", FilterOperator.IN, priorities));
        }

        List<Long> assigneeIds = queryParams.getAssigneeIds();
        if (CollectionUtils.isNotEmpty(assigneeIds)) {
            filters.add(new Filter("assignUser.id", FilterOperator.IN, assigneeIds));
        }

        LocalDate createdFrom = queryParams.getFrom();
        if (nonNull(createdFrom)) {
            filters.add(
                  new Filter(
                        "createdAt",
                        FilterOperator.GTE,
                        createdFrom.atTime(LocalTime.MIN).atZone(ZoneOffset.UTC).toInstant()));
        }

        LocalDate createdTo = queryParams.getTo();
        if (nonNull(createdTo)) {
            filters.add(
                  new Filter(
                        "createdAt",
                        FilterOperator.LTE,
                        createdTo.atTime(LocalTime.MIN).atZone(ZoneOffset.UTC).toInstant()));
        }

        QueryDTO queryDTO = new QueryDTO();
        GroupFilter filter = new GroupFilter();
        filter.setLogicalOperator(LogicalOperator.AND);
        filter.setFilters(filters);
        queryDTO.setGroups(List.of(filter));
        return createSpecification(queryDTO);
    }
}
