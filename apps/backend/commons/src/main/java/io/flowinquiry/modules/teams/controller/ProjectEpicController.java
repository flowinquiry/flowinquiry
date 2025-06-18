package io.flowinquiry.modules.teams.controller;

import io.flowinquiry.exceptions.ResourceNotFoundException;
import io.flowinquiry.modules.teams.service.ProjectEpicService;
import io.flowinquiry.modules.teams.service.dto.ProjectEpicDTO;
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
@RequestMapping("/api/project-epics")
@RequiredArgsConstructor
@Tag(name = "Project Epic Management", description = "API endpoints for managing project epics")
public class ProjectEpicController {

    private final ProjectEpicService epicService;

    @Operation(summary = "Get epic by ID", description = "Retrieves a project epic by its ID")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved epic",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = ProjectEpicDTO.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Epic not found",
                        content = @Content)
            })
    @GetMapping("/{id}")
    public ProjectEpicDTO getEpicById(
            @Parameter(description = "ID of the epic to retrieve", required = true) @PathVariable
                    Long id) {
        return epicService
                .getEpicById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Epic not found with id: " + id));
    }

    @Operation(
            summary = "Create a new epic",
            description = "Creates a new project epic with the provided information")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Epic successfully created",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = ProjectEpicDTO.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Bad request - invalid input",
                        content = @Content)
            })
    @PostMapping
    public ProjectEpicDTO createEpic(
            @Parameter(description = "Epic data to create", required = true) @RequestBody
                    ProjectEpicDTO epic) {
        return epicService.save(epic);
    }

    @Operation(
            summary = "Update an existing epic",
            description = "Updates an existing project epic with the provided information")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Epic successfully updated",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = ProjectEpicDTO.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Bad request - invalid input",
                        content = @Content),
                @ApiResponse(
                        responseCode = "404",
                        description = "Epic not found",
                        content = @Content)
            })
    @PutMapping("/{id}")
    public ProjectEpicDTO updateEpic(
            @Parameter(description = "ID of the epic to update", required = true) @PathVariable
                    Long id,
            @Parameter(description = "Updated epic data", required = true) @RequestBody
                    ProjectEpicDTO updatedEpic) {
        return epicService.updateEpic(id, updatedEpic);
    }

    @Operation(summary = "Delete an epic", description = "Deletes a project epic by its ID")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Epic successfully deleted"),
                @ApiResponse(
                        responseCode = "404",
                        description = "Epic not found",
                        content = @Content)
            })
    @DeleteMapping("/{id}")
    public void deleteEpic(
            @Parameter(description = "ID of the epic to delete", required = true) @PathVariable
                    Long id) {
        epicService.deleteEpic(id);
    }
}
