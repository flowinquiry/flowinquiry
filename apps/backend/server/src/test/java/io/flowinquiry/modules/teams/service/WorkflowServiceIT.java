package io.flowinquiry.modules.teams.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

import io.flowinquiry.IntegrationTest;
import io.flowinquiry.exceptions.ResourceNotFoundException;
import io.flowinquiry.modules.teams.domain.WorkflowVisibility;
import io.flowinquiry.modules.teams.service.dto.WorkflowDTO;
import io.flowinquiry.modules.teams.service.dto.WorkflowDetailedDTO;
import io.flowinquiry.modules.teams.service.dto.WorkflowStateDTO;
import io.flowinquiry.modules.teams.service.dto.WorkflowTransitionDTO;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.assertj.core.groups.Tuple;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
public class WorkflowServiceIT {

    @Autowired private WorkflowService workflowService;

    @Test
    public void shouldUpdateWorkflowSuccessfully() {
        WorkflowDTO workflowDTO = workflowService.getWorkflowById(1L).get();
        workflowDTO.setName("New workflow");
        workflowDTO.setRequestName("New request name");
        workflowService.updateWorkflow(1L, workflowDTO);
        workflowDTO = workflowService.getWorkflowById(1L).get();

        assertThat(workflowDTO)
                .isNotNull()
                .extracting(WorkflowDTO::getName, WorkflowDTO::getRequestName)
                .containsExactly("New workflow", "New request name");
    }

    @Test
    public void shouldUpdateWorkflowFailedForNotFoundWorkflow() {
        WorkflowDTO workflowDTO = WorkflowDTO.builder().build();

        assertThatThrownBy(() -> workflowService.updateWorkflow(1000L, workflowDTO))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Workflow not found with id: 1000");
    }

    @Test
    public void shouldGetWorkflowForTeamSuccessfully() {
        List<WorkflowDTO> workflows = workflowService.getWorkflowsForTeam(1L, false);
        assertThat(workflows.size()).isEqualTo(2);

        List<Tuple> expectedWorkflows =
                List.of(
                        Tuple.tuple(2L, "Refund Process Workflow"),
                        Tuple.tuple(4L, "New Hardware Request"));

        assertThat(workflows)
                .extracting(WorkflowDTO::getId, WorkflowDTO::getName)
                .containsExactlyInAnyOrderElementsOf(expectedWorkflows);
    }

    @Test
    public void shouldGetEmptyWorkflowNotNonExistentTeam() {
        List<WorkflowDTO> workflows = workflowService.getWorkflowsForTeam(1000L, false);
        assertThat(workflows.size()).isEqualTo(0);
    }

    @Test
    public void shouldGetWorkflowDetailSuccessfully() {
        WorkflowDetailedDTO workflowDetail = workflowService.getWorkflowDetail(2L).get();
        assertThat(workflowDetail)
                .extracting(WorkflowDetailedDTO::getId, WorkflowDetailedDTO::getName)
                .containsExactly(2L, "Refund Process Workflow");

        // Expected workflow states
        assertThat(workflowDetail.getStates()).hasSize(6);
        assertThat(workflowDetail.getStates())
                .extracting(
                        WorkflowStateDTO::getId,
                        WorkflowStateDTO::getStateName,
                        WorkflowStateDTO::getIsInitial,
                        WorkflowStateDTO::getIsFinal)
                .containsExactlyInAnyOrder(
                        tuple(6L, "New", true, false),
                        tuple(7L, "Request Evidence", false, false),
                        tuple(8L, "Evidence Provided", false, false),
                        tuple(9L, "Refund Approved", false, false),
                        tuple(10L, "Refund Denied", false, true),
                        tuple(11L, "Refund Completed", false, true));

        assertThat(workflowDetail.getTransitions()).hasSize(5);

        // Expected workflow transitions
        assertThat(workflowDetail.getTransitions())
                .extracting(
                        WorkflowTransitionDTO::getId,
                        WorkflowTransitionDTO::getWorkflowId,
                        WorkflowTransitionDTO::getEventName,
                        WorkflowTransitionDTO::getSourceStateId,
                        WorkflowTransitionDTO::getTargetStateId)
                .containsExactlyInAnyOrder(
                        tuple(11L, 2L, "Request Evidence", 6L, 7L),
                        tuple(12L, 2L, "Provide Evidence", 7L, 8L),
                        tuple(13L, 2L, "Approve Refund", 8L, 9L),
                        tuple(14L, 2L, "Deny Refund", 8L, 10L),
                        tuple(15L, 2L, "Complete Refund", 9L, 11L));
    }

    @Test
    public void shouldSaveWorkflowSuccessfully() {
        WorkflowDetailedDTO workflowDetail = workflowService.getWorkflowDetail(1L).get();
        workflowDetail.setId(null);
        WorkflowDetailedDTO savedWorkflowDTO = workflowService.saveWorkflow(workflowDetail);
        assertThat(savedWorkflowDTO.getId()).isGreaterThan(1L);
    }

