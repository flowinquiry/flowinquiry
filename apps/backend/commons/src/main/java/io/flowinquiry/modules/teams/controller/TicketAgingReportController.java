package io.flowinquiry.modules.teams.controller;

import io.flowinquiry.modules.teams.service.TicketAgingReportService;
import io.flowinquiry.modules.teams.service.dto.TicketAgingReportDTO;
import io.flowinquiry.modules.teams.service.dto.TicketQueryParams;
import io.flowinquiry.modules.teams.service.dto.report.ThroughputReportDTO;
import io.flowinquiry.modules.teams.service.dto.report.TicketThroughputQueryParams;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(
        name = "Project Reports Management",
        description = "API endpoints for fetching project reports")
public class TicketAgingReportController {

    private final TicketAgingReportService service;

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
          summary = "Get ticket throughput reports by project ID",
          description = "Retrieves report of throughput tickets for a specific project")
    @ApiResponses(
          value = {
                @ApiResponse(
                      responseCode = "200",
                      description = "Successfully retrieved ticket's throughput report",
                      content = @Content(mediaType = "application/json")),
          })
    @GetMapping("/tickets/throughput")
    public ThroughputReportDTO getThroughputReport(
          @ModelAttribute @Valid TicketThroughputQueryParams queryParams) {
        return service.getThroughputReport(queryParams);
    }
}
