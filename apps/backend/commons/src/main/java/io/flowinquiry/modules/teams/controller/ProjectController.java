package io.flowinquiry.modules.teams.controller;

import io.flowinquiry.modules.teams.service.ProjectEpicService;
import io.flowinquiry.modules.teams.service.ProjectIterationService;
import io.flowinquiry.modules.teams.service.ProjectService;
import io.flowinquiry.modules.teams.service.dto.ProjectDTO;
import io.flowinquiry.modules.teams.service.dto.ProjectEpicDTO;
import io.flowinquiry.modules.teams.service.dto.ProjectIterationDTO;
import io.flowinquiry.query.QueryDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/projects")
@AllArgsConstructor
@Tag(
        name = "Project Management",
        description = "API endpoints for managing projects and related resources")
public class ProjectController {

    private final ProjectService projectService;

    private final ProjectIterationService projectIterationService;

    private final ProjectEpicService projectEpicService;

    @Operation(
            summary = "Create a new project",
            description = "Creates a new project with the provided information")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Project successfully created",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = ProjectDTO.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Bad request - invalid input",
                        content = @Content)
            })
    @PostMapping
    public ProjectDTO createProject(
            @Parameter(description = "Project data to create", required = true) @RequestBody
                    ProjectDTO project) {
        return projectService.createProject(project);
    }

    @Operation(summary = "Get project by ID", description = "Retrieves a project by its ID")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved project",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = ProjectDTO.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Project not found",
                        content = @Content)
            })
    @GetMapping("/{id}")
    public ProjectDTO getProjectById(
            @Parameter(description = "ID of the project to retrieve", required = true) @PathVariable
                    Long id) {
        return projectService.getProjectById(id);
    }

    @Operation(
            summary = "Search projects",
            description = "Search for projects based on query criteria with pagination")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved projects",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = Page.class))),
                @ApiResponse(responseCode = "400", description = "Bad request", content = @Content)
            })
    @PostMapping("/search")
    public Page<ProjectDTO> findProject(
            @Parameter(description = "Query parameters for filtering projects") @Valid @RequestBody
                    Optional<QueryDTO> queryDTO,
            @Parameter(description = "Pagination information") Pageable pageable) {
        return projectService.findProjects(queryDTO, pageable);
    }

    @Operation(
            summary = "Update an existing project",
            description = "Updates an existing project with the provided information")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Project successfully updated",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = ProjectDTO.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Bad request - invalid input",
                        content = @Content),
                @ApiResponse(
                        responseCode = "404",
                        description = "Project not found",
                        content = @Content)
            })
    @PutMapping("/{projectId}")
    public ProjectDTO updateProject(
            @Parameter(description = "ID of the project to update", required = true)
                    @PathVariable("projectId")
                    Long projectId,
            @Parameter(description = "Updated project data", required = true) @RequestBody
                    ProjectDTO project) {
        return projectService.updateProject(projectId, project);
    }

    @Operation(summary = "Delete a project", description = "Deletes a project by its ID")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Project successfully deleted"),
                @ApiResponse(
                        responseCode = "404",
                        description = "Project not found",
                        content = @Content)
            })
    @DeleteMapping("/{projectId}")
    public void deleteProject(
            @Parameter(description = "ID of the project to delete", required = true)
                    @PathVariable("projectId")
                    Long projectId) {
        projectService.deleteProject(projectId);
    }

    @Operation(
            summary = "Get project iterations",
            description = "Retrieves all iterations associated with a specific project")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved project iterations",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                ProjectIterationDTO.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Project not found",
                        content = @Content)
            })
    @GetMapping("/{projectId}/iterations")
    public List<ProjectIterationDTO> getProjectIterations(
            @Parameter(description = "ID of the project", required = true) @PathVariable
                    Long projectId) {
        return projectIterationService.findByProjectId(projectId);
    }

    @Operation(
            summary = "Get project epics",
            description = "Retrieves all epics associated with a specific project")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved project epics",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = ProjectEpicDTO.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Project not found",
                        content = @Content)
            })
    @GetMapping("/{projectId}/epics")
    public List<ProjectEpicDTO> getProjectEpics(
            @Parameter(description = "ID of the project", required = true) @PathVariable
                    Long projectId) {
        return projectEpicService.findByProjectId(projectId);
    }

    @Operation(
            summary = "Get project by short name",
            description = "Retrieves a project by its short name")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved project",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = ProjectDTO.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Project not found",
                        content = @Content)
            })
    @GetMapping("/short-name/{shortName}")
    public ProjectDTO getByShortName(
            @Parameter(description = "Short name of the project to retrieve", required = true)
                    @PathVariable
                    String shortName) {
        return projectService.getByShortName(shortName);
    }

    @Operation(
            summary = "Get projects by user ID",
            description = "Retrieves all projects associated with a specific user with pagination")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved user's projects",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = Page.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "User not found",
                        content = @Content)
            })
    @GetMapping("/by-user/{userId}")
    public Page<ProjectDTO> getProjectsByUser(
            @Parameter(description = "ID of the user to retrieve projects for", required = true)
                    @PathVariable
                    Long userId,
            @Parameter(description = "Pagination information") Pageable pageable) {
        return projectService.getProjectsByUserId(userId, pageable);
    }
}
