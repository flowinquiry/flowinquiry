package io.flowinquiry.modules.teams.service;

import io.flowinquiry.modules.teams.domain.Ticket;
import io.flowinquiry.modules.teams.repository.TicketRepository;
import io.flowinquiry.modules.teams.service.dto.TicketAgingDTO;
import io.flowinquiry.modules.teams.service.dto.TicketAgingReportDTO;
import io.flowinquiry.modules.teams.service.dto.TicketQueryParams;
import io.flowinquiry.modules.teams.service.mapper.TicketMapper;
import io.flowinquiry.query.*;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketAgingReportService {

    private final TicketRepository ticketRepository;

    private final TicketMapper ticketMapper;

    @Transactional(readOnly = true)
    public TicketAgingReportDTO getTicketAgingReport(TicketQueryParams params) {
        QueryDTO queryDTO = buildQueryDTO(params);

        Specification<Ticket> spec = QueryUtils.createSpecification(queryDTO);

        List<Ticket> tickets = ticketRepository.findAll(spec);

        List<TicketAgingDTO> agingTickets =
                tickets.stream()
                        .map(this::calculateTicketAge)
                        .sorted(Comparator.comparingLong(TicketAgingDTO::getAgeInDays).reversed())
                        .toList();

        Map<String, List<TicketAgingDTO>> groupedTickets =
                groupTickets(agingTickets, params.getGroupBy());

        // Calculate statistics
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

    private QueryDTO buildQueryDTO(TicketQueryParams params) {
        QueryDTO queryDTO = new QueryDTO();
        List<Filter> filters = new ArrayList<>();

        filters.add(
                new Filter("project.id", FilterOperator.EQ, Long.parseLong(params.getProjectId())));

        // Optional: iterationId
        if (params.getIterationId() != null) {
            filters.add(
                    new Filter(
                            "iteration.id",
                            FilterOperator.EQ,
                            Long.parseLong(params.getIterationId())));
        }

        // Optional: status
        if (params.getStatus() != null && !params.getStatus().isEmpty()) {
            filters.add(new Filter("currentState.name", FilterOperator.IN, params.getStatus()));
        }

        // Optional: priority
        if (params.getPriority() != null && !params.getPriority().isEmpty()) {
            filters.add(new Filter("priority", FilterOperator.IN, params.getPriority()));
        }

        // Optional: assignUserId
        if (params.getAssignUserId() != null && !params.getAssignUserId().isEmpty()) {
            List<Long> assignUserIds =
                    params.getAssignUserId().stream().map(Long::parseLong).toList();
            filters.add(new Filter("assignUser.id", FilterOperator.IN, assignUserIds));
        }

        // Optional: createdFrom
        if (params.getCreatedFrom() != null) {
            Instant from = params.getCreatedFrom().atStartOfDay().toInstant(ZoneOffset.UTC);
            filters.add(new Filter("createdDate", FilterOperator.GTE, from.toString()));
        }

        // Optional: createdTo
        if (params.getCreatedTo() != null) {
            Instant to = params.getCreatedTo().plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
            filters.add(new Filter("createdDate", FilterOperator.LT, to.toString()));
        }

        // Exclude closed tickets if needed
        if (!params.isIncludeClosed()) {
            filters.add(new Filter("isCompleted", FilterOperator.EQ, false));
        }

        queryDTO.setFilters(filters);
        return queryDTO;
    }

    private TicketAgingDTO calculateTicketAge(Ticket ticket) {
        TicketAgingDTO dto = new TicketAgingDTO();
        dto.setTicketId(ticket.getId());
        dto.setTicketKey(
                ticket.getProjectTicketNumber() != null
                        ? ticket.getProject().getShortName() + "-" + ticket.getProjectTicketNumber()
                        : "TICKET-" + ticket.getId());
        dto.setTitle(ticket.getRequestTitle());
        dto.setPriority(ticket.getPriority());
        dto.setStatus(ticket.getCurrentState().getStateName());
        dto.setAssignee(
                ticket.getAssignUser() != null
                        ? ticket.getAssignUser().getFirstName()
                                + " "
                                + ticket.getAssignUser().getLastName()
                        : "Unassigned");

        // Calculate age in days
        long ageInDays = ChronoUnit.DAYS.between(ticket.getCreatedAt(), Instant.now());
        dto.setAgeInDays(ageInDays);
        dto.setCreatedDate(ticket.getCreatedAt());

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
}
