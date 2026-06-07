package io.flowinquiry.modules.teams.service;

import static io.flowinquiry.query.QueryUtils.createSpecification;
import static java.util.Objects.nonNull;

import io.flowinquiry.modules.teams.domain.Ticket;
import io.flowinquiry.modules.teams.domain.TicketPriority;
import io.flowinquiry.modules.teams.repository.TicketRepository;
import io.flowinquiry.modules.teams.service.dto.TicketAgingDTO;
import io.flowinquiry.modules.teams.service.dto.TicketAgingReportDTO;
import io.flowinquiry.modules.teams.service.dto.TicketQueryParams;
import io.flowinquiry.modules.teams.service.dto.TicketThroughputBucketDTO;
import io.flowinquiry.modules.teams.service.dto.TicketThroughputGranularity;
import io.flowinquiry.modules.teams.service.dto.TicketThroughputGroupBy;
import io.flowinquiry.modules.teams.service.dto.TicketThroughputQueryDTO;
import io.flowinquiry.modules.teams.service.dto.TicketThroughputReportDTO;
import io.flowinquiry.modules.teams.service.dto.TicketThroughputTableRowDTO;
import io.flowinquiry.modules.teams.service.mapper.TicketMapper;
import io.flowinquiry.query.*;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketAgingReportService {

    private final TicketRepository ticketRepository;

    private final TicketMapper ticketMapper;

    private static final List<String> DEFAULT_COMPLETED_STATUS_ALIASES =
            List.of("RESOLVED", "CLOSED");

    @Transactional(readOnly = true)
    public TicketAgingReportDTO getAgingTicketsReport(TicketQueryParams queryParams) {

        Specification<Ticket> ticketsSpecification =
                getTicketsForAgingReport(
                        queryParams.getProjectId(),
                        queryParams.getIterationId(),
                        queryParams.getStatus(),
                        queryParams.getPriority(),
                        queryParams.getAssignUserId(),
                        queryParams.getCreatedFrom(),
                        queryParams.getCreatedTo(),
                        queryParams.isIncludeClosed());
        List<Ticket> ticketList = ticketRepository.findAll(ticketsSpecification);

        List<TicketAgingDTO> agingTickets =
                ticketList.stream()
                        .map(this::calculateTicketAge)
                        .sorted(Comparator.comparingLong(TicketAgingDTO::getAgeInDays).reversed())
                        .toList();
        Map<String, List<TicketAgingDTO>> groupedTickets =
                groupTickets(agingTickets, queryParams.getGroupBy());
        DoubleSummaryStatistics ageStats =
                agingTickets.stream().mapToDouble(TicketAgingDTO::getAgeInDays).summaryStatistics();

        TicketAgingReportDTO report = new TicketAgingReportDTO();
        report.setGroupedTickets(groupedTickets);
        report.setAverageAge(ageStats.getAverage());
        report.setMaxAge((long) ageStats.getMax());
        report.setMinAge((long) ageStats.getMin());
        report.setTotalTickets(agingTickets.size());

        return report;
    }

    private TicketAgingDTO calculateTicketAge(Ticket ticket) {
        TicketAgingDTO dto = new TicketAgingDTO();
        dto.setTicketId(ticket.getId());
        dto.setTicketKey(
                nonNull(ticket.getProjectTicketNumber())
                        ? ticket.getProject().getShortName() + "-" + ticket.getProjectTicketNumber()
                        : "TICKET-" + ticket.getId());
        dto.setTitle(ticket.getRequestTitle());
        dto.setPriority(ticket.getPriority());
        dto.setStatus(ticket.getCurrentState().getStateName());
        dto.setAssignee(
                nonNull(ticket.getAssignUser())
                        ? ticket.getAssignUser().getFirstName()
                                + " "
                                + ticket.getAssignUser().getLastName()
                        : "Unassigned");

        // Calculate age in days
        long ageInDays =
                ticket.getIsCompleted()
                        ? ChronoUnit.DAYS.between(
                                ticket.getCreatedAt(),
                                ticket.getActualCompletionDate()
                                        .atStartOfDay()
                                        .toInstant(ZoneOffset.UTC))
                        : ChronoUnit.DAYS.between(ticket.getCreatedAt(), Instant.now());
        dto.setAgeInDays(ageInDays);
        dto.setCreatedDate(ticket.getCreatedAt());
        if (ticket.getIsCompleted())
            dto.setCompletionDate(
                    ticket.getActualCompletionDate().atStartOfDay().toInstant(ZoneOffset.UTC));
        return dto;
    }

    private Map<String, List<TicketAgingDTO>> groupTickets(
            List<TicketAgingDTO> tickets, String groupBy) {
        return switch (groupBy) {
            case "status" ->
                    tickets.stream().collect(Collectors.groupingBy(TicketAgingDTO::getStatus));
            case "priority" ->
                    tickets.stream()
                            .collect(Collectors.groupingBy(t -> t.getPriority().toString()));
            default -> tickets.stream().collect(Collectors.groupingBy(TicketAgingDTO::getAssignee));
        };
    }

    private Specification<Ticket> getTicketsForAgingReport(
            String projectId,
            String iterationId,
            List<String> status,
            List<String> priorityList,
            List<String> assigneeIdList,
            LocalDate createdFrom,
            LocalDate createdTo,
            boolean includeClosed) {
        List<Filter> filters = new ArrayList<>();
        filters.add(new Filter("project.id", FilterOperator.EQ, projectId));

        if (nonNull(iterationId)) {
            filters.add(new Filter("iteration.id", FilterOperator.EQ, iterationId));
        }
        if (nonNull(status) && !status.isEmpty()) {
            filters.add(new Filter("currentState.stateName", FilterOperator.IN, status));
        }
        if (nonNull(priorityList) && !priorityList.isEmpty()) {

            filters.add(new Filter("priority", FilterOperator.IN, priorityList));
        }
        if (nonNull(assigneeIdList) && !assigneeIdList.isEmpty()) {
            filters.add(new Filter("assignUser.id", FilterOperator.IN, assigneeIdList));
        }
        if (nonNull(createdFrom)) {
            filters.add(
                    new Filter(
                            "createdAt",
                            FilterOperator.GTE,
                            createdFrom.atTime(LocalTime.MIN).atZone(ZoneOffset.UTC).toInstant()));
        }
        if (nonNull(createdTo)) {
            filters.add(
                    new Filter(
                            "createdAt",
                            FilterOperator.LTE,
                            createdTo.atTime(LocalTime.MIN).atZone(ZoneOffset.UTC).toInstant()));
        }
        if (!includeClosed) filters.add(new Filter("isCompleted", FilterOperator.EQ, false));

        QueryDTO queryDTO = new QueryDTO();
        GroupFilter filter = new GroupFilter();
        filter.setLogicalOperator(LogicalOperator.AND);
        filter.setFilters(filters);
        queryDTO.setGroups(List.of(filter));
        return createSpecification(queryDTO);
    }

    @Cacheable(value = "ticketThroughputReports", key = "#query")
    @Transactional(readOnly = true)
    public TicketThroughputReportDTO getThroughputReport(TicketThroughputQueryDTO query) {
        TicketThroughputQueryDTO normalizedQuery = normalizeThroughputQuery(query);
        List<Ticket> completedTickets =
                ticketRepository.findAll(getTicketsForThroughputReport(normalizedQuery));

        List<Ticket> filteredTickets =
                completedTickets.stream()
                        .filter(ticket -> isInsideCompletionRange(ticket, normalizedQuery))
                        .filter(ticket -> matchesPriority(ticket, normalizedQuery.getPriority()))
                        .toList();

        Map<String, Long> trendByPeriod =
                filteredTickets.stream()
                        .collect(
                                Collectors.groupingBy(
                                        ticket -> resolvePeriod(ticket, normalizedQuery),
                                        TreeMap::new,
                                        Collectors.counting()));

        Map<String, Long> tableCounts =
                filteredTickets.stream()
                        .collect(
                                Collectors.groupingBy(
                                        ticket ->
                                                resolvePeriod(ticket, normalizedQuery)
                                                        + "\u0000"
                                                        + resolveGroup(ticket, normalizedQuery),
                                        TreeMap::new,
                                        Collectors.counting()));

        List<TicketThroughputTableRowDTO> tableRows =
                tableCounts.entrySet().stream()
                        .map(this::toThroughputTableRow)
                        .toList();

        TicketThroughputReportDTO report = new TicketThroughputReportDTO();
        report.setTotalTicketsCompleted(filteredTickets.size());
        report.setAverageWeeklyThroughput(calculateAverageWeeklyThroughput(filteredTickets));
        report.setPeakWeekThroughput(calculatePeakWeekThroughput(filteredTickets));
        report.setCurrentIterationThroughput(calculateCurrentIterationThroughput(filteredTickets));
        report.setTrend(
                trendByPeriod.entrySet().stream()
                        .map(
                                entry ->
                                        new TicketThroughputBucketDTO(
                                                entry.getKey(), entry.getValue()))
                        .toList());
        report.setTotalTableRows(tableRows.size());
        report.setTable(
                paginate(tableRows, normalizedQuery.getOffset(), normalizedQuery.getLimit()));
        return report;
    }

    @Transactional(readOnly = true)
    public String exportThroughputReportCsv(TicketThroughputQueryDTO query) {
        TicketThroughputReportDTO report = getThroughputReport(query);
        StringBuilder csv = new StringBuilder("period,group,count\n");
        report.getTable()
                .forEach(
                        row ->
                                csv.append(escapeCsv(row.getPeriod()))
                                        .append(',')
                                        .append(escapeCsv(row.getGroup()))
                                        .append(',')
                                        .append(row.getCount())
                                        .append('\n'));
        return csv.toString();
    }

    private TicketThroughputQueryDTO normalizeThroughputQuery(TicketThroughputQueryDTO query) {
        if (query.getFrom() == null) {
            query.setFrom(Instant.now().minus(90, ChronoUnit.DAYS));
        }
        if (query.getTo() == null) {
            query.setTo(Instant.now());
        }
        if (query.getGranularity() == null) {
            query.setGranularity(TicketThroughputGranularity.week);
        }
        if (query.getGroupBy() == null) {
            query.setGroupBy(TicketThroughputGroupBy.none);
        }
        if (query.getStatus() == null || query.getStatus().isEmpty()) {
            query.setStatus(DEFAULT_COMPLETED_STATUS_ALIASES);
        }
        return query;
    }

    private Specification<Ticket> getTicketsForThroughputReport(TicketThroughputQueryDTO query) {
        List<Filter> filters = new ArrayList<>();
        filters.add(new Filter("project.id", FilterOperator.EQ, query.getProjectId()));
        filters.add(new Filter("isDeleted", FilterOperator.EQ, false));
        filters.add(new Filter("isCompleted", FilterOperator.EQ, true));

        if (query.getIterationId() != null) {
            filters.add(new Filter("iteration.id", FilterOperator.EQ, query.getIterationId()));
        }
        if (query.getAssigneeId() != null && !query.getAssigneeId().isEmpty()) {
            filters.add(new Filter("assignUser.id", FilterOperator.IN, query.getAssigneeId()));
        }
        if (shouldFilterCurrentState(query.getStatus())) {
            filters.add(new Filter("currentState.stateName", FilterOperator.IN, query.getStatus()));
        }
        // The current ticket data model has no label/tag relationship yet. Keep label accepted in
        // the request DTO for API compatibility, but do not apply it until labels are modeled.

        QueryDTO queryDTO = new QueryDTO();
        GroupFilter filter = new GroupFilter();
        filter.setLogicalOperator(LogicalOperator.AND);
        filter.setFilters(filters);
        queryDTO.setGroups(List.of(filter));
        return createSpecification(queryDTO);
    }

    private boolean shouldFilterCurrentState(List<String> status) {
        return status != null
                && !status.isEmpty()
                && !new HashSet<>(DEFAULT_COMPLETED_STATUS_ALIASES).containsAll(status);
    }

    private boolean isInsideCompletionRange(Ticket ticket, TicketThroughputQueryDTO query) {
        if (ticket.getActualCompletionDate() == null) {
            return false;
        }
        LocalDate completionDate = ticket.getActualCompletionDate();
        LocalDate from = LocalDate.ofInstant(query.getFrom(), ZoneOffset.UTC);
        LocalDate to = LocalDate.ofInstant(query.getTo(), ZoneOffset.UTC);
        return !completionDate.isBefore(from) && !completionDate.isAfter(to);
    }

    private boolean matchesPriority(Ticket ticket, List<String> priority) {
        if (priority == null || priority.isEmpty()) {
            return true;
        }
        Set<String> normalizedPriorities =
                priority.stream().map(String::toLowerCase).collect(Collectors.toSet());
        return ticket.getPriority() != null
                && normalizedPriorities.contains(ticket.getPriority().name().toLowerCase());
    }

    private String resolvePeriod(Ticket ticket, TicketThroughputQueryDTO query) {
        return switch (query.getGranularity()) {
            case iteration -> resolveIterationPeriod(ticket);
            case month -> YearMonth.from(ticket.getActualCompletionDate()).toString();
            case week -> resolveWeekPeriod(ticket.getActualCompletionDate());
        };
    }

    private String resolveIterationPeriod(Ticket ticket) {
        if (ticket.getIteration() == null) {
            return "No iteration";
        }
        return ticket.getIteration().getName();
    }

    private String resolveWeekPeriod(LocalDate date) {
        WeekFields weekFields = WeekFields.ISO;
        int week = date.get(weekFields.weekOfWeekBasedYear());
        int year = date.get(weekFields.weekBasedYear());
        return String.format("%d-W%02d", year, week);
    }

    private String resolveGroup(Ticket ticket, TicketThroughputQueryDTO query) {
        return switch (query.getGroupBy()) {
            case assignee -> resolveAssigneeGroup(ticket);
            case priority ->
                    Optional.ofNullable(ticket.getPriority()).map(TicketPriority::name).orElse("None");
            case none -> "All";
        };
    }

    private String resolveAssigneeGroup(Ticket ticket) {
        if (ticket.getAssignUser() == null) {
            return "Unassigned";
        }
        return (ticket.getAssignUser().getFirstName() + " " + ticket.getAssignUser().getLastName())
                .trim();
    }

    private TicketThroughputTableRowDTO toThroughputTableRow(Map.Entry<String, Long> entry) {
        String[] parts = entry.getKey().split("\u0000", 2);
        return new TicketThroughputTableRowDTO(parts[0], parts[1], entry.getValue());
    }

    private double calculateAverageWeeklyThroughput(List<Ticket> tickets) {
        if (tickets.isEmpty()) {
            return 0;
        }
        Map<String, Long> weeklyCounts = groupByCompletedWeek(tickets);
        return weeklyCounts.values().stream().mapToLong(Long::longValue).average().orElse(0);
    }

    private long calculatePeakWeekThroughput(List<Ticket> tickets) {
        return groupByCompletedWeek(tickets).values().stream()
                .mapToLong(Long::longValue)
                .max()
                .orElse(0);
    }

    private long calculateCurrentIterationThroughput(List<Ticket> tickets) {
        Instant now = Instant.now();
        return tickets.stream()
                .filter(ticket -> ticket.getIteration() != null)
                .filter(
                        ticket ->
                                !ticket.getIteration().getStartDate().isAfter(now)
                                        && !ticket.getIteration().getEndDate().isBefore(now))
                .count();
    }

    private Map<String, Long> groupByCompletedWeek(List<Ticket> tickets) {
        return tickets.stream()
                .filter(ticket -> ticket.getActualCompletionDate() != null)
                .collect(
                        Collectors.groupingBy(
                                ticket -> resolveWeekPeriod(ticket.getActualCompletionDate()),
                                Collectors.counting()));
    }

    private List<TicketThroughputTableRowDTO> paginate(
            List<TicketThroughputTableRowDTO> rows, int offset, int limit) {
        if (offset >= rows.size()) {
            return List.of();
        }
        int toIndex = Math.min(offset + limit, rows.size());
        return rows.subList(offset, toIndex);
    }

    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
