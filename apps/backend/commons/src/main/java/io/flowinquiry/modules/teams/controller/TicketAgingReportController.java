package io.flowinquiry.modules.teams.controller;

import io.flowinquiry.modules.teams.service.TicketAgingReportService;
import io.flowinquiry.modules.teams.service.dto.TicketAgingReportDTO;
import io.flowinquiry.modules.teams.service.dto.TicketQueryParams;
import io.flowinquiry.modules.teams.service.dto.TicketThroughputQueryDTO;
import io.flowinquiry.modules.teams.service.dto.TicketThroughputReportDTO;
import io.flowinquiry.modules.teams.service.dto.WorkloadBalanceQueryDTO;
import io.flowinquiry.modules.teams.service.dto.WorkloadBalanceReportDTO;
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
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
            summary = "Get ticket throughput report",
            description =
                    "Retrieves completed ticket throughput grouped by week, month, or iteration "
                            + "for a project. Completion is based on actual completion date.")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved tickets' throughput report",
                        content = @Content(mediaType = "application/json")),
                @ApiResponse(
                        responseCode = "400",
                        description = "Invalid query",
                        content = @Content)
            })
    @GetMapping("/tickets/throughput")
    public TicketThroughputReportDTO getTicketThroughput(
            @Valid @ModelAttribute TicketThroughputQueryDTO query) {
        return service.getThroughputReport(query);
    }

    @Operation(
            summary = "Get ticket throughput report",
            description =
                    "Retrieves completed ticket throughput using a request body for flexible "
                            + "filtering without a long query parameter list.")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved tickets' throughput report",
                        content = @Content(mediaType = "application/json")),
                @ApiResponse(
                        responseCode = "400",
                        description = "Invalid query",
                        content = @Content)
            })
    @PostMapping("/tickets/throughput")
    public TicketThroughputReportDTO postTicketThroughput(
            @Valid @RequestBody TicketThroughputQueryDTO query) {
        return service.getThroughputReport(query);
    }

    // ── Workload Balance ──────────────────────────────────────────────────────

    @Operation(
            summary = "Get workload balance report",
            description =
                    "Retrieves how tickets are distributed among team members for a project. "
                            + "Returns per-member open/closed/overdue counts, average age, "
                            + "priority breakdown and KPI summaries.")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved workload balance report",
                        content = @Content(mediaType = "application/json")),
                @ApiResponse(
                        responseCode = "400",
                        description = "Invalid query",
                        content = @Content)
            })
    @GetMapping("/tickets/workload-balance")
    public WorkloadBalanceReportDTO getWorkloadBalance(
            @Valid @ModelAttribute WorkloadBalanceQueryDTO query) {
        return service.getWorkloadBalanceReport(query);
    }

    @Operation(
            summary = "Get workload balance report (POST)",
            description =
                    "Same as GET /tickets/workload-balance but uses a request body for "
                            + "flexible filtering without a long query parameter list.")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved workload balance report",
                        content = @Content(mediaType = "application/json")),
                @ApiResponse(
                        responseCode = "400",
                        description = "Invalid query",
                        content = @Content)
            })
    @PostMapping("/tickets/workload-balance")
    public WorkloadBalanceReportDTO postWorkloadBalance(
            @Valid @RequestBody WorkloadBalanceQueryDTO query) {
        return service.getWorkloadBalanceReport(query);
    }

    @Operation(
            summary = "Export workload balance report as CSV",
            description = "Exports the workload balance table as a CSV file.")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "CSV file with member workload data",
                        content = @Content(mediaType = "text/csv")),
                @ApiResponse(
                        responseCode = "400",
                        description = "Invalid query",
                        content = @Content)
            })
    @GetMapping(value = "/tickets/workload-balance/export", produces = "text/csv")
    public ResponseEntity<String> exportWorkloadBalance(
            @Valid @ModelAttribute WorkloadBalanceQueryDTO query) {
        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"workload-balance.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(service.exportWorkloadBalanceCsv(query));
    }

    @Operation(
            summary = "Export ticket throughput report",
            description = "Exports the ticket throughput table as CSV.")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully exported tickets' throughput report",
                        content = @Content(mediaType = "text/csv")),
                @ApiResponse(
                        responseCode = "400",
                        description = "Invalid query",
                        content = @Content)
            })
    @GetMapping(value = "/tickets/throughput/export", produces = "text/csv")
    public ResponseEntity<String> exportTicketThroughput(
            @Valid @ModelAttribute TicketThroughputQueryDTO query) {
        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"ticket-throughput.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(service.exportThroughputReportCsv(query));
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
