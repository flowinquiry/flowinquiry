package io.flowinquiry.modules.teams.service;

import static io.flowinquiry.query.QueryUtils.createSpecification;

import io.flowinquiry.exceptions.ResourceConstraintException;
import io.flowinquiry.exceptions.ResourceNotFoundException;
import io.flowinquiry.modules.teams.domain.Team;
import io.flowinquiry.modules.teams.domain.TeamWorkflowSelection;
import io.flowinquiry.modules.teams.domain.Workflow;
import io.flowinquiry.modules.teams.domain.WorkflowState;
import io.flowinquiry.modules.teams.domain.WorkflowTransition;
import io.flowinquiry.modules.teams.domain.WorkflowVisibility;
import io.flowinquiry.modules.teams.repository.TeamRepository;
import io.flowinquiry.modules.teams.repository.TeamWorkflowSelectionRepository;
import io.flowinquiry.modules.teams.repository.TicketRepository;
import io.flowinquiry.modules.teams.repository.WorkflowRepository;
import io.flowinquiry.modules.teams.repository.WorkflowStateRepository;
import io.flowinquiry.modules.teams.repository.WorkflowTransitionRepository;
import io.flowinquiry.modules.teams.service.dto.WorkflowDTO;
import io.flowinquiry.modules.teams.service.dto.WorkflowDetailedDTO;
import io.flowinquiry.modules.teams.service.dto.WorkflowStateDTO;
import io.flowinquiry.modules.teams.service.dto.WorkflowTransitionDTO;
import io.flowinquiry.modules.teams.service.mapper.WorkflowMapper;
import io.flowinquiry.modules.teams.service.mapper.WorkflowStateMapper;
import io.flowinquiry.modules.teams.service.mapper.WorkflowTransitionMapper;
import io.flowinquiry.query.QueryDTO;
import jakarta.persistence.EntityNotFoundException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class WorkflowService {

    private final WorkflowRepository workflowRepository;

    private final WorkflowStateRepository workflowStateRepository;

    private final WorkflowTransitionRepository workflowTransitionRepository;

    private final TeamWorkflowSelectionRepository teamWorkflowSelectionRepository;

    private final TeamRepository teamRepository;

    private final TicketRepository ticketRepository;

    private final WorkflowMapper workflowMapper;

    private final WorkflowStateMapper workflowStateMapper;

    private final WorkflowTransitionMapper workflowTransitionMapper;

    public WorkflowService(
            WorkflowRepository workflowRepository,
            WorkflowStateRepository workflowStateRepository,
            WorkflowTransitionRepository workflowTransitionRepository,
            TeamWorkflowSelectionRepository teamWorkflowSelectionRepository,
            TeamRepository teamRepository,
            TicketRepository ticketRepository,
            WorkflowMapper workflowMapper,
            WorkflowStateMapper workflowStateMapper,
            WorkflowTransitionMapper workflowTransitionMapper) {
        this.workflowRepository = workflowRepository;
        this.workflowStateRepository = workflowStateRepository;
        this.workflowTransitionRepository = workflowTransitionRepository;
        this.teamWorkflowSelectionRepository = teamWorkflowSelectionRepository;
        this.teamRepository = teamRepository;
        this.ticketRepository = ticketRepository;
        this.workflowMapper = workflowMapper;
        this.workflowStateMapper = workflowStateMapper;
        this.workflowTransitionMapper = workflowTransitionMapper;
    }

    @Transactional(readOnly = true)
    public Optional<WorkflowDTO> getWorkflowById(Long id) {
        return workflowRepository.findById(id).map(workflowMapper::toDto);
    }

    public WorkflowDTO getGlobalWorkflowUsedForProject() {
        List<Workflow> workflows = workflowRepository.findPublicWorkflowsUsedForProjects();
        if (workflows.isEmpty()) {
            throw new ResourceNotFoundException(
                    "Can not find any global workflow could be used for project");
        }
        if (workflows.size() > 1) {
            log.warn(
                    "Found more than one global workflow could be used for project. Get the first one.");
        }
        return workflowMapper.toDto(workflows.getFirst());
    }

    @Transactional
    public WorkflowDTO updateWorkflow(Long id, WorkflowDTO updatedWorkflow) {
        return workflowRepository
                .findById(id)
                .map(
                        existingWorkflow -> {
                            workflowMapper.updateEntity(updatedWorkflow, existingWorkflow);
                            return workflowMapper.toDto(workflowRepository.save(existingWorkflow));
                        })
                .orElseThrow(
                        () -> new ResourceNotFoundException("Workflow not found with id: " + id));
    }

    /**
     * Fetch all workflows associated with a team.
     *
     * @param teamId the ID of the team.
     * @return a list of workflows available for the team.
     */
    public List<WorkflowDTO> getWorkflowsForTeam(Long teamId, Boolean usedForProject) {
        return workflowRepository.findAllWorkflowsByTeam(teamId, usedForProject).stream()
                .map(workflowMapper::toDto)
                .toList();
    }

    public Optional<WorkflowDetailedDTO> getWorkflowDetail(Long workflowId) {
        return workflowRepository
                .findWithDetailsById(workflowId)
                .map(workflowMapper::toDetailedDto);
    }

    @Transactional(readOnly = true)
    public Page<WorkflowDTO> findWorkflows(Optional<QueryDTO> queryDTO, Pageable pageable) {
        Specification<Workflow> spec = createSpecification(queryDTO.orElse(null));
        return workflowRepository.findAll(spec, pageable).map(workflowMapper::toDto);
    }

    @Transactional
    public WorkflowDetailedDTO saveWorkflow(WorkflowDetailedDTO dto) {
        Workflow workflow = workflowMapper.toEntity(dto);

        // Set default values for escalation timeouts if they are null
        if (workflow.getLevel1EscalationTimeout() == null) {
            workflow.setLevel1EscalationTimeout(1000000);
        }
        if (workflow.getLevel2EscalationTimeout() == null) {
            workflow.setLevel2EscalationTimeout(1000000);
        }
        if (workflow.getLevel3EscalationTimeout() == null) {
            workflow.setLevel3EscalationTimeout(1000000);
        }

        // Retrieve the team if ownerId is present, otherwise null
        Team team =
                dto.getOwnerId() != null
                        ? teamRepository
                                .findById(dto.getOwnerId())
                                .orElseThrow(
                                        () ->
                                                new IllegalArgumentException(
                                                        "Team not found with ID: "
                                                                + dto.getOwnerId()))
                        : null;

        // Set the owner if the team exists
        workflow.setOwner(team);

        // Save the workflow
        Workflow savedWorkflow = workflowRepository.save(workflow);

        // If ownerId is not null, create a TeamWorkflowSelection entry
        if (team != null) {
            TeamWorkflowSelection teamWorkflowSelection = new TeamWorkflowSelection();
            teamWorkflowSelection.setTeam(team);
            teamWorkflowSelection.setWorkflow(savedWorkflow);
            teamWorkflowSelectionRepository.save(teamWorkflowSelection);
        }

        // Save states one by one to maintain ID mapping
        Map<Long, Long> idMapping = new HashMap<>(); // Old state ID -> New state ID mapping
        List<WorkflowState> savedStates = new ArrayList<>();
        for (WorkflowStateDTO stateDto : dto.getStates()) {
            WorkflowState state = workflowStateMapper.toEntity(stateDto);
            Long oldId = state.getId(); // Keep track of the old ID
            state.setId(null); // Set ID to null for Hibernate to generate a new ID
            state.setWorkflow(savedWorkflow); // Associate the state with the saved workflow
            WorkflowState savedState = workflowStateRepository.save(state); // Save the state
            idMapping.put(oldId, savedState.getId()); // Map old ID to the new ID
            savedStates.add(savedState);
        }

        // Save transitions using the new state IDs
        List<WorkflowTransition> transitions =
                dto.getTransitions().stream()
                        .map(
                                transitionDto -> {
                                    WorkflowTransition transition =
                                            workflowTransitionMapper.toEntity(transitionDto);
                                    transition.setWorkflow(savedWorkflow);

                                    // Map source and target state IDs to the newly saved states
                                    WorkflowState sourceState =
                                            savedStates.stream()
                                                    .filter(
                                                            state ->
                                                                    state.getId()
                                                                            .equals(
                                                                                    idMapping.get(
                                                                                            transitionDto
                                                                                                    .getSourceStateId())))
                                                    .findFirst()
                                                    .orElse(null);
                                    WorkflowState targetState =
                                            savedStates.stream()
                                                    .filter(
                                                            state ->
                                                                    state.getId()
                                                                            .equals(
                                                                                    idMapping.get(
                                                                                            transitionDto
                                                                                                    .getTargetStateId())))
                                                    .findFirst()
                                                    .orElse(null);

                                    transition.setSourceState(sourceState);
                                    transition.setTargetState(targetState);

                                    return transition;
                                })
                        .collect(Collectors.toList());
        workflowTransitionRepository.saveAll(transitions);

        return workflowMapper.toDetailedDto(savedWorkflow);
    }

    @Transactional
    public WorkflowDetailedDTO updateWorkflow(
            Long workflowId, WorkflowDetailedDTO updatedWorkflowDTO) {
        // Step 1: Save the workflow details
        Workflow workflowEntity =
                workflowRepository
                        .findById(workflowId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Workflow not found with id: " + workflowId));
        workflowMapper.updateEntity(updatedWorkflowDTO, workflowEntity);
        Workflow savedWorkflowEntity = workflowRepository.save(workflowEntity);

        // Step 2: Handle states
        List<WorkflowState> existingStates = workflowStateRepository.findByWorkflowId(workflowId);
        Map<Long, WorkflowState> existingStateMap =
                existingStates.stream()
                        .collect(Collectors.toMap(WorkflowState::getId, Function.identity()));

        // Identify states to delete
        List<Long> stateIdsInDto =
                updatedWorkflowDTO.getStates().stream()
                        .map(WorkflowStateDTO::getId)
                        .filter(Objects::nonNull)
                        .toList();

        List<WorkflowState> statesToDelete =
                existingStates.stream()
                        .filter(state -> !stateIdsInDto.contains(state.getId()))
                        .toList();

        // Delete transitions associated with deleted states
        List<Long> deletedStateIds = statesToDelete.stream().map(WorkflowState::getId).toList();
        if (!deletedStateIds.isEmpty()) {
            workflowTransitionRepository.deleteBySourceStateIdInOrTargetStateIdIn(
                    deletedStateIds, deletedStateIds);
        }

        // Delete the states
        workflowStateRepository.deleteAll(statesToDelete);

        // Save or update states
        Map<Long, WorkflowState> stateMappingByClientId = new HashMap<>();
        List<WorkflowState> newStates =
                updatedWorkflowDTO.getStates().stream()
                        .map(
                                stateDTO -> {
                                    WorkflowState stateEntity =
                                            existingStateMap.get(stateDTO.getId());
                                    if (stateEntity == null) {
                                        // New state
                                        stateEntity = workflowStateMapper.toEntity(stateDTO);
                                        stateEntity.setWorkflow(savedWorkflowEntity);
                                        stateMappingByClientId.put(
                                                stateDTO.getId(),
                                                stateEntity); // Track mapping using client-provided
                                        // ID
                                    } else {
                                        // Update existing state
                                        workflowStateMapper.updateEntity(stateDTO, stateEntity);
                                        stateMappingByClientId.put(
                                                stateDTO.getId(),
                                                stateEntity); // Map existing IDs as well
                                    }
                                    return stateEntity;
                                })
                        .toList();

        // Save all states
        newStates = workflowStateRepository.saveAll(newStates);

        // Update the stateMappingByClientId with the saved database IDs for new states
        newStates.forEach(
                savedState -> {
                    updatedWorkflowDTO.getStates().stream()
                            .filter(
                                    stateDTO ->
                                            savedState
                                                    .getStateName()
                                                    .equals(stateDTO.getStateName()))
                            .map(WorkflowStateDTO::getId)
                            .findFirst()
                            .ifPresent(
                                    clientId -> stateMappingByClientId.put(clientId, savedState));
                });

        // Step 3: Handle transitions
        List<WorkflowTransition> existingTransitions =
                workflowTransitionRepository.findByWorkflowId(workflowId);
        Map<Long, WorkflowTransition> existingTransitionMap =
                existingTransitions.stream()
                        .collect(Collectors.toMap(WorkflowTransition::getId, Function.identity()));

        // Identify transitions to delete
        List<Long> transitionIdsInDto =
                updatedWorkflowDTO.getTransitions().stream()
                        .map(WorkflowTransitionDTO::getId)
                        .filter(Objects::nonNull)
                        .toList();

        List<WorkflowTransition> transitionsToDelete =
                existingTransitions.stream()
                        .filter(transition -> !transitionIdsInDto.contains(transition.getId()))
                        .toList();

        // Delete the transitions
        workflowTransitionRepository.deleteAll(transitionsToDelete);

        // Save or update transitions
        List<WorkflowTransition> newTransitions =
                updatedWorkflowDTO.getTransitions().stream()
                        .map(
                                transitionDTO -> {
                                    WorkflowTransition transitionEntity =
                                            existingTransitionMap.get(transitionDTO.getId());
                                    if (transitionEntity == null) {
                                        // New transition
                                        transitionEntity =
                                                workflowTransitionMapper.toEntity(transitionDTO);
                                        transitionEntity.setWorkflow(savedWorkflowEntity);
                                    } else {
                                        // Update existing transition
                                        workflowTransitionMapper.updateEntity(
                                                transitionDTO, transitionEntity);
                                    }

                                    // Update source and target state references
                                    if (transitionDTO.getSourceStateId() != null) {
                                        transitionEntity.setSourceState(
                                                stateMappingByClientId.get(
                                                        transitionDTO.getSourceStateId()));
                                    }
                                    if (transitionDTO.getTargetStateId() != null) {
                                        transitionEntity.setTargetState(
                                                stateMappingByClientId.get(
                                                        transitionDTO.getTargetStateId()));
                                    }

                                    return transitionEntity;
                                })
                        .toList();
        newTransitions = workflowTransitionRepository.saveAll(newTransitions);

        // Step 4: Return the updated workflow
        WorkflowDetailedDTO updatedWorkflow = workflowMapper.toDetailedDto(workflowEntity);
        updatedWorkflow.setStates(newStates.stream().map(workflowStateMapper::toDto).toList());
        updatedWorkflow.setTransitions(
                newTransitions.stream().map(workflowTransitionMapper::toDto).toList());

        return updatedWorkflow;
    }

    /**
     * List global workflows not linked to the given team.
     *
     * @param teamId the ID of the team
     * @return List of WorkflowDTOs representing the global workflows
     */
    public List<WorkflowDTO> listGlobalWorkflowsNotLinkedToTeam(Long teamId) {
        return workflowRepository.findGlobalWorkflowsNotLinkedToTeam(teamId).stream()
                .map(workflowMapper::toDto)
                .toList();
    }

    @Transactional
    public WorkflowDetailedDTO createWorkflowByReference(
            Long teamId, Long referencedWorkflowId, WorkflowDTO workflowDTO) {
        // Fetch the referenced workflow
        Workflow referencedWorkflow =
                workflowRepository
                        .findById(referencedWorkflowId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Referenced workflow not found with id: "
                                                        + referencedWorkflowId));

        // Validate that the referenced workflow is either PUBLIC or TEAM visibility
        if (!referencedWorkflow.getVisibility().equals(WorkflowVisibility.PUBLIC)
                && !referencedWorkflow.getVisibility().equals(WorkflowVisibility.TEAM)) {
            throw new IllegalStateException("Only PUBLIC or TEAM workflows can be referenced.");
        }

        // Create the new workflow
        Workflow newWorkflow = new Workflow();
        newWorkflow.setName(workflowDTO.getName());
        newWorkflow.setRequestName(workflowDTO.getRequestName());
        newWorkflow.setDescription(workflowDTO.getDescription());
        newWorkflow.setOwner(Team.builder().id(teamId).build());
        newWorkflow.setVisibility(
                WorkflowVisibility.PRIVATE); // New workflows default to PRIVATE visibility
        newWorkflow.setClonedFromGlobal(false); // It's a reference, not a clone
        newWorkflow.setLevel1EscalationTimeout(referencedWorkflow.getLevel1EscalationTimeout());
        newWorkflow.setLevel2EscalationTimeout(referencedWorkflow.getLevel2EscalationTimeout());
        newWorkflow.setLevel3EscalationTimeout(referencedWorkflow.getLevel3EscalationTimeout());
        workflowRepository.save(newWorkflow);

        // Link the new workflow with the team in fw_team_workflow_selection
        TeamWorkflowSelection teamWorkflowSelection = new TeamWorkflowSelection();
        teamWorkflowSelection.setTeam(Team.builder().id(teamId).build());
        teamWorkflowSelection.setWorkflow(Workflow.builder().id(newWorkflow.getId()).build());
        teamWorkflowSelectionRepository.save(teamWorkflowSelection);

        // Fetch states and transitions of the referenced workflow
        List<WorkflowState> referencedStates =
                workflowStateRepository.findByWorkflowId(referencedWorkflow.getId());
        List<WorkflowTransition> referencedTransitions =
                workflowTransitionRepository.findByWorkflowId(referencedWorkflow.getId());

        // Map the referenced workflow to WorkflowDetailedDTO
        WorkflowDetailedDTO result = workflowMapper.toDetailedDto(newWorkflow);
        result.setStates(referencedStates.stream().map(workflowStateMapper::toDto).toList());
        result.setTransitions(
                referencedTransitions.stream().map(workflowTransitionMapper::toDto).toList());

        return result;
    }

    @Transactional
    public WorkflowDetailedDTO createWorkflowByCloning(
            Long teamId, Long workflowToCloneId, WorkflowDTO workflowDTO) {
        // Fetch the workflow to be cloned
        Workflow workflowToClone =
                workflowRepository
                        .findById(workflowToCloneId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Workflow to clone not found with id: "
                                                        + workflowToCloneId));

        // Validate that the workflow to clone is either PUBLIC or TEAM visibility
        if (!workflowToClone.getVisibility().equals(WorkflowVisibility.PUBLIC)
                && !workflowToClone.getVisibility().equals(WorkflowVisibility.TEAM)) {
            throw new IllegalStateException("Only PUBLIC or TEAM workflows can be cloned.");
        }

        // Step 1: Create the new workflow
        Workflow newWorkflow = new Workflow();
        newWorkflow.setName(workflowDTO.getName());
        newWorkflow.setRequestName(workflowDTO.getRequestName());
        newWorkflow.setDescription(workflowDTO.getDescription());
        newWorkflow.setOwner(Team.builder().id(teamId).build());
        newWorkflow.setVisibility(
                WorkflowVisibility.PRIVATE); // Cloned workflows default to PRIVATE visibility
        newWorkflow.setClonedFromGlobal(true); // Mark as cloned
        newWorkflow.setUseForProject(workflowToClone.isUseForProject());
        newWorkflow.setLevel1EscalationTimeout(workflowToClone.getLevel1EscalationTimeout());
        newWorkflow.setLevel2EscalationTimeout(workflowToClone.getLevel2EscalationTimeout());
        newWorkflow.setLevel3EscalationTimeout(workflowToClone.getLevel3EscalationTimeout());
        workflowRepository.save(newWorkflow);

        // Link the new workflow with the team in fw_team_workflow_selection
        TeamWorkflowSelection teamWorkflowSelection = new TeamWorkflowSelection();
        teamWorkflowSelection.setTeam(Team.builder().id(teamId).build());
        teamWorkflowSelection.setWorkflow(Workflow.builder().id(newWorkflow.getId()).build());
        teamWorkflowSelectionRepository.save(teamWorkflowSelection);

        // Step 2: Clone the states
        List<WorkflowState> statesToClone =
                workflowStateRepository.findByWorkflowId(workflowToClone.getId());
        Map<Long, WorkflowState> clonedStatesMap = new HashMap<>();
        for (WorkflowState state : statesToClone) {
            WorkflowState clonedState = new WorkflowState();
            clonedState.setWorkflow(newWorkflow);
            clonedState.setStateName(state.getStateName());
            clonedState.setIsInitial(state.getIsInitial());
            clonedState.setIsFinal(state.getIsFinal());
            workflowStateRepository.save(clonedState);
            clonedStatesMap.put(state.getId(), clonedState); // Map old state ID to new state
        }

        // Step 3: Clone the transitions
        List<WorkflowTransition> transitionsToClone =
                workflowTransitionRepository.findByWorkflowId(workflowToClone.getId());
        for (WorkflowTransition transition : transitionsToClone) {
            WorkflowTransition clonedTransition = new WorkflowTransition();
            clonedTransition.setWorkflow(newWorkflow);
            clonedTransition.setSourceState(
                    clonedStatesMap.get(transition.getSourceState().getId()));
            clonedTransition.setTargetState(
                    clonedStatesMap.get(transition.getTargetState().getId()));
            clonedTransition.setEventName(transition.getEventName());
            clonedTransition.setSlaDuration(transition.getSlaDuration());
            clonedTransition.setEscalateOnViolation(transition.isEscalateOnViolation());
            workflowTransitionRepository.save(clonedTransition);
        }

        // Step 4: Map the cloned workflow to WorkflowDetailedDTO
        WorkflowDetailedDTO clonedWorkflow = workflowMapper.toDetailedDto(newWorkflow);
        clonedWorkflow.setStates(
                clonedStatesMap.values().stream().map(workflowStateMapper::toDto).toList());
        clonedWorkflow.setTransitions(
                transitionsToClone.stream()
                        .map(
                                transition -> {
                                    WorkflowTransitionDTO dto =
                                            workflowTransitionMapper.toDto(transition);
                                    dto.setSourceStateId(
                                            clonedStatesMap
                                                    .get(transition.getSourceState().getId())
                                                    .getId());
                                    dto.setTargetStateId(
                                            clonedStatesMap
                                                    .get(transition.getTargetState().getId())
                                                    .getId());
                                    return dto;
                                })
                        .toList());

        return clonedWorkflow;
    }

    @Transactional
    public void deleteWorkflow(Long workflowId) {
        Workflow workflow =
                workflowRepository
                        .findById(workflowId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Workflow not found with id: " + workflowId));
        if (workflow.isUseForProject()) {
            throw new IllegalArgumentException("Cannot delete workflow is used for project");
        }

        // Check if there are any active ticket associated with this workflow
        boolean hasActiveRequests =
                ticketRepository.existsByWorkflowIdAndIsDeletedFalse(workflowId);
        if (hasActiveRequests) {
            throw new ResourceConstraintException("Cannot delete a workflow with active tickets.");
        }

        workflowStateRepository.deleteByWorkflowId(workflowId);
        workflowTransitionRepository.deleteByWorkflowId(workflowId);
        teamWorkflowSelectionRepository.deleteByWorkflowId(workflowId);

        workflowRepository.delete(workflow);
    }

    /**
     * Deletes a workflow by its team ID and workflow ID.
     *
     * @param teamId The ID of the team.
     * @param workflowId The ID of the workflow.
     * @throws EntityNotFoundException if the workflow does not belong to the team or does not
     *     exist.
     */
    public void deleteWorkflowByTeam(Long teamId, Long workflowId) {
        // Check if the workflow is linked to the team in fw_team_workflow_selection
        boolean exists =
                teamWorkflowSelectionRepository.existsByTeamIdAndWorkflowId(teamId, workflowId);

        if (!exists) {
            throw new EntityNotFoundException(
                    "Workflow does not belong to the specified team or does not exist.");
        }

        // Retrieve the workflow by ID
        Workflow workflow =
                workflowRepository
                        .findById(workflowId)
                        .orElseThrow(() -> new EntityNotFoundException("Workflow not found."));

        if (workflow.isUseForProject()) {
            throw new IllegalArgumentException("Cannot delete workflow is used for project");
        }

        // Check if the ownerId matches the teamId
        if (workflow.getOwner() != null && workflow.getOwner().getId().equals(teamId)) {
            boolean hasActiveRequests =
                    ticketRepository.existsByWorkflowIdAndIsDeletedFalse(workflowId);
            if (hasActiveRequests) {
                throw new ResourceConstraintException(
                        "Cannot delete a workflow with active tickets.");
            }
            // Delete the workflow
            workflowStateRepository.deleteByWorkflowId(workflowId);
            workflowTransitionRepository.deleteByWorkflowId(workflowId);
            workflowRepository.deleteById(workflowId);
        }

        // Delete the workflow from fw_team_workflow_selection
        teamWorkflowSelectionRepository.deleteByTeamIdAndWorkflowId(teamId, workflowId);
    }

    /**
     * Retrieves all valid target workflow states for a given workflow and current state, optionally
     * including the current state itself.
     *
     * @param workflowId the ID of the workflow
     * @param workflowStateId the ID of the current workflow state
     * @param includeSelf whether to include the current state in the results
     * @return a sorted list of WorkflowState objects
     */
    public List<WorkflowStateDTO> getValidTargetWorkflowStates(
            Long workflowId, Long workflowStateId, boolean includeSelf) {
        // Find the current state
        WorkflowState currentState =
                workflowStateRepository
                        .findById(workflowStateId)
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "WorkflowState not found for ID: "
                                                        + workflowStateId));

        // Find valid target states
        List<WorkflowState> targetStates =
                workflowTransitionRepository.findValidTargetStates(workflowId, workflowStateId);

        // Add current state if includeSelf is true
        if (includeSelf) {
            targetStates.add(currentState);
        }

        // Sort by isFinal, id, and stateName
        targetStates.sort(
                Comparator.comparing(WorkflowState::getIsFinal)
                        .thenComparing(WorkflowState::getId)
                        .thenComparing(WorkflowState::getStateName));
        return targetStates.stream().map(workflowStateMapper::toDto).toList();
    }

    public List<WorkflowStateDTO> getInitialStatesOfWorkflow(Long workflowId) {
        return workflowStateRepository.findInitialStatesByWorkflowId(workflowId).stream()
                .map(workflowStateMapper::toDto)
                .toList();
    }

    public Optional<WorkflowDetailedDTO> findProjectWorkflowByTeam(Long teamId) {
        return workflowRepository
                .findProjectWorkflowByTeam(teamId)
                .map(workflowMapper::toDetailedDto);
    }
}
