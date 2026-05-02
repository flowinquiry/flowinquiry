package io.flowinquiry.modules.teams.controller;

import io.flowinquiry.modules.teams.domain.Integration;
import io.flowinquiry.modules.teams.service.IntegrationSettingsService;
import io.flowinquiry.modules.teams.service.dto.IntegrationDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/integrations")
@Tag(
        name = "Integrations Management",
        description = "API endpoints for managing integrations with external applications")
public class IntegrationSettingsController {

    @Autowired private IntegrationSettingsService integrationSettingsService;

    @Operation(
            summary = "Create a new Integration",
            description = "Creates a new Integration for the project with the provided information")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "201",
                        description = "Integration successfully created",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = Integration.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Bad request - invalid input",
                        content = @Content)
            })
    @PostMapping
    public ResponseEntity<IntegrationDTO> createIntegration(
            @Parameter(description = "Organization data to create", required = true) @RequestBody
                    IntegrationDTO integrationDTO) {
        IntegrationDTO createdIntegration =
                integrationSettingsService.CreateIntegration(integrationDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdIntegration);
    }

    @Operation(
            summary = "Get Integration by ID",
            description = "Fetches a single Integration by its unique identifier")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Integration found",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = IntegrationDTO.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Integration not found",
                        content = @Content)
            })
    @GetMapping("/{id}")
    public ResponseEntity<IntegrationDTO> getIntegrationById(
            @Parameter(description = "Integration ID", required = true) @PathVariable Long id) {

        IntegrationDTO integration = integrationSettingsService.getIntegrationById(id);

        return ResponseEntity.ok(integration);
    }

    @Operation(
            summary = "Update an Integration",
            description = "Updates an existing Integration with the provided data")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Integration updated successfully",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = IntegrationDTO.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Integration not found",
                        content = @Content),
                @ApiResponse(
                        responseCode = "400",
                        description = "Invalid input",
                        content = @Content)
            })
    @PutMapping("/{id}")
    public ResponseEntity<IntegrationDTO> updateIntegration(
            @Parameter(description = "Integration ID", required = true) @PathVariable Long id,
            @Parameter(description = "Updated Integration data", required = true) @RequestBody
                    IntegrationDTO integrationDTO) {

        IntegrationDTO updatedIntegration =
                integrationSettingsService.updateIntegration(id, integrationDTO);

        return ResponseEntity.ok(updatedIntegration);
    }

    @Operation(summary = "Delete an Integration", description = "Deletes an Integration by its ID")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "204",
                        description = "Integration deleted successfully"),
                @ApiResponse(
                        responseCode = "404",
                        description = "Integration not found",
                        content = @Content)
            })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIntegration(
            @Parameter(description = "Integration ID", required = true) @PathVariable Long id) {

        integrationSettingsService.deleteIntegration(id);
        return ResponseEntity.noContent().build();
    }
}
