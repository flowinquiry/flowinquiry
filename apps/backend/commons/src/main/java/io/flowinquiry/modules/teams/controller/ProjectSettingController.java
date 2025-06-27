package io.flowinquiry.modules.teams.controller;

import io.flowinquiry.modules.teams.service.ProjectSettingService;
import io.flowinquiry.modules.teams.service.dto.ProjectSettingDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/project-settings")
@RequiredArgsConstructor
@Tag(
        name = "Project Settings Management",
        description = "API endpoints for managing project settings")
public class ProjectSettingController {

    private final ProjectSettingService projectSettingService;

    @Operation(
            summary = "Get project settings by project ID",
            description = "Retrieves settings for a specific project")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved project settings",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema =
                                                @Schema(implementation = ProjectSettingDTO.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Project settings not found",
                        content = @Content)
            })
    @GetMapping("/project/{projectId}")
    public ProjectSettingDTO getByProjectId(
            @Parameter(description = "ID of the project", required = true) @PathVariable
                    Long projectId) {
        return projectSettingService.getByProjectId(projectId);
    }

    @Operation(
            summary = "Create project settings",
            description = "Creates new project settings with the provided information")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Project settings successfully created",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema =
                                                @Schema(implementation = ProjectSettingDTO.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Bad request - invalid input",
                        content = @Content)
            })
    @PostMapping
    public ProjectSettingDTO create(
            @Parameter(description = "Project settings data to create", required = true)
                    @RequestBody
                    ProjectSettingDTO dto) {
        return projectSettingService.save(dto);
    }

    @Operation(
            summary = "Update project settings",
            description = "Updates existing project settings with the provided information")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Project settings successfully updated",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema =
                                                @Schema(implementation = ProjectSettingDTO.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Bad request - invalid input",
                        content = @Content),
                @ApiResponse(
                        responseCode = "404",
                        description = "Project settings not found",
                        content = @Content)
            })
    @PutMapping("/project/{projectId}")
    public ProjectSettingDTO update(
            @Parameter(description = "ID of the project to update settings for", required = true)
                    @PathVariable
                    Long projectId,
            @Parameter(description = "Updated project settings data", required = true) @RequestBody
                    ProjectSettingDTO dto) {
        return projectSettingService.updateByProjectId(projectId, dto);
    }
}
