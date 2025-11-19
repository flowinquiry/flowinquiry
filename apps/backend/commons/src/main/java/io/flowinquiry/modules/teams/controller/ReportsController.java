package io.flowinquiry.modules.teams.controller;

import io.flowinquiry.modules.teams.service.ReportsService;
import io.flowinquiry.modules.teams.service.dto.TicketAgeingBucketDTO;
import io.flowinquiry.modules.teams.service.dto.TicketQueryParams;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(
        name = "Project Reports Management",
        description = "API endpoints for fetching project reports")
public class ReportsController {

    private final ReportsService service;

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
    public List<TicketAgeingBucketDTO> getAgeingTickets(
            @ModelAttribute TicketQueryParams queryParams) {
        return service.getAgeingTicketsReport(queryParams);
    }
}