    @Test
    public void shouldGetWorkflowNotLinkWithTeamsSuccessfully() {
        List<WorkflowDTO> workflows = workflowService.listGlobalWorkflowsNotLinkedToTeam(1L);
        assertThat(workflows.size()).isEqualTo(2);
        List<Tuple> expectedWorkflows =
                List.of(
                        Tuple.tuple(3L, "Bug Fix Workflow"),
                        Tuple.tuple(5L, "Software Approval Workflow"));

        assertThat(workflows)
                .extracting(WorkflowDTO::getId, WorkflowDTO::getName)
                .containsExactlyInAnyOrderElementsOf(expectedWorkflows);
    }

    @Test
    public void shouldCreateWorkflowFromReferenceSuccessfully() {
        WorkflowDTO workflowDTO =
                WorkflowDTO.builder()
                        .name("Workflow Example")
                        .requestName("request")
                        .description("description")
                        .build();
        WorkflowDetailedDTO workflowDetailedDTO =
                workflowService.createWorkflowByReference(1L, 1L, workflowDTO);

        // Then: Verify the workflow is created successfully
        assertThat(workflowDetailedDTO)
                .isNotNull()
                .extracting(
                        WorkflowDetailedDTO::getName,
                        WorkflowDetailedDTO::getRequestName,
                        WorkflowDetailedDTO::getDescription)
                .containsExactly("Workflow Example", "request", "description");

        // Ensure ID is assigned
        assertThat(workflowDetailedDTO.getId()).isNotNull().isPositive();
        assertThat(workflowDetailedDTO.getVisibility()).isEqualTo(WorkflowVisibility.PRIVATE);

        // Verify the reference workflow details
        assertThat(workflowDetailedDTO.getOwnerId()).isEqualTo(1L);

        // Ensure workflow states are cloned properly
        assertThat(workflowDetailedDTO.getStates()).isNotEmpty();
        assertThat(workflowDetailedDTO.getStates())
                .allSatisfy(
                        state -> {
                            assertThat(state.getWorkflowId())
                                    .isNotEqualTo(workflowDetailedDTO.getId());
                        });

        // Ensure workflow transitions are cloned properly
        assertThat(workflowDetailedDTO.getTransitions()).isNotEmpty();
        assertThat(workflowDetailedDTO.getTransitions())
                .allSatisfy(
                        transition -> {
                            assertThat(transition.getWorkflowId())
                                    .isNotEqualTo(workflowDetailedDTO.getId());
                        });

        // Verify auditing fields
        assertThat(workflowDetailedDTO.getCreatedAt()).isNotNull();
        assertThat(workflowDetailedDTO.getModifiedAt()).isNotNull();
    }

    @Test
    public void shouldDeleteWorkflowFromTeamSuccessfully() {
        assertThat(workflowService.getWorkflowsForTeam(1L, false).size()).isEqualTo(2);
        workflowService.deleteWorkflowByTeam(1L, 2L);
        assertThat(workflowService.getWorkflowsForTeam(1L, false).size()).isEqualTo(1);
    }

    @Test
    public void shouldGetGlobalWorkflowUsedForProject() {
        // When: Retrieving a global workflow used for projects
        WorkflowDTO workflowDTO = workflowService.getGlobalWorkflowUsedForProject();

        // Then: Verify the workflow is returned and has expected properties
        assertThat(workflowDTO).isNotNull();
        assertThat(workflowDTO.getVisibility()).isEqualTo(WorkflowVisibility.PUBLIC);
        assertThat(workflowDTO.isUseForProject()).isTrue();
    }

    @Test
    public void shouldFindWorkflowsSuccessfully() {
        // When: Retrieving workflows with pagination
        Page<WorkflowDTO> workflowsPage =
                workflowService.findWorkflows(Optional.empty(), Pageable.unpaged());

        // Then: Verify workflows are returned successfully
        assertThat(workflowsPage).isNotNull();
        assertThat(workflowsPage.getContent()).isNotEmpty();

        // Verify some expected workflows are present
        List<Long> expectedWorkflowIds = List.of(1L, 2L, 3L, 4L, 5L);
        List<Long> actualWorkflowIds =
                workflowsPage.getContent().stream()
                        .map(WorkflowDTO::getId)
                        .collect(Collectors.toList());

        assertThat(actualWorkflowIds).containsAnyElementsOf(expectedWorkflowIds);
    }

    @Test
    public void shouldUpdateWorkflowDetailedSuccessfully() {
        // Given: Get an existing workflow detail
        WorkflowDetailedDTO workflowDetail = workflowService.getWorkflowDetail(1L).get();

        // Update workflow properties
        workflowDetail.setName("Updated Workflow Name");
        workflowDetail.setDescription("Updated description");

        // When: Update the workflow
        WorkflowDetailedDTO updatedWorkflow = workflowService.updateWorkflow(1L, workflowDetail);

        // Then: Verify the workflow is updated successfully
        assertThat(updatedWorkflow).isNotNull();
        assertThat(updatedWorkflow.getName()).isEqualTo("Updated Workflow Name");
        assertThat(updatedWorkflow.getDescription()).isEqualTo("Updated description");

        // Verify the ID remains the same
        assertThat(updatedWorkflow.getId()).isEqualTo(1L);
    }

