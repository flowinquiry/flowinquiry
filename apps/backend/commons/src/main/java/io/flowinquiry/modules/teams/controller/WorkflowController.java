package io.flowinquiry.modules.teams.controller;

import io.flowinquiry.modules.teams.service.WorkflowService;
import io.flowinquiry.modules.teams.service.dto.WorkflowDTO;
import io.flowinquiry.modules.teams.service.dto.WorkflowDetailedDTO;
import io.flowinquiry.modules.teams.service.dto.WorkflowStateDTO;
import io.flowinquiry.query.QueryDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import java.util.List;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/workflows")
@Tag(
        name = "Workflow Management",
        description = "API endpoints for managing workflows, workflow states, and transitions")
public class WorkflowController {

    private final WorkflowService workflowService;

    public WorkflowController(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @Operation(
            summary = "Search workflows",
            description = "Search for workflows based on query criteria with pagination")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved workflows",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = Page.class))),
                @ApiResponse(responseCode = "400", description = "Bad request", content = @Content)
            })
    @PostMapping("/search")
    public Page<WorkflowDTO> findWorkflows(
            @Parameter(description = "Query parameters for filtering workflows") @Valid @RequestBody
                    Optional<QueryDTO> queryDTO,
            @Parameter(description = "Pagination information") Pageable pageable) {
        return workflowService.findWorkflows(queryDTO, pageable);
    }

    @Operation(summary = "Get workflow by ID", description = "Retrieves a workflow by its ID")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved workflow",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = WorkflowDTO.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Workflow not found",
                        content = @Content)
            })
    @GetMapping("/{id}")
    public ResponseEntity<WorkflowDTO> getWorkflowById(
            @Parameter(description = "ID of the workflow to retrieve", required = true)
                    @PathVariable("id")
                    Long id) {
        return workflowService
                .getWorkflowById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(
            summary = "Update an existing workflow",
            description = "Updates an existing workflow with the provided information")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Workflow successfully updated",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = WorkflowDTO.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Bad request - invalid input",
                        content = @Content),
                @ApiResponse(
                        responseCode = "404",
                        description = "Workflow not found",
                        content = @Content)
            })
    @PutMapping("/{id}")
    public WorkflowDTO updateWorkflow(
            @Parameter(description = "ID of the workflow to update", required = true)
                    @PathVariable("id")
                    Long id,
            @Parameter(description = "Updated workflow data", required = true) @RequestBody
                    WorkflowDTO workflow) {
        return workflowService.updateWorkflow(id, workflow);
    }

    @Operation(summary = "Delete a workflow", description = "Deletes a workflow by its ID")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "204", description = "Workflow successfully deleted"),
                @ApiResponse(
                        responseCode = "404",
                        description = "Workflow not found",
                        content = @Content),
                @ApiResponse(
                        responseCode = "409",
                        description = "Workflow cannot be deleted due to existing references",
                        content =
                                @Content(
                                        mediaType = "text/plain",
                                        schema = @Schema(type = "string")))
            })
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteWorkflow(
            @Parameter(description = "ID of the workflow to delete", required = true)
                    @PathVariable("id")
                    Long id) {
        try {
            workflowService.deleteWorkflow(id);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build(); // 404 Not Found
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Workflow cannot be deleted: " + e.getMessage()); // 409 Conflict
        }
    }

    @Operation(
            summary = "Delete a team's workflow",
            description = "Deletes a workflow association with a specific team")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Team workflow successfully deleted"),
                @ApiResponse(
                        responseCode = "404",
                        description = "Team or workflow not found",
                        content = @Content)
            })
    @DeleteMapping("/{workflowId}/teams/{teamId}")
    public void deleteTeamWorkflow(
            @Parameter(description = "ID of the team", required = true) @PathVariable("teamId")
                    Long teamId,
            @Parameter(description = "ID of the workflow to delete", required = true)
                    @PathVariable("workflowId")
                    Long workflowId) {
        workflowService.deleteWorkflowByTeam(teamId, workflowId);
    }

    @Operation(
            summary = "Get workflows by team",
            description = "Retrieves all workflows associated with a specific team")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved workflows",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = WorkflowDTO.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Team not found",
                        content = @Content)
            })
    @GetMapping("/teams/{teamId}")
    public List<WorkflowDTO> getWorkflowsByTeam(
            @Parameter(description = "ID of the team", required = true) @PathVariable("teamId")
                    Long teamId,
            @Parameter(description = "Filter for workflows used in projects")
                    @RequestParam(name = "used_for_project", required = false)
                    Optional<Boolean> usedForProject) {
        return workflowService.getWorkflowsForTeam(teamId, usedForProject.orElse(null));
    }

    @Operation(
            summary = "Get global workflows not linked to a team",
            description =
                    "Retrieves all global workflows that are not yet linked to a specific team")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved global workflows",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = WorkflowDTO.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Team not found",
                        content = @Content)
            })
    @GetMapping("/teams/{teamId}/global-workflows-not-linked-yet")
    public ResponseEntity<List<WorkflowDTO>> getGlobalWorkflowsNotLinkedToTeam(
            @Parameter(description = "ID of the team", required = true) @PathVariable("teamId")
                    Long teamId) {
        List<WorkflowDTO> workflows = workflowService.listGlobalWorkflowsNotLinkedToTeam(teamId);
        return ResponseEntity.ok(workflows);
    }

    @Operation(
            summary = "Get valid target states for a workflow transition",
            description =
                    "Retrieves all valid target states for a given workflow and current state ID")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved valid target states",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = WorkflowStateDTO.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Workflow or workflow state not found",
                        content = @Content)
            })
    @GetMapping("/{workflowId}/transitions")
    public List<WorkflowStateDTO> getValidTargetStates(
            @Parameter(description = "ID of the workflow", required = true)
                    @PathVariable("workflowId")
                    Long workflowId,
            @Parameter(description = "ID of the current workflow state", required = true)
                    @RequestParam("workflowStateId")
                    Long workflowStateId,
            @Parameter(description = "Whether to include the current state in the results")
                    @RequestParam(value = "includeSelf", defaultValue = "false")
                    boolean includeSelf) {
        return workflowService.getValidTargetWorkflowStates(
                workflowId, workflowStateId, includeSelf);
    }

    @Operation(
            summary = "Get initial states of a workflow",
            description = "Retrieves all initial states of a specific workflow")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved initial states",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = WorkflowStateDTO.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Workflow not found",
                        content = @Content)
            })
    @GetMapping("/{workflowId}/initial-states")
    public List<WorkflowStateDTO> getInitialStatesOfWorkflow(
            @Parameter(description = "ID of the workflow", required = true)
                    @PathVariable("workflowId")
                    Long workflowId) {
        return workflowService.getInitialStatesOfWorkflow(workflowId);
    }

    @Operation(
            summary = "Get project workflow by team",
            description = "Retrieves the project workflow associated with a specific team")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved project workflow",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                WorkflowDetailedDTO.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Team or project workflow not found",
                        content = @Content)
            })
    @GetMapping("/teams/{teamId}/project-workflow")
    public WorkflowDetailedDTO getProjectWorkflowByTeam(
            @Parameter(description = "ID of the team", required = true) @PathVariable("teamId")
                    Long teamId) {
        return workflowService
                .findProjectWorkflowByTeam(teamId)
                .orElseThrow(
                        () ->
                                new EntityNotFoundException(
                                        "No project workflow found for team " + teamId));
    }

    @Operation(
            summary = "Get detailed workflow information",
            description =
                    "Retrieves detailed workflow information including states and transitions")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved workflow details",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                WorkflowDetailedDTO.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Workflow not found",
                        content = @Content)
            })
    @GetMapping("/details/{workflowId}")
    public ResponseEntity<WorkflowDetailedDTO> getWorkflowDetail(
            @Parameter(description = "ID of the workflow to retrieve details for", required = true)
                    @PathVariable("workflowId")
                    Long workflowId) {
        return workflowService
                .getWorkflowDetail(workflowId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(
            summary = "Create a new workflow with details",
            description =
                    "Creates a new workflow with detailed information including states and transitions")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Workflow successfully created",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                WorkflowDetailedDTO.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Bad request - invalid input",
                        content = @Content)
            })
    @PostMapping("/details")
    public ResponseEntity<WorkflowDetailedDTO> saveWorkflow(
            @Parameter(description = "Detailed workflow data to create", required = true)
                    @RequestBody
                    WorkflowDetailedDTO workflowDetailedDTO) {
        WorkflowDetailedDTO savedWorkflow = workflowService.saveWorkflow(workflowDetailedDTO);
        return ResponseEntity.ok(savedWorkflow);
    }

    @Operation(
            summary = "Update a workflow with details",
            description =
                    "Updates an existing workflow with detailed information including states and transitions")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Workflow successfully updated",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                WorkflowDetailedDTO.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Bad request - invalid input",
                        content = @Content),
                @ApiResponse(
                        responseCode = "404",
                        description = "Workflow not found",
                        content = @Content)
            })
    @PutMapping("/details/{workflowId}")
    public WorkflowDetailedDTO updateWorkflow(
            @Parameter(description = "ID of the workflow to update", required = true)
                    @PathVariable("workflowId")
                    Long workflowId,
            @Parameter(description = "Updated detailed workflow data", required = true)
                    @Valid @RequestBody
                    WorkflowDetailedDTO workflowDetailedDTO) {
        return workflowService.updateWorkflow(workflowId, workflowDetailedDTO);
    }

    @Operation(
            summary = "Create a workflow by reference",
            description = "Creates a new workflow for a team by referencing an existing workflow")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "201",
                        description = "Workflow reference successfully created",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                WorkflowDetailedDTO.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Bad request - invalid input",
                        content = @Content),
                @ApiResponse(
                        responseCode = "404",
                        description = "Team or referenced workflow not found",
                        content = @Content)
            })
    @PostMapping("/{referencedWorkflowId}/teams/{teamId}/create-workflow-reference")
    public ResponseEntity<WorkflowDetailedDTO> createWorkflowByReference(
            @Parameter(description = "ID of the team", required = true) @PathVariable("teamId")
                    Long teamId,
            @Parameter(description = "ID of the workflow to reference", required = true)
                    @PathVariable("referencedWorkflowId")
                    Long referencedWorkflowId,
            @Parameter(description = "Basic workflow data", required = true) @RequestBody
                    WorkflowDTO workflowDTO) {
        WorkflowDetailedDTO createdWorkflow =
                workflowService.createWorkflowByReference(
                        teamId, referencedWorkflowId, workflowDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdWorkflow);
    }

    @Operation(
            summary = "Create a workflow by cloning",
            description = "Creates a new workflow for a team by cloning an existing workflow")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "201",
                        description = "Workflow clone successfully created",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                WorkflowDetailedDTO.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Bad request - invalid input",
                        content = @Content),
                @ApiResponse(
                        responseCode = "404",
                        description = "Team or workflow to clone not found",
                        content = @Content)
            })
    @PostMapping("/{workflowToCloneId}/teams/{teamId}/create-workflow-clone")
    public ResponseEntity<WorkflowDetailedDTO> createWorkflowByCloning(
            @Parameter(description = "ID of the team", required = true) @PathVariable("teamId")
                    Long teamId,
            @Parameter(description = "ID of the workflow to clone", required = true)
                    @PathVariable("workflowToCloneId")
                    Long workflowToCloneId,
            @Parameter(description = "Basic workflow data", required = true) @RequestBody
                    WorkflowDTO workflowDTO) {
        WorkflowDetailedDTO clonedWorkflow =
                workflowService.createWorkflowByCloning(teamId, workflowToCloneId, workflowDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(clonedWorkflow);
    }
}
