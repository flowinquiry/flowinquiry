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
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(
        name = "Ticket Management",
        description = "API endpoints for managing tickets and ticket-related operations")
public class TicketController {

    private final TicketService ticketService;
    private final WorkflowTransitionHistoryService workflowTransitionHistoryService;

    public TicketController(
            TicketService ticketService,
            WorkflowTransitionHistoryService workflowTransitionHistoryService) {
        this.ticketService = ticketService;
        this.workflowTransitionHistoryService = workflowTransitionHistoryService;
    }

    @Operation(
            summary = "Search tickets",
            description = "Search for tickets based on query criteria with pagination")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved tickets",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = Page.class))),
                @ApiResponse(responseCode = "400", description = "Bad request", content = @Content)
            })
    @PostMapping("/search")
    public Page<TicketDTO> findTickets(
            @Parameter(description = "Query parameters for filtering tickets") @Valid @RequestBody
                    QueryDTO queryDTO,
            @Parameter(description = "Pagination information") Pageable pageable) {
        return ticketService.findTickets(queryDTO, pageable);
    }

    @Operation(summary = "Get ticket by ID", description = "Retrieves a ticket by its ID")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved ticket",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = TicketDTO.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Ticket not found",
                        content = @Content)
            })
    @GetMapping("/{id}")
    public TicketDTO getTicketById(
            @Parameter(description = "ID of the ticket to retrieve", required = true)
                    @PathVariable("id")
                    Long id) {
        return ticketService.getTicketById(id);
    }

    @Operation(
            summary = "Create a new ticket",
            description = "Creates a new ticket with the provided information")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "201",
                        description = "Ticket successfully created",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = TicketDTO.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Bad request - invalid input",
                        content = @Content)
            })
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TicketDTO createTicket(
            @Parameter(description = "Ticket data to create", required = true) @Valid @RequestBody
                    TicketDTO ticketDTO) {
        return ticketService.createTicket(ticketDTO);
    }

    @Operation(
            summary = "Update an existing ticket",
            description = "Updates an existing ticket with the provided information")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Ticket successfully updated",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = TicketDTO.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Bad request - invalid input or ID mismatch",
                        content = @Content),
                @ApiResponse(
                        responseCode = "404",
                        description = "Ticket not found",
                        content = @Content)
            })
    @PutMapping("/{id}")
    public TicketDTO updateTicket(
            @Parameter(description = "ID of the ticket to update", required = true)
                    @PathVariable("id")
                    Long id,
            @Parameter(description = "Updated ticket data", required = true) @RequestBody
                    TicketDTO ticketDTO) {
        if (!id.equals(ticketDTO.getId())) {
            throw new IllegalArgumentException("Id in URL and payload do not match");
        }
        return ticketService.updateTicket(ticketDTO);
    }

    @Operation(summary = "Delete a ticket", description = "Deletes a ticket by its ID")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "204", description = "Ticket successfully deleted"),
                @ApiResponse(
                        responseCode = "404",
                        description = "Ticket not found",
                        content = @Content)
            })
    @DeleteMapping("/{id}")
    public void deleteTicket(
            @Parameter(description = "ID of the ticket to delete", required = true)
                    @PathVariable("id")
                    Long id) {
        ticketService.deleteTicket(id);
    }

    @Operation(
            summary = "Get next ticket",
            description = "Retrieves the next ticket in sequence after the current ticket")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved next ticket",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = TicketDTO.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Next ticket not found",
                        content = @Content)
            })
    @GetMapping("/{currentId}/next")
    public ResponseEntity<TicketDTO> getNextEntity(
            @Parameter(description = "ID of the current ticket", required = true)
                    @PathVariable("currentId")
                    Long currentId,
            @Parameter(description = "Optional project ID filter")
                    @RequestParam(value = "projectId", required = false)
                    Long projectId) {
        return ticketService
                .getNextTicket(currentId, projectId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(
            summary = "Get previous ticket",
            description = "Retrieves the previous ticket in sequence before the current ticket")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved previous ticket",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = TicketDTO.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Previous ticket not found",
                        content = @Content)
            })
    @GetMapping("/{currentId}/previous")
    public ResponseEntity<TicketDTO> getPreviousEntity(
            @Parameter(description = "ID of the current ticket", required = true)
                    @PathVariable("currentId")
                    Long currentId,
            @Parameter(description = "Optional project ID filter")
                    @RequestParam(value = "projectId", required = false)
                    Long projectId) {
        return ticketService
                .getPreviousTicket(currentId, projectId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(
            summary = "Get ticket distribution for a team",
            description =
                    "Retrieves the distribution of tickets for a specific team within a date range")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved ticket distribution",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                TicketDistributionDTO.class)))
            })
    @GetMapping("/teams/{teamId}/ticket-distribution")
    public List<TicketDistributionDTO> getTicketDistribution(
            @Parameter(description = "ID of the team", required = true) @PathVariable("teamId")
                    Long teamId,
            @Parameter(description = "Start date for the distribution calculation")
                    @RequestParam(value = "fromDate", required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    Instant fromDate,
            @Parameter(description = "End date for the distribution calculation")
                    @RequestParam(value = "toDate", required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    Instant toDate,
            @Parameter(description = "Predefined date range (alternative to fromDate/toDate)")
                    @RequestParam(value = "range", required = false)
                    String range) {

        DateRange dateRange = processDateRange(fromDate, toDate, range);
        return ticketService.getTicketDistribution(teamId, dateRange.from, dateRange.to);
    }

    @Operation(
            summary = "Get unassigned tickets for a team",
            description = "Retrieves all unassigned tickets for a specific team with pagination")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved unassigned tickets",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = Page.class)))
            })
    @GetMapping("/teams/{teamId}/unassigned-tickets")
    public Page<TicketDTO> getUnassignedTickets(
            @Parameter(description = "ID of the team", required = true) @PathVariable("teamId")
                    Long teamId,
            @Parameter(description = "Pagination information") Pageable pageable) {
        return ticketService.getUnassignedTickets(teamId, pageable);
    }

    @Operation(
            summary = "Get priority distribution for a team",
            description =
                    "Retrieves the distribution of tickets by priority for a specific team within a date range")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved priority distribution",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                PriorityDistributionDTO.class)))
            })
    @GetMapping("/teams/{teamId}/priority-distribution")
    public List<PriorityDistributionDTO> getPriorityDistribution(
            @Parameter(description = "ID of the team", required = true) @PathVariable("teamId")
                    Long teamId,
            @Parameter(description = "Start date for the distribution calculation")
                    @RequestParam(value = "fromDate", required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    Instant fromDate,
            @Parameter(description = "End date for the distribution calculation")
                    @RequestParam(value = "toDate", required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    Instant toDate,
            @Parameter(description = "Predefined date range (alternative to fromDate/toDate)")
                    @RequestParam(value = "range", required = false)
                    String range) {

        DateRange dateRange = processDateRange(fromDate, toDate, range);
        return ticketService.getPriorityDistribution(teamId, dateRange.from, dateRange.to);
    }

    @Operation(
            summary = "Get ticket state change history",
            description = "Fetches the workflow transition history for a specific ticket")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved ticket state history",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                TransitionItemCollectionDTO
                                                                        .class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Ticket not found",
                        content = @Content)
            })
    @GetMapping("/{ticketId}/states-history")
    public ResponseEntity<TransitionItemCollectionDTO> getTicketStateChangesHistory(
            @Parameter(description = "ID of the ticket", required = true) @PathVariable("ticketId")
                    Long ticketId) {
        TransitionItemCollectionDTO ticketHistory =
                workflowTransitionHistoryService.getTransitionHistoryByTicketId(ticketId);
        return ResponseEntity.ok(ticketHistory);
    }

    @Operation(
            summary = "Get ticket statistics for a team",
            description = "Retrieves ticket statistics for a specific team within a date range")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved ticket statistics",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                TicketStatisticsDTO.class)))
            })
    @GetMapping("/teams/{teamId}/statistics")
    public TicketStatisticsDTO getTicketStatisticsByTeamId(
            @Parameter(description = "ID of the team", required = true) @PathVariable("teamId")
                    Long teamId,
            @Parameter(description = "Start date for the statistics calculation")
                    @RequestParam(value = "fromDate", required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    Instant fromDate,
            @Parameter(description = "End date for the statistics calculation")
                    @RequestParam(value = "toDate", required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    Instant toDate,
            @Parameter(description = "Predefined date range (alternative to fromDate/toDate)")
                    @RequestParam(value = "range", required = false)
                    String range) {

        DateRange dateRange = processDateRange(fromDate, toDate, range);
        return ticketService.getTicketStatisticsByTeamId(teamId, dateRange.from, dateRange.to);
    }

    @Operation(
            summary = "Get overdue tickets for a team",
            description = "Retrieves all overdue tickets for a specific team with pagination")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved overdue tickets",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = Page.class)))
            })
    @GetMapping("/teams/{teamId}/overdue-tickets")
    public Page<TicketDTO> getOverdueTicketsByTeam(
            @Parameter(description = "ID of the team", required = true) @PathVariable("teamId")
                    Long teamId,
            @Parameter(description = "Pagination information") Pageable pageable) {
        return ticketService.getOverdueTicketsByTeam(teamId, pageable);
    }

    @Operation(
            summary = "Count overdue tickets for a team",
            description =
                    "Counts the number of overdue tickets for a specific team within a date range")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully counted overdue tickets",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = Long.class)))
            })
    @GetMapping("/teams/{teamId}/overdue-tickets/count")
    public Long countOverdueTickets(
            @Parameter(description = "ID of the team", required = true) @PathVariable("teamId")
                    Long teamId,
            @Parameter(description = "Start date for counting overdue tickets")
                    @RequestParam(value = "fromDate", required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    Instant fromDate,
            @Parameter(description = "End date for counting overdue tickets")
                    @RequestParam(value = "toDate", required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    Instant toDate,
            @Parameter(description = "Predefined date range (alternative to fromDate/toDate)")
                    @RequestParam(value = "range", required = false)
                    String range) {

        DateRange dateRange = processDateRange(fromDate, toDate, range);
        return ticketService.countOverdueTickets(
                teamId, WorkflowTransitionHistoryStatus.COMPLETED, dateRange.from, dateRange.to);
    }

    @Operation(
            summary = "Get ticket creation time series",
            description = "Retrieves a time series of ticket creations by day for a specific team")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved ticket creation time series",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                TicketActionCountByDateDTO.class)))
            })
    @GetMapping("/teams/{teamId}/ticket-creations-day-series")
    public List<TicketActionCountByDateDTO> getTicketCreationDaySeries(
            @Parameter(description = "ID of the team", required = true) @PathVariable("teamId")
                    Long teamId,
            @Parameter(description = "Number of days to include in the time series", example = "7")
                    @RequestParam(value = "days", required = false, defaultValue = "7")
                    int days) {
        return ticketService.getTicketCreationTimeSeries(teamId, days);
    }

    @Operation(
            summary = "Get overdue tickets for a user",
            description =
                    "Retrieves all overdue tickets assigned to a specific user with pagination")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved overdue tickets",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = Page.class)))
            })
    @GetMapping("/users/{userId}/overdue-tickets")
    public Page<TicketDTO> getOverdueTicketsByUser(
            @Parameter(description = "ID of the user", required = true) @PathVariable("userId")
                    Long userId,
            @Parameter(description = "Pagination information") Pageable pageable) {
        return ticketService.getOverdueTicketsByUser(userId, pageable);
    }

    @Operation(
            summary = "Get team ticket priority distribution for a user",
            description =
                    "Retrieves the distribution of tickets by priority across teams for a specific user within a date range")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved team ticket priority distribution",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                TeamTicketPriorityDistributionDTO
                                                                        .class)))
            })
    @GetMapping("/users/{userId}/team-tickets-priority-distribution")
    public List<TeamTicketPriorityDistributionDTO> getTeamTicketPriorityDistributionForUser(
            @Parameter(description = "ID of the user", required = true) @PathVariable("userId")
                    Long userId,
            @Parameter(description = "Start date for the distribution calculation")
                    @RequestParam(value = "from", required = false)
                    Instant fromDate,
            @Parameter(description = "End date for the distribution calculation")
                    @RequestParam(value = "to", required = false)
                    Instant toDate,
            @Parameter(description = "Predefined date range (alternative to fromDate/toDate)")
                    @RequestParam(value = "range", required = false)
                    String range) {

        DateRange dateRange = processDateRange(fromDate, toDate, range);
        return ticketService.getPriorityDistributionForUser(userId, dateRange.from, dateRange.to);
    }

    @Operation(
            summary = "Update ticket state",
            description = "Updates the state of a ticket to a new state")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Ticket state successfully updated",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = TicketDTO.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Bad request - missing newStateId",
                        content = @Content),
                @ApiResponse(
                        responseCode = "404",
                        description = "Ticket not found",
                        content = @Content)
            })
    @PatchMapping("/{ticketId}/state")
    public TicketDTO updateTicketState(
            @Parameter(description = "ID of the ticket to update", required = true)
                    @PathVariable("ticketId")
                    Long ticketId,
            @Parameter(
                            description = "Request body containing the new state ID",
                            required = true,
                            schema = @Schema(example = "{\"newStateId\": 123}"))
                    @RequestBody
                    Map<String, Long> requestBody) {

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
