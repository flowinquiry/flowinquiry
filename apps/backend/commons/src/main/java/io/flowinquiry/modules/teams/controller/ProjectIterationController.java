package io.flowinquiry.modules.teams.controller;

import io.flowinquiry.exceptions.ResourceNotFoundException;
import io.flowinquiry.modules.teams.service.ProjectIterationService;
import io.flowinquiry.modules.teams.service.dto.ProjectIterationDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/project-iterations")
@RequiredArgsConstructor
@Tag(
        name = "Project Iteration Management",
        description = "API endpoints for managing project iterations")
public class ProjectIterationController {

    private final ProjectIterationService iterationService;

    @Operation(
            summary = "Get iteration by ID",
            description = "Retrieves a project iteration by its ID")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved iteration",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                ProjectIterationDTO.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Iteration not found",
                        content = @Content)
            })
    @GetMapping("/{id}")
    public ProjectIterationDTO getIterationById(
            @Parameter(description = "ID of the iteration to retrieve", required = true)
                    @PathVariable
                    Long id) {
        return iterationService
                .getIterationById(id)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Can not find iteration id " + id));
    }

    @Operation(
            summary = "Create a new iteration",
            description = "Creates a new project iteration with the provided information")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Iteration successfully created",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                ProjectIterationDTO.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Bad request - invalid input",
                        content = @Content)
            })
    @PostMapping
    public ProjectIterationDTO createIteration(
            @Parameter(description = "Iteration data to create", required = true) @RequestBody
                    ProjectIterationDTO iteration) {
        return iterationService.save(iteration);
    }

    @Operation(
            summary = "Update an existing iteration",
            description = "Updates an existing project iteration with the provided information")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Iteration successfully updated",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                ProjectIterationDTO.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Bad request - invalid input",
                        content = @Content),
                @ApiResponse(
                        responseCode = "404",
                        description = "Iteration not found",
                        content = @Content)
            })
    @PutMapping("/{id}")
    public ProjectIterationDTO updateIteration(
            @Parameter(description = "ID of the iteration to update", required = true) @PathVariable
                    Long id,
            @Parameter(description = "Updated iteration data", required = true) @RequestBody
                    ProjectIterationDTO updatedIteration) {
        return iterationService.updateIteration(id, updatedIteration);
    }

    @Operation(
            summary = "Delete an iteration",
            description = "Deletes a project iteration by its ID")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Iteration successfully deleted"),
                @ApiResponse(
                        responseCode = "404",
                        description = "Iteration not found",
                        content = @Content)
            })
    @DeleteMapping("/{id}")
    public void deleteIteration(
            @Parameter(description = "ID of the iteration to delete", required = true) @PathVariable
                    Long id) {
        iterationService.deleteIteration(id);
    }
}
