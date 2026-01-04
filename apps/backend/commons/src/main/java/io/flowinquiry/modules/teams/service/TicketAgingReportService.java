package io.flowinquiry.modules.teams.service;

import static io.flowinquiry.modules.teams.repository.specifications.TicketSpecification.buildThroughputReportSpecification;
import static io.flowinquiry.modules.teams.utils.PeriodHelper.findPeriodForTicket;
import static io.flowinquiry.modules.teams.utils.PeriodHelper.generatePeriodsBaseOnGranularity;
import static io.flowinquiry.query.QueryUtils.createSpecification;
import static java.util.Objects.nonNull;

import io.flowinquiry.modules.teams.domain.Ticket;
import io.flowinquiry.modules.teams.domain.Ticket_;
import io.flowinquiry.modules.teams.repository.TicketRepository;
import io.flowinquiry.modules.teams.service.dto.TicketAgingDTO;
import io.flowinquiry.modules.teams.service.dto.TicketAgingReportDTO;
import io.flowinquiry.modules.teams.service.dto.TicketQueryParams;
import io.flowinquiry.modules.teams.service.dto.report.Period;
import io.flowinquiry.modules.teams.service.dto.report.ThroughputDTO;
import io.flowinquiry.modules.teams.service.dto.report.ThroughputReportDTO;
import io.flowinquiry.modules.teams.service.dto.report.TicketThroughputQueryParams;
import io.flowinquiry.modules.teams.service.mapper.TicketMapper;
import io.flowinquiry.query.*;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.ScrollPosition;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.support.WindowIterator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketAgingReportService {

    private final TicketRepository ticketRepository;

    private final TicketMapper ticketMapper;

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

    @Transactional(readOnly = true)
    public ThroughputReportDTO getThroughputReport(TicketThroughputQueryParams params) {
        List<Period> periods = generatePeriodsBaseOnGranularity(params.getFrom(), params.getTo(), params.getGranularity());
        Map<Period, ThroughputDTO> throughputPerPeriod = initializeThroughputPerPeriod(periods);

        Specification<Ticket> specification = buildThroughputReportSpecification(params);
        Sort sort = Sort.by(Sort.Direction.ASC, Ticket_.ID);
        WindowIterator<Ticket> tickets = WindowIterator
              .of(position -> ticketRepository.findAllWindowed(specification, sort, params.getLimit(), position))
              .startingAt(ScrollPosition.offset());
        tickets.forEachRemaining(ticket ->
              incrementPeriodThroughput(ticket, periods, throughputPerPeriod)
        );

        return ThroughputReportDTO.builder()
              .fromDate(params.getFrom())
              .toDate(params.getTo())
              .groupBy(params.getGroupBy())
              .granularity(params.getGranularity())
              .data(throughputPerPeriod)
              .build();
    }

    private void incrementPeriodThroughput(
          Ticket ticket, List<Period> periods, Map<Period, ThroughputDTO> throughputPerPeriod) {
        Optional<Period> matchingPeriod = findPeriodForTicket(periods, ticket.getActualCompletionDate());
        matchingPeriod.ifPresent(period -> throughputPerPeriod
              .get(period)
              .incrementThroughput());
    }

    private Map<Period, ThroughputDTO> initializeThroughputPerPeriod(
          List<Period> periods) {
        Map<Period, ThroughputDTO> result = new LinkedHashMap<>();
        for (Period period : periods) {
            ThroughputDTO throughput = ThroughputDTO.builder()
                  .throughput(0)
                  .groupedTickets(new HashMap<>())
                  .build();
            result.put(period, throughput);
        }
        return result;
    }
}