    @Test
    public void shouldCreateWorkflowByCloning() {
        // Given: Create a workflow DTO for cloning
        WorkflowDTO workflowDTO =
                WorkflowDTO.builder()
                        .name("Cloned Workflow")
                        .requestName("Cloned Request")
                        .description("Cloned from existing workflow")
                        .build();

        // When: Clone an existing workflow
        WorkflowDetailedDTO clonedWorkflow =
                workflowService.createWorkflowByCloning(1L, 2L, workflowDTO);

        // Then: Verify the workflow is cloned successfully
        assertThat(clonedWorkflow).isNotNull();
        assertThat(clonedWorkflow.getName()).isEqualTo("Cloned Workflow");
        assertThat(clonedWorkflow.getRequestName()).isEqualTo("Cloned Request");
        assertThat(clonedWorkflow.getDescription()).isEqualTo("Cloned from existing workflow");

        // Verify the ID is different from the source workflow
        assertThat(clonedWorkflow.getId()).isNotEqualTo(2L);

        // Verify the owner ID is set correctly
        assertThat(clonedWorkflow.getOwnerId()).isEqualTo(1L);

        // Verify states and transitions are cloned
        assertThat(clonedWorkflow.getStates()).isNotEmpty();
        assertThat(clonedWorkflow.getTransitions()).isNotEmpty();
    }

    @Test
    public void shouldDeleteWorkflowSuccessfully() {
        // Test that attempting to delete a workflow used for project throws an exception
        WorkflowDTO projectWorkflow = workflowService.getGlobalWorkflowUsedForProject();

        // Verify the workflow exists and is used for project
        assertThat(projectWorkflow).isNotNull();
        assertThat(projectWorkflow.isUseForProject()).isTrue();

        // When/Then: Attempting to delete a workflow used for project should throw an exception
        assertThatThrownBy(() -> workflowService.deleteWorkflow(projectWorkflow.getId()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot delete workflow is used for project");
    }

    @Test
    public void shouldGetValidTargetWorkflowStatesSuccessfully() {
        // Given: A workflow ID and a state ID
        Long workflowId = 2L; // Refund Process Workflow
        Long stateId = 6L; // "New" state

        // When: Get valid target workflow states
        List<WorkflowStateDTO> targetStates =
                workflowService.getValidTargetWorkflowStates(workflowId, stateId, false);

        // Then: Verify valid target states are returned
        assertThat(targetStates).isNotEmpty();

        // Verify the returned states are valid targets based on transitions
        // For the "New" state in the Refund Process Workflow, the valid target should be "Request
        // Evidence"
        assertThat(targetStates)
                .extracting(WorkflowStateDTO::getId, WorkflowStateDTO::getStateName)
                .contains(tuple(7L, "Request Evidence"));

        // Verify the source state is not included when includeSelf is false
        assertThat(targetStates).extracting(WorkflowStateDTO::getId).doesNotContain(stateId);

        // Test with includeSelf = true
        List<WorkflowStateDTO> targetStatesWithSelf =
                workflowService.getValidTargetWorkflowStates(workflowId, stateId, true);

        // Verify the source state is included when includeSelf is true
        assertThat(targetStatesWithSelf).extracting(WorkflowStateDTO::getId).contains(stateId);
    }

    @Test
    public void shouldGetInitialStatesOfWorkflowSuccessfully() {
        // Given: A workflow ID
        Long workflowId = 2L; // Refund Process Workflow

        // When: Get initial states of the workflow
        List<WorkflowStateDTO> initialStates =
                workflowService.getInitialStatesOfWorkflow(workflowId);

        // Then: Verify initial states are returned
        assertThat(initialStates).isNotEmpty();

        // Verify the returned states are marked as initial
        assertThat(initialStates).allMatch(WorkflowStateDTO::getIsInitial);

        // Verify the expected initial state is present
        // For the Refund Process Workflow, the initial state should be "New"
        assertThat(initialStates)
                .extracting(WorkflowStateDTO::getId, WorkflowStateDTO::getStateName)
                .contains(tuple(6L, "New"));
    }

    @Test
    public void shouldFindProjectWorkflowByTeamSuccessfully() {
        // Given: A team ID
        Long teamId = 1L;

        // When: Find project workflow by team
        Optional<WorkflowDetailedDTO> projectWorkflow =
                workflowService.findProjectWorkflowByTeam(teamId);

        // Then: Verify project workflow is returned
        assertThat(projectWorkflow).isPresent();

        // Verify the workflow is marked for project use
        assertThat(projectWorkflow.get().isUseForProject()).isTrue();

        // Test with non-existent team
        Optional<WorkflowDetailedDTO> nonExistentTeamWorkflow =
                workflowService.findProjectWorkflowByTeam(999L);

        // Verify no workflow is returned for non-existent team
        assertThat(nonExistentTeamWorkflow).isEmpty();
    }
}
