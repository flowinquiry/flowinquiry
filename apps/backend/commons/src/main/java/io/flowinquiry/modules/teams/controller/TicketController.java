package io.flowinquiry.modules.teams.controller;

import io.flowinquiry.modules.teams.domain.WorkflowTransitionHistoryStatus;
import io.flowinquiry.modules.teams.service.TicketService;
import io.flowinquiry.modules.teams.service.WorkflowTransitionHistoryService;
import io.flowinquiry.modules.teams.service.dto.PriorityDistributionDTO;
import io.flowinquiry.modules.teams.service.dto.TeamTicketPriorityDistributionDTO;
import io.flowinquiry.modules.teams.service.dto.TicketActionCountByDateDTO;
import io.flowinquiry.modules.teams.service.dto.TicketDTO;
import io.flowinquiry.modules.teams.service.dto.TicketDistributionDTO;
import io.flowinquiry.modules.teams.service.dto.TransitionItemCollectionDTO;
import io.flowinquiry.modules.usermanagement.service.dto.TicketStatisticsDTO;
import io.flowinquiry.query.QueryDTO;
import io.flowinquiry.utils.DateUtils;
import jakarta.validation.Valid;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final WorkflowTransitionHistoryService workflowTransitionHistoryService;

    public TicketController(
            TicketService ticketService,
            WorkflowTransitionHistoryService workflowTransitionHistoryService) {
        this.ticketService = ticketService;
        this.workflowTransitionHistoryService = workflowTransitionHistoryService;
    }

    @PostMapping("/search")
    public Page<TicketDTO> findTickets(@Valid @RequestBody QueryDTO queryDTO, Pageable pageable) {
        return ticketService.findTickets(queryDTO, pageable);
    }

    @GetMapping("/{id}")
    public TicketDTO getTicketById(@PathVariable("id") Long id) {
        return ticketService.getTicketById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TicketDTO createTicket(@Valid @RequestBody TicketDTO ticketDTO) {
        return ticketService.createTicket(ticketDTO);
    }

    @PutMapping("/{id}")
    public TicketDTO updateTicket(@PathVariable("id") Long id, @RequestBody TicketDTO ticketDTO) {
        if (!id.equals(ticketDTO.getId())) {
            throw new IllegalArgumentException("Id in URL and payload do not match");
        }
        return ticketService.updateTicket(ticketDTO);
    }

    @DeleteMapping("/{id}")
    public void deleteTicket(@PathVariable("id") Long id) {
        ticketService.deleteTicket(id);
    }

    @GetMapping("/{currentId}/next")
    public ResponseEntity<TicketDTO> getNextEntity(
            @PathVariable("currentId") Long currentId,
            @RequestParam(value = "projectId", required = false) Long projectId) {
        return ticketService
                .getNextTicket(currentId, projectId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{currentId}/previous")
    public ResponseEntity<TicketDTO> getPreviousEntity(
            @PathVariable("currentId") Long currentId,
            @RequestParam(value = "projectId", required = false) Long projectId) {
        return ticketService
                .getPreviousTicket(currentId, projectId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/teams/{teamId}/ticket-distribution")
    public List<TicketDistributionDTO> getTicketDistribution(
            @PathVariable("teamId") Long teamId,
            @RequestParam(value = "fromDate", required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    Instant fromDate,
            @RequestParam(value = "toDate", required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    Instant toDate,
            @RequestParam(value = "range", required = false) String range) {

        DateRange dateRange = processDateRange(fromDate, toDate, range);
        return ticketService.getTicketDistribution(teamId, dateRange.from, dateRange.to);
    }

    // Endpoint to get unassigned tickets for a specific team
    @GetMapping("/teams/{teamId}/unassigned-tickets")
    public Page<TicketDTO> getUnassignedTickets(
            @PathVariable("teamId") Long teamId, Pageable pageable) {
        return ticketService.getUnassignedTickets(teamId, pageable);
    }

    // Endpoint to get priority distribution for a specific team
    @GetMapping("/teams/{teamId}/priority-distribution")
    public List<PriorityDistributionDTO> getPriorityDistribution(
            @PathVariable("teamId") Long teamId,
            @RequestParam(value = "fromDate", required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    Instant fromDate,
            @RequestParam(value = "toDate", required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    Instant toDate,
            @RequestParam(value = "range", required = false) String range) {

        DateRange dateRange = processDateRange(fromDate, toDate, range);
        return ticketService.getPriorityDistribution(teamId, dateRange.from, dateRange.to);
    }

    /**
     * Fetch the workflow transition history for a specific ticket/request.
     *
     * @param ticketId the ID of the ticket
     * @return a TicketHistoryDto containing workflow details and transitions
     */
    @GetMapping("/{ticketId}/states-history")
    public ResponseEntity<TransitionItemCollectionDTO> getTicketStateChangesHistory(
            @PathVariable("ticketId") Long ticketId) {
        TransitionItemCollectionDTO ticketHistory =
                workflowTransitionHistoryService.getTransitionHistoryByTicketId(ticketId);
        return ResponseEntity.ok(ticketHistory);
    }

    @GetMapping("/teams/{teamId}/statistics")
    public TicketStatisticsDTO getTicketStatisticsByTeamId(
            @PathVariable("teamId") Long teamId,
            @RequestParam(value = "fromDate", required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    Instant fromDate,
            @RequestParam(value = "toDate", required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    Instant toDate,
            @RequestParam(value = "range", required = false) String range) {

        DateRange dateRange = processDateRange(fromDate, toDate, range);
        return ticketService.getTicketStatisticsByTeamId(teamId, dateRange.from, dateRange.to);
    }

    @GetMapping("/teams/{teamId}/overdue-tickets")
    public Page<TicketDTO> getOverdueTicketsByTeam(
            @PathVariable("teamId") Long teamId, Pageable pageable) {
        return ticketService.getOverdueTicketsByTeam(teamId, pageable);
    }

    @GetMapping("/teams/{teamId}/overdue-tickets/count")
    public Long countOverdueTickets(
            @PathVariable("teamId") Long teamId,
            @RequestParam(value = "fromDate", required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    Instant fromDate,
            @RequestParam(value = "toDate", required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    Instant toDate,
            @RequestParam(value = "range", required = false) String range) {

        DateRange dateRange = processDateRange(fromDate, toDate, range);
        return ticketService.countOverdueTickets(
                teamId, WorkflowTransitionHistoryStatus.COMPLETED, dateRange.from, dateRange.to);
    }

    @GetMapping("/teams/{teamId}/ticket-creations-day-series")
    public List<TicketActionCountByDateDTO> getTicketCreationDaySeries(
            @PathVariable("teamId") Long teamId,
            @RequestParam(value = "days", required = false, defaultValue = "7") int days) {
        return ticketService.getTicketCreationTimeSeries(teamId, days);
    }

    @GetMapping("/users/{userId}/overdue-tickets")
    public Page<TicketDTO> getOverdueTicketsByUser(
            @PathVariable("userId") Long userId, Pageable pageable) {
        return ticketService.getOverdueTicketsByUser(userId, pageable);
    }

    @GetMapping("/users/{userId}/team-tickets-priority-distribution")
    public List<TeamTicketPriorityDistributionDTO> getTeamTicketPriorityDistributionForUser(
            @PathVariable("userId") Long userId,
            @RequestParam(value = "from", required = false) Instant fromDate,
            @RequestParam(value = "to", required = false) Instant toDate,
            @RequestParam(value = "range", required = false) String range) {

        DateRange dateRange = processDateRange(fromDate, toDate, range);
        return ticketService.getPriorityDistributionForUser(userId, dateRange.from, dateRange.to);
    }

    @PatchMapping("/{ticketId}/state")
    public TicketDTO updateTicketState(
            @PathVariable("ticketId") Long ticketId, @RequestBody Map<String, Long> requestBody) {

        Long newStateId = requestBody.get("newStateId");
        if (newStateId == null) {
            throw new IllegalArgumentException("newStateId is required");
        }

        return ticketService.updateTicketState(ticketId, newStateId);
    }

    /** Helper class to represent a date range */
    private record DateRange(Instant from, Instant to) {}

    /**
     * Process date range parameters consistently across endpoints
     *
     * @param fromDate The start date
     * @param toDate The end date
     * @param range The date range string
     * @return Processed date range with adjusted from and to dates
     */
    private DateRange processDateRange(Instant fromDate, Instant toDate, String range) {
        if (range != null && fromDate == null && toDate == null) {
            fromDate = DateUtils.parseDateRange(range);
            toDate = Instant.now().plus(Duration.ofDays(1));
        }

        Instant adjustedFromDate = DateUtils.truncateToMidnight(fromDate);
        Instant adjustedToDate = DateUtils.truncateToMidnight(toDate);

        return new DateRange(adjustedFromDate, adjustedToDate);
    }
}
