package io.flowinquiry.modules.teams.service;

import static io.flowinquiry.query.QueryUtils.createSpecification;
import static java.util.Objects.nonNull;

import io.flowinquiry.modules.teams.domain.ProjectIteration;
import io.flowinquiry.modules.teams.domain.BurndownProjectedStatus;
import io.flowinquiry.modules.teams.repository.ProjectIterationRepository;
import io.flowinquiry.modules.teams.service.dto.BurndownQueryParams;
import io.flowinquiry.modules.teams.service.dto.BurndownDayDTO;
import io.flowinquiry.modules.teams.service.dto.BurndownReportDTO;
import io.flowinquiry.modules.teams.domain.Ticket;
import io.flowinquiry.modules.teams.domain.TicketConversationHealth;
import io.flowinquiry.modules.teams.domain.TicketPriority;
import io.flowinquiry.modules.teams.repository.TicketConversationHealthRepository;
import io.flowinquiry.modules.teams.repository.TicketRepository;
import io.flowinquiry.modules.teams.service.dto.TicketAgingDTO;
import io.flowinquiry.modules.teams.service.dto.TicketAgingReportDTO;
import io.flowinquiry.modules.teams.service.dto.TicketHealthDistributionDTO;
import io.flowinquiry.modules.teams.service.dto.TicketHealthLevel;
import io.flowinquiry.modules.teams.service.dto.TicketHealthQueryParams;
import io.flowinquiry.modules.teams.service.dto.TicketQueryParams;
import io.flowinquiry.modules.teams.service.dto.TicketThroughputBucketDTO;
import io.flowinquiry.modules.teams.service.dto.TicketThroughputGranularity;
import io.flowinquiry.modules.teams.service.dto.TicketThroughputGroupBy;
import io.flowinquiry.modules.teams.service.dto.TicketThroughputQueryDTO;
import io.flowinquiry.modules.teams.service.dto.TicketThroughputReportDTO;
import io.flowinquiry.modules.teams.service.dto.WorkloadBalanceMemberDTO;
import io.flowinquiry.modules.teams.service.dto.WorkloadBalanceQueryDTO;
import io.flowinquiry.modules.teams.service.dto.WorkloadBalanceReportDTO;
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

    private final TicketConversationHealthRepository healthRepository;

    private final ProjectIterationRepository projectIterationRepository;

    private static final List<String> DEFAULT_COMPLETED_STATUS_ALIASES =
            List.of("RESOLVED", "CLOSED");

    @Transactional(readOnly = true)
    public TicketHealthDistributionDTO getHealthDistributionReport(TicketHealthQueryParams params) {

        List<TicketConversationHealth> records = healthRepository.findAll(buildHealthSpec(params));

        Map<String, Long> distribution =
                records.stream()
                        .collect(
                                Collectors.groupingBy(
                                        h -> resolveHealthLevel(h).toJson(),
                                        LinkedHashMap::new,
                                        Collectors.counting()));

        long total = records.size();
        long criticalCount = distribution.getOrDefault(TicketHealthLevel.CRITICAL.toJson(), 0L);
        String dominant =
                distribution.entrySet().stream()
                        .max(Map.Entry.comparingByValue())
                        .map(Map.Entry::getKey)
                        .orElse(null);

        return new TicketHealthDistributionDTO(distribution, total, dominant, criticalCount);
    }

    private Specification<TicketConversationHealth> buildHealthSpec(
            TicketHealthQueryParams params) {
        List<Filter> filters = new ArrayList<>();
        filters.add(new Filter("ticket.project.id", FilterOperator.EQ, params.getProjectId()));
        filters.add(new Filter("ticket.isDeleted", FilterOperator.EQ, false));

        if (!params.isIncludeClosed()) {
            filters.add(new Filter("ticket.isCompleted", FilterOperator.EQ, false));
        }
        if (params.getAssignUserId() != null && !params.getAssignUserId().isEmpty()) {
            filters.add(
                    new Filter(
                            "ticket.assignUser.id", FilterOperator.IN, params.getAssignUserId()));
        }
        if (params.getPriority() != null && !params.getPriority().isEmpty()) {
            filters.add(new Filter("ticket.priority", FilterOperator.IN, params.getPriority()));
        }
        if (params.getCreatedFrom() != null) {
            filters.add(
                    new Filter(
                            "ticket.createdAt",
                            FilterOperator.GTE,
                            params.getCreatedFrom()
                                    .atTime(LocalTime.MIN)
                                    .atZone(ZoneOffset.UTC)
                                    .toInstant()));
        }
        if (params.getCreatedTo() != null) {
            filters.add(
                    new Filter(
                            "ticket.createdAt",
                            FilterOperator.LTE,
                            params.getCreatedTo()
                                    .atTime(LocalTime.MAX)
                                    .atZone(ZoneOffset.UTC)
                                    .toInstant()));
        }

        QueryDTO queryDTO = new QueryDTO();
        GroupFilter groupFilter = new GroupFilter();
        groupFilter.setLogicalOperator(LogicalOperator.AND);
        groupFilter.setFilters(filters);
        queryDTO.setGroups(List.of(groupFilter));
        return createSpecification(queryDTO);
    }

    private TicketHealthLevel resolveHealthLevel(TicketConversationHealth h) {
        Float score = h.getConversationHealth();
        if (score == null) return TicketHealthLevel.CRITICAL;
        if (score >= 0.8f) return TicketHealthLevel.EXCELLENT;
        if (score > 0.6f) return TicketHealthLevel.GOOD;
        if (score > 0.4f) return TicketHealthLevel.FAIR;
        if (score > 0.2f) return TicketHealthLevel.POOR;
        return TicketHealthLevel.CRITICAL;
    }

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

        Map<String, Long> trendByPeriod =
                completedTickets.stream()
                        .collect(
                                Collectors.groupingBy(
                                        ticket -> resolvePeriod(ticket, normalizedQuery),
                                        TreeMap::new,
                                        Collectors.counting()));

        Map<String, Map<String, Long>> tableCounts =
                completedTickets.stream()
                        .collect(
                                Collectors.groupingBy(
                                        ticket -> resolvePeriod(ticket, normalizedQuery),
                                        TreeMap::new,
                                        Collectors.groupingBy(
                                                ticket -> resolveGroup(ticket, normalizedQuery),
                                                TreeMap::new,
                                                Collectors.counting())));

        List<TicketThroughputBucketDTO> tableRows = new ArrayList<>();
        tableCounts.forEach(
                (period, groupMap) ->
                        groupMap.forEach(
                                (group, count) ->
                                        tableRows.add(
                                                new TicketThroughputBucketDTO(
                                                        period, group, count))));

        TicketThroughputReportDTO report = new TicketThroughputReportDTO();
        report.setTotalTicketsCompleted(completedTickets.size());
        report.setAverageWeeklyThroughput(calculateAverageWeeklyThroughput(completedTickets));
        report.setPeakWeekThroughput(calculatePeakWeekThroughput(completedTickets));
        report.setCurrentIterationThroughput(calculateCurrentIterationThroughput(completedTickets));
        report.setTrend(
                trendByPeriod.entrySet().stream()
                        .map(
                                entry ->
                                        new TicketThroughputBucketDTO(
                                                entry.getKey(), entry.getValue()))
                        .toList());
        report.setTotalTableRows(tableRows.size());
        report.setTable(tableRows);
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

    // ── Workload Balance ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public WorkloadBalanceReportDTO getWorkloadBalanceReport(WorkloadBalanceQueryDTO query) {
        List<Ticket> tickets = ticketRepository.findAll(buildWorkloadSpec(query));

        // Group all tickets by assignee name
        Map<String, List<Ticket>> byMember =
                tickets.stream().collect(Collectors.groupingBy(this::resolveAssigneeName));

        Instant now = Instant.now();
        List<WorkloadBalanceMemberDTO> members =
                byMember.entrySet().stream()
                        .map(entry -> buildMemberDTO(entry.getKey(), entry.getValue(), now))
                        .sorted(
                                Comparator.comparingLong(WorkloadBalanceMemberDTO::getOpenCount)
                                        .reversed())
                        .toList();

        long totalOpen = members.stream().mapToLong(WorkloadBalanceMemberDTO::getOpenCount).sum();
        double avg =
                members.isEmpty()
                        ? 0
                        : Math.round((double) totalOpen / members.size() * 100.0) / 100.0;
        String top = members.isEmpty() ? null : members.get(0).getUserName();

        WorkloadBalanceReportDTO report = new WorkloadBalanceReportDTO();
        report.setTotalOpenTickets(totalOpen);
        report.setAveragePerMember(avg);
        report.setTopOverloadedMember(top);
        report.setMembers(members);
        return report;
    }

    @Transactional(readOnly = true)
    public String exportWorkloadBalanceCsv(WorkloadBalanceQueryDTO query) {
        WorkloadBalanceReportDTO report = getWorkloadBalanceReport(query);
        StringBuilder csv =
                new StringBuilder(
                        "member,open,closed,overdue,avg_age_days,critical,high,medium,low,trivial\n");
        report.getMembers()
                .forEach(
                        m -> {
                            Map<String, Long> pb = m.getPriorityBreakdown();
                            csv.append(escapeCsv(m.getUserName()))
                                    .append(',')
                                    .append(m.getOpenCount())
                                    .append(',')
                                    .append(m.getClosedCount())
                                    .append(',')
                                    .append(m.getOverdueCount())
                                    .append(',')
                                    .append(String.format("%.1f", m.getAvgAgeInDays()))
                                    .append(',')
                                    .append(pb.getOrDefault("Critical", 0L))
                                    .append(',')
                                    .append(pb.getOrDefault("High", 0L))
                                    .append(',')
                                    .append(pb.getOrDefault("Medium", 0L))
                                    .append(',')
                                    .append(pb.getOrDefault("Low", 0L))
                                    .append(',')
                                    .append(pb.getOrDefault("Trivial", 0L))
                                    .append('\n');
                        });
        return csv.toString();
    }

    private WorkloadBalanceMemberDTO buildMemberDTO(
            String name, List<Ticket> tickets, Instant now) {

        // Separate open vs closed
        List<Ticket> open = tickets.stream().filter(t -> !t.getIsCompleted()).toList();
        long closedCount = tickets.stream().filter(Ticket::getIsCompleted).count();

        // Overdue: open tickets whose estimated completion date is in the past
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        long overdueCount =
                open.stream()
                        .filter(
                                t ->
                                        t.getEstimatedCompletionDate() != null
                                                && t.getEstimatedCompletionDate().isBefore(today))
                        .count();

        // Average age of open tickets (days from createdAt to now)
        double avgAge =
                open.isEmpty()
                        ? 0
                        : open.stream()
                                .mapToLong(t -> ChronoUnit.DAYS.between(t.getCreatedAt(), now))
                                .average()
                                .orElse(0);

        // Priority breakdown for open tickets
        Map<String, Long> priorityBreakdown =
                open.stream()
                        .collect(
                                Collectors.groupingBy(
                                        t ->
                                                t.getPriority() != null
                                                        ? t.getPriority().name()
                                                        : "None",
                                        Collectors.counting()));

        // Derive userId and avatarUrl from the first ticket that has an assignee
        Long userId =
                tickets.stream()
                        .filter(t -> t.getAssignUser() != null)
                        .findFirst()
                        .map(t -> t.getAssignUser().getId())
                        .orElse(null);

        String avatarUrl =
                tickets.stream()
                        .filter(t -> t.getAssignUser() != null)
                        .findFirst()
                        .map(t -> t.getAssignUser().getImageUrl())
                        .orElse(null);

        return WorkloadBalanceMemberDTO.builder()
                .userId(userId)
                .userName(name)
                .avatarUrl(avatarUrl)
                .openCount(open.size())
                .closedCount(closedCount)
                .overdueCount(overdueCount)
                .avgAgeInDays(Math.round(avgAge * 10.0) / 10.0)
                .priorityBreakdown(priorityBreakdown)
                .build();
    }

    private String resolveAssigneeName(Ticket ticket) {
        if (ticket.getAssignUser() == null) return "Unassigned";
        return (ticket.getAssignUser().getFirstName() + " " + ticket.getAssignUser().getLastName())
                .trim();
    }

    private Specification<Ticket> buildWorkloadSpec(WorkloadBalanceQueryDTO query) {
        List<Filter> filters = new ArrayList<>();
        filters.add(new Filter("project.id", FilterOperator.EQ, query.getProjectId()));
        filters.add(new Filter("isDeleted", FilterOperator.EQ, false));

        if (query.getIterationId() != null) {
            filters.add(new Filter("iteration.id", FilterOperator.EQ, query.getIterationId()));
        }
        addInFilterIfNotEmpty(filters, "priority", query.getPriorities());
        addInFilterIfNotEmpty(filters, "assignUser.id", query.getAssigneeId());
        if (query.getStatus() != null && !query.getStatus().isEmpty()) {
            filters.add(new Filter("currentState.stateName", FilterOperator.IN, query.getStatus()));
        }
        if (query.getFrom() != null) {
            filters.add(new Filter("createdAt", FilterOperator.GTE, query.getFrom()));
        }
        if (query.getTo() != null) {
            filters.add(new Filter("createdAt", FilterOperator.LTE, query.getTo()));
        }

        QueryDTO queryDTO = new QueryDTO();
        GroupFilter groupFilter = new GroupFilter();
        groupFilter.setLogicalOperator(LogicalOperator.AND);
        groupFilter.setFilters(filters);
        queryDTO.setGroups(List.of(groupFilter));
        return createSpecification(queryDTO);
    }

    private TicketThroughputQueryDTO normalizeThroughputQuery(TicketThroughputQueryDTO query) {
        if (query.getFrom() == null) {
            query.setFrom(Instant.now().minus(90, ChronoUnit.DAYS));
        }
        if (query.getTo() == null) {
            query.setTo(Instant.now());
        }

        validateDateRange(query.getFrom(), query.getTo());

        if (query.getGranularity() == null) {
            query.setGranularity(TicketThroughputGranularity.week);
        }
        if (query.getGroupBy() == null) {
            query.setGroupBy(TicketThroughputGroupBy.none);
        }
        query.setStatus(getOrDefaultStatus(query.getStatus()));
        return query;
    }

    private void validateDateRange(Instant from, Instant to) {
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("From date cannot be after To date");
        }
        long days = ChronoUnit.DAYS.between(from, to);
        if (days > 90) {
            throw new IllegalArgumentException("The date range must not exceed 90 days");
        }
    }

    private List<String> getOrDefaultStatus(List<String> status) {
        return (status == null || status.isEmpty()) ? DEFAULT_COMPLETED_STATUS_ALIASES : status;
    }

    private Specification<Ticket> getTicketsForThroughputReport(TicketThroughputQueryDTO query) {
        List<Filter> filters = new ArrayList<>();
        filters.add(new Filter("project.id", FilterOperator.EQ, query.getProjectId()));
        filters.add(new Filter("isDeleted", FilterOperator.EQ, false));
        filters.add(new Filter("isCompleted", FilterOperator.EQ, true));

        if (query.getFrom() != null) {
            LocalDate fromDate = LocalDate.ofInstant(query.getFrom(), ZoneOffset.UTC);
            filters.add(new Filter("actualCompletionDate", FilterOperator.GTE, fromDate));
        }
        if (query.getTo() != null) {
            LocalDate toDate = LocalDate.ofInstant(query.getTo(), ZoneOffset.UTC);
            filters.add(new Filter("actualCompletionDate", FilterOperator.LTE, toDate));
        }

        addInFilterIfNotEmpty(filters, "priority", query.getPriorities());

        if (query.getIterationId() != null) {
            filters.add(new Filter("iteration.id", FilterOperator.EQ, query.getIterationId()));
        }

        addInFilterIfNotEmpty(filters, "assignUser.id", query.getAssigneeId());

        if (shouldFilterCurrentState(query.getStatus())) {
            filters.add(new Filter("currentState.stateName", FilterOperator.IN, query.getStatus()));
        }

        QueryDTO queryDTO = new QueryDTO();
        GroupFilter filter = new GroupFilter();
        filter.setLogicalOperator(LogicalOperator.AND);
        filter.setFilters(filters);
        queryDTO.setGroups(List.of(filter));
        return createSpecification(queryDTO);
    }

    private void addInFilterIfNotEmpty(List<Filter> filters, String field, List<?> values) {
        if (values != null && !values.isEmpty()) {
            filters.add(new Filter(field, FilterOperator.IN, values));
        }
    }

    private boolean shouldFilterCurrentState(List<String> status) {
        return status != null
                && !status.isEmpty()
                && !new HashSet<>(DEFAULT_COMPLETED_STATUS_ALIASES).containsAll(status);
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
                    Optional.ofNullable(ticket.getPriority())
                            .map(TicketPriority::name)
                            .orElse("None");
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

    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    @Transactional(readOnly = true)
    public BurndownReportDTO getBurndownReport(BurndownQueryParams params) {
        ProjectIteration iteration = projectIterationRepository.findById(params.getIterationId())
                .orElseThrow(() -> new IllegalArgumentException("Iteration not found"));

        LocalDate start = iteration.getStartDate().atZone(ZoneOffset.UTC).toLocalDate();
        LocalDate end = iteration.getEndDate().atZone(ZoneOffset.UTC).toLocalDate();

        List<Ticket> tickets = ticketRepository.findAll(buildIterationSpec(params.getProjectId(), params.getIterationId()));

        boolean usePoints = "story_points".equalsIgnoreCase(params.getMeasure());

        double plannedWork = 0.0;
        for (Ticket ticket : tickets) {
            plannedWork += getTicketWeight(ticket, usePoints);
        }

        List<BurndownDayDTO> days = new ArrayList<>();
        long totalDays = ChronoUnit.DAYS.between(start, end) + 1;

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate last = today.isBefore(end) ? today : end;
        if (last.isBefore(start)) {
            last = start;
        }

        double remainingWork = plannedWork;
        double completedWork = 0.0;

        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            double completedOnDate = 0.0;
            for (Ticket ticket : tickets) {
                if (ticket.getIsCompleted() != null && ticket.getIsCompleted() && ticket.getActualCompletionDate() != null) {
                    if (ticket.getActualCompletionDate().equals(date)) {
                        completedOnDate += getTicketWeight(ticket, usePoints);
                    }
                }
            }

            long dayIndex = ChronoUnit.DAYS.between(start, date);
            double idealValue = plannedWork - (dayIndex * (plannedWork / (double) (totalDays - 1)));
            if (dayIndex == totalDays - 1) {
                idealValue = 0.0;
            }

            Double remainingValueForDay = null;
            Double completedValueForDay = null;

            if (!date.isAfter(last)) {
                double completedSoFar = 0.0;
                for (Ticket ticket : tickets) {
                    if (ticket.getIsCompleted() != null && ticket.getIsCompleted() && ticket.getActualCompletionDate() != null) {
                        if (!ticket.getActualCompletionDate().isAfter(date)) {
                            completedSoFar += getTicketWeight(ticket, usePoints);
                        }
                    }
                }
                remainingValueForDay = Math.max(0.0, plannedWork - completedSoFar);
                completedValueForDay = completedOnDate;

                if (date.equals(last)) {
                    remainingWork = remainingValueForDay;
                    completedWork = completedSoFar;
                }
            }

            days.add(BurndownDayDTO.builder()
                    .date(date)
                    .remainingValue(remainingValueForDay)
                    .idealValue(idealValue)
                    .completedValue(completedValueForDay)
                    .build());
        }

        BurndownProjectedStatus projectedStatus = BurndownProjectedStatus.ON_TRACK;
        if (plannedWork > 0.0) {
            double idealAtLast = plannedWork - (ChronoUnit.DAYS.between(start, last) * (plannedWork / (double) (totalDays - 1)));
            if (ChronoUnit.DAYS.between(start, last) == totalDays - 1) {
                idealAtLast = 0.0;
            }

            if (remainingWork < idealAtLast) {
                projectedStatus = BurndownProjectedStatus.AHEAD;
            } else if (remainingWork > idealAtLast) {
                projectedStatus = BurndownProjectedStatus.BEHIND;
            }
        }

        return BurndownReportDTO.builder()
                .days(days)
                .plannedWork(plannedWork)
                .completedWork(completedWork)
                .remainingWork(remainingWork)
                .projectedStatus(projectedStatus)
                .build();
    }

    private double getTicketWeight(Ticket ticket, boolean usePoints) {
        if (usePoints) {
            return ticket.getEstimate() != null ? ticket.getEstimate().doubleValue() : 0.0;
        }
        return 1.0;
    }

    private Specification<Ticket> buildIterationSpec(Long projectId, Long iterationId) {
        List<Filter> filters = new ArrayList<>();
        filters.add(new Filter("project.id", FilterOperator.EQ, projectId));
        filters.add(new Filter("iteration.id", FilterOperator.EQ, iterationId));
        filters.add(new Filter("isDeleted", FilterOperator.EQ, false));

        QueryDTO queryDTO = new QueryDTO();
        GroupFilter groupFilter = new GroupFilter();
        groupFilter.setLogicalOperator(LogicalOperator.AND);
        groupFilter.setFilters(filters);
        queryDTO.setGroups(List.of(groupFilter));
        return createSpecification(queryDTO);
    }
}
