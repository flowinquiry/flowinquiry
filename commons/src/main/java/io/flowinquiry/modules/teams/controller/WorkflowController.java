package io.flowinquiry.modules.teams.controller;

import io.flowinquiry.modules.teams.service.WorkflowService;
import io.flowinquiry.modules.teams.service.dto.WorkflowDTO;
import io.flowinquiry.modules.teams.service.dto.WorkflowDetailedDTO;
import io.flowinquiry.modules.teams.service.dto.WorkflowStateDTO;
import io.flowinquiry.query.QueryDTO;
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
public class WorkflowController {

    private final WorkflowService workflowService;

    public WorkflowController(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @PostMapping("/search")
    public Page<WorkflowDTO> findWorkflows(
            @Valid @RequestBody Optional<QueryDTO> queryDTO, Pageable pageable) {
        return workflowService.findWorkflows(queryDTO, pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkflowDTO> getWorkflowById(@PathVariable("id") Long id) {
        return workflowService
                .getWorkflowById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public WorkflowDTO updateWorkflow(
            @PathVariable("id") Long id, @RequestBody WorkflowDTO workflow) {
        return workflowService.updateWorkflow(id, workflow);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteWorkflow(@PathVariable("id") Long id) {
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

    @DeleteMapping("/{workflowId}/teams/{teamId}")
    public void deleteTeamWorkflow(
            @PathVariable("teamId") Long teamId, @PathVariable("workflowId") Long workflowId) {
        workflowService.deleteWorkflowByTeam(teamId, workflowId);
    }

    /**
     * Get all workflows associated with a team.
     *
     * @param teamId the ID of the team.
     * @return a list of workflows available for the team.
     */
    @GetMapping("/teams/{teamId}")
    public List<WorkflowDTO> getWorkflowsByTeam(
            @PathVariable("teamId") Long teamId,
            @RequestParam(name = "used_for_project", required = false)
                    Optional<Boolean> usedForProject) {
        return workflowService.getWorkflowsForTeam(teamId, usedForProject.orElse(null));
    }

    /**
     * Get global workflows not linked to a specific team.
     *
     * @param teamId the ID of the team
     * @return List of WorkflowDTOs representing global workflows not linked to the team
     */
    @GetMapping("/teams/{teamId}/global-workflows-not-linked-yet")
    public ResponseEntity<List<WorkflowDTO>> getGlobalWorkflowsNotLinkedToTeam(
            @PathVariable("teamId") Long teamId) {
        List<WorkflowDTO> workflows = workflowService.listGlobalWorkflowsNotLinkedToTeam(teamId);
        return ResponseEntity.ok(workflows);
    }

    /**
     * Endpoint to retrieve all valid target states for a given workflow and current state ID, with
     * an option to include the current state itself.
     *
     * @param workflowId the ID of the workflow
     * @param workflowStateId the ID of the current workflow state
     * @param includeSelf whether to include the current state in the results
     * @return a list of valid target WorkflowState objects
     */
    @GetMapping("/{workflowId}/transitions")
    public List<WorkflowStateDTO> getValidTargetStates(
            @PathVariable("workflowId") Long workflowId,
            @RequestParam("workflowStateId") Long workflowStateId,
            @RequestParam(value = "includeSelf", defaultValue = "false") boolean includeSelf) {
        return workflowService.getValidTargetWorkflowStates(
                workflowId, workflowStateId, includeSelf);
    }

    @GetMapping("/{workflowId}/initial-states")
    public List<WorkflowStateDTO> getInitialStatesOfWorkflow(
            @PathVariable("workflowId") Long workflowId) {
        return workflowService.getInitialStatesOfWorkflow(workflowId);
    }

    @GetMapping("/teams/{teamId}/project-workflow")
    public WorkflowDetailedDTO getProjectWorkflowByTeam(@PathVariable("teamId") Long teamId) {
        return workflowService
                .findProjectWorkflowByTeam(teamId)
                .orElseThrow(
                        () ->
                                new EntityNotFoundException(
                                        "No project workflow found for team " + teamId));
    }

    /**
     * Get workflow details including states and transitions.
     *
     * @param workflowId The ID of the workflow to retrieve.
     * @return WorkflowDetailedDTO if found, otherwise 404.
     */
    @GetMapping("/details/{workflowId}")
    public ResponseEntity<WorkflowDetailedDTO> getWorkflowDetail(
            @PathVariable("workflowId") Long workflowId) {
        return workflowService
                .getWorkflowDetail(workflowId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/details")
    public ResponseEntity<WorkflowDetailedDTO> saveWorkflow(
            @RequestBody WorkflowDetailedDTO workflowDetailedDTO) {
        WorkflowDetailedDTO savedWorkflow = workflowService.saveWorkflow(workflowDetailedDTO);
        return ResponseEntity.ok(savedWorkflow);
    }

    @PutMapping("/details/{workflowId}")
    public WorkflowDetailedDTO updateWorkflow(
            @PathVariable("workflowId") Long workflowId,
            @Valid @RequestBody WorkflowDetailedDTO workflowDetailedDTO) {
        return workflowService.updateWorkflow(workflowId, workflowDetailedDTO);
    }

    @PostMapping("/{referencedWorkflowId}/teams/{teamId}/create-workflow-reference")
    public ResponseEntity<WorkflowDetailedDTO> createWorkflowByReference(
            @PathVariable("teamId") Long teamId,
            @PathVariable("referencedWorkflowId") Long referencedWorkflowId,
            @RequestBody WorkflowDTO workflowDTO) {
        WorkflowDetailedDTO createdWorkflow =
                workflowService.createWorkflowByReference(
                        teamId, referencedWorkflowId, workflowDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdWorkflow);
    }

    @PostMapping("/{workflowToCloneId}/teams/{teamId}/create-workflow-clone")
    public ResponseEntity<WorkflowDetailedDTO> createWorkflowByCloning(
            @PathVariable("teamId") Long teamId,
            @PathVariable("workflowToCloneId") Long workflowToCloneId,
            @RequestBody WorkflowDTO workflowDTO) {
        WorkflowDetailedDTO clonedWorkflow =
                workflowService.createWorkflowByCloning(teamId, workflowToCloneId, workflowDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(clonedWorkflow);
    }
}
