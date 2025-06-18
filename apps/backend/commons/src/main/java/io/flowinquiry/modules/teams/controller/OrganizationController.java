package io.flowinquiry.modules.teams.controller;

import io.flowinquiry.modules.teams.domain.Organization;
import io.flowinquiry.modules.teams.service.OrganizationService;
import io.flowinquiry.modules.teams.service.dto.OrganizationDTO;
import io.flowinquiry.modules.teams.service.mapper.OrganizationMapper;
import io.flowinquiry.query.QueryDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/organizations")
@Tag(name = "Organization Management", description = "API endpoints for managing organizations")
public class OrganizationController {

    private OrganizationService organizationService;

    private OrganizationMapper organizationMapper;

    public OrganizationController(
            OrganizationMapper organizationMapper, OrganizationService organizationService) {
        this.organizationMapper = organizationMapper;
        this.organizationService = organizationService;
    }

    @Operation(
            summary = "Create a new organization",
            description = "Creates a new organization with the provided information")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "201",
                        description = "Organization successfully created",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = Organization.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Bad request - invalid input",
                        content = @Content)
            })
    @PostMapping
    public ResponseEntity<Organization> createOrganization(
            @Parameter(description = "Organization data to create", required = true) @RequestBody
                    Organization organization) {
        Organization createdOrganization = organizationService.createOrganization(organization);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdOrganization);
    }

    @Operation(
            summary = "Update an existing organization",
            description = "Updates an existing organization with the provided information")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Organization successfully updated",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = Organization.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Bad request - invalid input",
                        content = @Content),
                @ApiResponse(
                        responseCode = "404",
                        description = "Organization not found",
                        content = @Content)
            })
    @PutMapping("/{id}")
    public ResponseEntity<Organization> updateOrganization(
            @Parameter(description = "ID of the organization to update", required = true)
                    @PathVariable("id")
                    Long id,
            @Parameter(description = "Updated organization data", required = true) @RequestBody
                    Organization organization) {
        Organization updatedOrganization = organizationService.updateOrganization(id, organization);
        return ResponseEntity.ok(updatedOrganization);
    }

    @Operation(
            summary = "Delete an organization",
            description = "Deletes an organization by its ID")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "204",
                        description = "Organization successfully deleted"),
                @ApiResponse(
                        responseCode = "404",
                        description = "Organization not found",
                        content = @Content)
            })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrganization(
            @Parameter(description = "ID of the organization to delete", required = true)
                    @PathVariable("id")
                    Long id) {
        organizationService.deleteOrganization(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Get organization by ID",
            description = "Retrieves an organization by its ID")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved organization",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = Organization.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Organization not found",
                        content = @Content)
            })
    @GetMapping("/{id}")
    public ResponseEntity<Organization> findOrganizationById(
            @Parameter(description = "ID of the organization to retrieve", required = true)
                    @PathVariable("id")
                    Long id) {
        Organization organization = organizationService.findOrganizationById(id);
        return ResponseEntity.ok(organization);
    }

    @Operation(
            summary = "Search organizations",
            description = "Search for organizations based on query criteria with pagination")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved organizations",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = Page.class))),
                @ApiResponse(responseCode = "400", description = "Bad request", content = @Content)
            })
    @PostMapping("/search")
    public ResponseEntity<Page<OrganizationDTO>> findOrganizations(
            @Parameter(description = "Query parameters for filtering organizations") @RequestBody
                    Optional<QueryDTO> queryDTO,
            @Parameter(description = "Pagination information") Pageable pageable) {
        Page<Organization> teams = organizationService.findOrganizations(queryDTO, pageable);
        return new ResponseEntity<>(teams.map(organizationMapper::toDto), HttpStatus.OK);
    }
}
