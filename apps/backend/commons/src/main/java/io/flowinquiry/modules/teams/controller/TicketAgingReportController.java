package io.flowinquiry.modules.teams.controller;

import io.flowinquiry.modules.teams.service.TicketAgingReportService;
import io.flowinquiry.modules.teams.service.dto.TicketAgingReportDTO;
import io.flowinquiry.modules.teams.service.dto.TicketQueryParams;
import io.flowinquiry.query.AggregationQuery;
import io.flowinquiry.query.AggregationResult;
import io.flowinquiry.query.ReportEngine;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "Reports Management", description = "API endpoints for fetching reports")
public class TicketAgingReportController {

    private final TicketAgingReportService service;
    private final ReportEngine reportEngine;

    @Operation(
            summary = "Get ticket ageing reports by project ID",
            description = "Retrieves report of ageing tickets for a specific project")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved tickets' ageing report",
                        content = @Content(mediaType = "application/json")),
            })
    @GetMapping("/tickets/ageing")
    public TicketAgingReportDTO getAgeingTickets(@ModelAttribute TicketQueryParams queryParams) {
        return service.getAgingTicketsReport(queryParams);
    }

    @Operation(
            summary = "Generic aggregation report",
            description =
                    "Executes a GROUP BY + aggregation query described by an AggregationQuery "
                            + "without requiring a dedicated endpoint per report. "
                            + "Supports COUNT, SUM, AVG, MIN, MAX over any JPA entity field, "
                            + "with optional WHERE filters (reuses QueryDTO) and post-aggregation sort.")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Aggregation results, one entry per group",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema =
                                                @Schema(implementation = AggregationResult.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Invalid query",
                        content = @Content)
            })
    @PostMapping("/aggregate")
    public List<AggregationResult> aggregate(@Valid @RequestBody AggregationQuery query) {
        return reportEngine.aggregate(query);
    }
}
