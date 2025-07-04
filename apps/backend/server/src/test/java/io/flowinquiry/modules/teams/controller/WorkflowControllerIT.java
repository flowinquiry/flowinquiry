package io.flowinquiry.modules.teams.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.flowinquiry.IntegrationTest;
import io.flowinquiry.modules.teams.domain.Team;
import io.flowinquiry.modules.teams.domain.Workflow;
import io.flowinquiry.modules.teams.domain.WorkflowState;
import io.flowinquiry.modules.teams.domain.WorkflowVisibility;
import io.flowinquiry.modules.teams.repository.TeamRepository;
import io.flowinquiry.modules.teams.repository.WorkflowRepository;
import io.flowinquiry.modules.teams.repository.WorkflowStateRepository;
import io.flowinquiry.modules.teams.repository.WorkflowTransitionRepository;
import io.flowinquiry.modules.teams.service.WorkflowService;
import io.flowinquiry.modules.teams.service.dto.WorkflowDTO;
import io.flowinquiry.modules.teams.service.dto.WorkflowDetailedDTO;
import io.flowinquiry.modules.teams.service.dto.WorkflowStateDTO;
import io.flowinquiry.modules.teams.service.dto.WorkflowTransitionDTO;
import io.flowinquiry.modules.teams.service.mapper.WorkflowMapper;
import io.flowinquiry.modules.usermanagement.AuthoritiesConstants;
import io.flowinquiry.modules.usermanagement.controller.WithMockFwUser;
import io.flowinquiry.query.Filter;
import io.flowinquiry.query.FilterOperator;
import io.flowinquiry.query.QueryDTO;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@AutoConfigureMockMvc
@WithMockFwUser(authorities = AuthoritiesConstants.ADMIN)
public class WorkflowControllerIT {

    private static final String DEFAULT_NAME = "Test Workflow";
    private static final String UPDATED_NAME = "Updated Test Workflow";
    private static final String DEFAULT_DESCRIPTION = "Test workflow description";
    private static final String UPDATED_DESCRIPTION = "Updated test workflow description";
    private static final String DEFAULT_REQUEST_NAME = "Test Request";
    private static final String UPDATED_REQUEST_NAME = "Updated Test Request";
    private static final WorkflowVisibility DEFAULT_VISIBILITY = WorkflowVisibility.PRIVATE;
    private static final WorkflowVisibility UPDATED_VISIBILITY = WorkflowVisibility.PUBLIC;
    private static final Integer DEFAULT_LEVEL1_TIMEOUT = 3600;
    private static final Integer UPDATED_LEVEL1_TIMEOUT = 7200;
    private static final Integer DEFAULT_LEVEL2_TIMEOUT = 7200;
    private static final Integer UPDATED_LEVEL2_TIMEOUT = 10800;
    private static final Integer DEFAULT_LEVEL3_TIMEOUT = 10800;
    private static final Integer UPDATED_LEVEL3_TIMEOUT = 14400;
    private static final String DEFAULT_TAGS = "test,workflow";
    private static final String UPDATED_TAGS = "updated,test,workflow";
    private static final boolean DEFAULT_USE_FOR_PROJECT = false;
    private static final boolean UPDATED_USE_FOR_PROJECT = true;

    @Autowired private WorkflowRepository workflowRepository;

    @Autowired private WorkflowStateRepository workflowStateRepository;

    @Autowired private WorkflowTransitionRepository workflowTransitionRepository;

    @Autowired private TeamRepository teamRepository;

    @Autowired private WorkflowMapper workflowMapper;

    @Autowired private WorkflowService workflowService;

    @Autowired private EntityManager em;

    @Autowired private MockMvc restWorkflowMockMvc;

    @Autowired private ObjectMapper om;

    private Workflow workflow;
    private Team team;

    @BeforeEach
    public void initTest() {
        team = teamRepository.findById(1L).orElseThrow();
        workflow = createEntity(em);
    }

    /**
     * Create an entity for this test.
     *
     * <p>This is a static method, as tests for other entities might also need it, if they test an
     * entity which requires the current entity.
     */
    public Workflow createEntity(EntityManager em) {
        Workflow workflow =
                Workflow.builder()
                        .name(DEFAULT_NAME)
                        .description(DEFAULT_DESCRIPTION)
                        .requestName(DEFAULT_REQUEST_NAME)
                        .visibility(DEFAULT_VISIBILITY)
                        .level1EscalationTimeout(DEFAULT_LEVEL1_TIMEOUT)
                        .level2EscalationTimeout(DEFAULT_LEVEL2_TIMEOUT)
                        .level3EscalationTimeout(DEFAULT_LEVEL3_TIMEOUT)
                        .tags(DEFAULT_TAGS)
                        .useForProject(DEFAULT_USE_FOR_PROJECT)
                        .clonedFromGlobal(false)
                        .build();

        workflow.setOwner(team);

        return workflow;
    }

    @Test
    @Transactional
    void findWorkflows() throws Exception {
        // Initialize the database
        workflowRepository.saveAndFlush(workflow);

        // Search for all workflows
        restWorkflowMockMvc
                .perform(
                        post("/api/workflows/search")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE));
    }

    @Test
    @Transactional
    void findWorkflowsWithQuery() throws Exception {
        // Initialize the database
        workflowRepository.saveAndFlush(workflow);

        // Create a query DTO with a filter for the workflow name
        QueryDTO queryDTO = new QueryDTO();
        Filter nameFilter = new Filter("name", FilterOperator.EQ, DEFAULT_NAME);
        queryDTO.setFilters(List.of(nameFilter));

        // Search for workflows with the query
        restWorkflowMockMvc
                .perform(
                        post("/api/workflows/search")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(Optional.of(queryDTO))))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.content.[*].name").value(hasItem(DEFAULT_NAME)));
    }

    @Test
    @Transactional
    void getWorkflowById() throws Exception {
        // Initialize the database
        workflowRepository.saveAndFlush(workflow);

        // Get the workflow
        restWorkflowMockMvc
                .perform(get("/api/workflows/{id}", workflow.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.id").value(workflow.getId().intValue()))
                .andExpect(jsonPath("$.name").value(DEFAULT_NAME))
                .andExpect(jsonPath("$.description").value(DEFAULT_DESCRIPTION))
                .andExpect(jsonPath("$.requestName").value(DEFAULT_REQUEST_NAME))
                .andExpect(jsonPath("$.visibility").value(DEFAULT_VISIBILITY.toString()));
    }

    @Test
    @Transactional
    void getNonExistingWorkflow() throws Exception {
        // Get the workflow
        restWorkflowMockMvc
                .perform(get("/api/workflows/{id}", Long.MAX_VALUE))
                .andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void updateWorkflow() throws Exception {
        // Initialize the database
        workflowRepository.saveAndFlush(workflow);
        int databaseSizeBeforeUpdate = workflowRepository.findAll().size();

        // Update the workflow
        Workflow updatedWorkflow = workflowRepository.findById(workflow.getId()).orElseThrow();

        WorkflowDTO workflowDTO = workflowMapper.toDto(updatedWorkflow);
        workflowDTO.setName(UPDATED_NAME);
        workflowDTO.setDescription(UPDATED_DESCRIPTION);
        workflowDTO.setRequestName(UPDATED_REQUEST_NAME);
        workflowDTO.setVisibility(UPDATED_VISIBILITY);
        workflowDTO.setLevel1EscalationTimeout(UPDATED_LEVEL1_TIMEOUT);
        workflowDTO.setLevel2EscalationTimeout(UPDATED_LEVEL2_TIMEOUT);
        workflowDTO.setLevel3EscalationTimeout(UPDATED_LEVEL3_TIMEOUT);
        workflowDTO.setTags(UPDATED_TAGS);
        workflowDTO.setUseForProject(UPDATED_USE_FOR_PROJECT);

        restWorkflowMockMvc
                .perform(
                        put("/api/workflows/{id}", workflow.getId())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(workflowDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(workflow.getId().intValue()))
                .andExpect(jsonPath("$.name").value(UPDATED_NAME))
                .andExpect(jsonPath("$.description").value(UPDATED_DESCRIPTION))
                .andExpect(jsonPath("$.requestName").value(UPDATED_REQUEST_NAME))
                .andExpect(jsonPath("$.visibility").value(UPDATED_VISIBILITY.toString()));

        // Validate the Workflow in the database
        List<Workflow> workflowList = workflowRepository.findAll();
        assertThat(workflowList).hasSize(databaseSizeBeforeUpdate);
        Workflow testWorkflow =
                workflowList.stream()
                        .filter(w -> w.getId().equals(workflow.getId()))
                        .findFirst()
                        .orElseThrow();
        assertThat(testWorkflow.getName()).isEqualTo(UPDATED_NAME);
        assertThat(testWorkflow.getDescription()).isEqualTo(UPDATED_DESCRIPTION);
        assertThat(testWorkflow.getRequestName()).isEqualTo(UPDATED_REQUEST_NAME);
        assertThat(testWorkflow.getVisibility()).isEqualTo(UPDATED_VISIBILITY);
        assertThat(testWorkflow.getLevel1EscalationTimeout()).isEqualTo(UPDATED_LEVEL1_TIMEOUT);
        assertThat(testWorkflow.getLevel2EscalationTimeout()).isEqualTo(UPDATED_LEVEL2_TIMEOUT);
        assertThat(testWorkflow.getLevel3EscalationTimeout()).isEqualTo(UPDATED_LEVEL3_TIMEOUT);
        assertThat(testWorkflow.getTags()).isEqualTo(UPDATED_TAGS);
        assertThat(testWorkflow.isUseForProject()).isEqualTo(UPDATED_USE_FOR_PROJECT);
    }

    @Test
    @Transactional
    void deleteWorkflow() throws Exception {
        // Initialize the database
        workflowRepository.saveAndFlush(workflow);
        int databaseSizeBeforeDelete = workflowRepository.findAll().size();

        // Delete the workflow
        restWorkflowMockMvc
                .perform(
                        delete("/api/workflows/{id}", workflow.getId())
                                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());

        // Validate the database contains one less item
        List<Workflow> workflowList = workflowRepository.findAll();
        assertThat(workflowList).hasSize(databaseSizeBeforeDelete - 1);
    }

    @Test
    @Transactional
    void deleteTeamWorkflow() throws Exception {
        // Create a workflow that's properly associated with the team
        Workflow existingWorkflow =
                workflowRepository.findById(2L).orElseThrow(); // Refund Process Workflow

        // Verify the workflow is associated with the team
        List<WorkflowDTO> teamWorkflowsBefore =
                workflowService.getWorkflowsForTeam(team.getId(), null);
        assertThat(teamWorkflowsBefore).anyMatch(w -> w.getId().equals(existingWorkflow.getId()));

        // Delete the team workflow
        restWorkflowMockMvc
                .perform(
                        delete(
                                        "/api/workflows/{workflowId}/teams/{teamId}",
                                        existingWorkflow.getId(),
                                        team.getId())
                                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        // Validate the workflow is no longer associated with the team
        List<WorkflowDTO> teamWorkflowsAfter =
                workflowService.getWorkflowsForTeam(team.getId(), null);
        assertThat(teamWorkflowsAfter).noneMatch(w -> w.getId().equals(existingWorkflow.getId()));
    }

    @Test
    @Transactional
    void getWorkflowsByTeam() throws Exception {
        // Initialize the database
        workflowRepository.saveAndFlush(workflow);

        // Get workflows by team
        restWorkflowMockMvc
                .perform(get("/api/workflows/teams/{teamId}", team.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @Transactional
    void getGlobalWorkflowsNotLinkedToTeam() throws Exception {
        // Get global workflows not linked to team
        restWorkflowMockMvc
                .perform(
                        get(
                                "/api/workflows/teams/{teamId}/global-workflows-not-linked-yet",
                                team.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @Transactional
    void getValidTargetStates() throws Exception {
        // Get an existing workflow with states and transitions
        Workflow existingWorkflow =
                workflowRepository.findById(2L).orElseThrow(); // Refund Process Workflow
        WorkflowState sourceState =
                workflowStateRepository.findById(6L).orElseThrow(); // "New" state

        // Get valid target states
        restWorkflowMockMvc
                .perform(
                        get("/api/workflows/{workflowId}/transitions", existingWorkflow.getId())
                                .param("workflowStateId", sourceState.getId().toString())
                                .param("includeSelf", "false"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].stateName").value("Request Evidence"));
    }

    @Test
    @Transactional
    void getInitialStatesOfWorkflow() throws Exception {
        // Get an existing workflow
        Workflow existingWorkflow =
                workflowRepository.findById(2L).orElseThrow(); // Refund Process Workflow

        // Get initial states
        restWorkflowMockMvc
                .perform(
                        get("/api/workflows/{workflowId}/initial-states", existingWorkflow.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].stateName").value("New"))
                .andExpect(jsonPath("$[0].isInitial").value(true));
    }

    @Test
    @Transactional
    void getProjectWorkflowByTeam() throws Exception {
        // Get project workflow by team
        restWorkflowMockMvc
                .perform(get("/api/workflows/teams/{teamId}/project-workflow", team.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.useForProject").value(true));
    }

    @Test
    @Transactional
    void getWorkflowDetail() throws Exception {
        // Get an existing workflow
        Workflow existingWorkflow =
                workflowRepository.findById(2L).orElseThrow(); // Refund Process Workflow

        // Get workflow detail
        restWorkflowMockMvc
                .perform(get("/api/workflows/details/{workflowId}", existingWorkflow.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.id").value(existingWorkflow.getId().intValue()))
                .andExpect(jsonPath("$.name").value("Refund Process Workflow"))
                .andExpect(jsonPath("$.states").isArray())
                .andExpect(jsonPath("$.transitions").isArray());
    }

    @Test
    @Transactional
    void saveWorkflow() throws Exception {
        // Create a workflow detailed DTO
        WorkflowDetailedDTO workflowDetailedDTO = new WorkflowDetailedDTO();
        workflowDetailedDTO.setName(DEFAULT_NAME);
        workflowDetailedDTO.setDescription(DEFAULT_DESCRIPTION);
        workflowDetailedDTO.setRequestName(DEFAULT_REQUEST_NAME);
        workflowDetailedDTO.setVisibility(DEFAULT_VISIBILITY);
        workflowDetailedDTO.setLevel1EscalationTimeout(DEFAULT_LEVEL1_TIMEOUT);
        workflowDetailedDTO.setLevel2EscalationTimeout(DEFAULT_LEVEL2_TIMEOUT);
        workflowDetailedDTO.setLevel3EscalationTimeout(DEFAULT_LEVEL3_TIMEOUT);
        workflowDetailedDTO.setTags(DEFAULT_TAGS);
        workflowDetailedDTO.setUseForProject(DEFAULT_USE_FOR_PROJECT);
        workflowDetailedDTO.setOwnerId(team.getId());

        // Create initial state
        WorkflowStateDTO initialState = new WorkflowStateDTO();
        initialState.setStateName("Initial State");
        initialState.setIsInitial(true);
        initialState.setIsFinal(false);

        // Create final state
        WorkflowStateDTO finalState = new WorkflowStateDTO();
        finalState.setStateName("Final State");
        finalState.setIsInitial(false);
        finalState.setIsFinal(true);

        workflowDetailedDTO.setStates(List.of(initialState, finalState));

        // Create transition
        WorkflowTransitionDTO transition = new WorkflowTransitionDTO();
        transition.setEventName("Complete");
        transition.setSlaDuration(3600L);
        transition.setEscalateOnViolation(true);

        workflowDetailedDTO.setTransitions(List.of(transition));

        int databaseSizeBeforeCreate = workflowRepository.findAll().size();

        // Create the workflow
        restWorkflowMockMvc
                .perform(
                        post("/api/workflows/details")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(workflowDetailedDTO)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.name").value(DEFAULT_NAME))
                .andExpect(jsonPath("$.description").value(DEFAULT_DESCRIPTION))
                .andExpect(jsonPath("$.requestName").value(DEFAULT_REQUEST_NAME))
                .andExpect(jsonPath("$.visibility").value(DEFAULT_VISIBILITY.toString()));

        // Validate the Workflow in the database
        List<Workflow> workflowList = workflowRepository.findAll();
        assertThat(workflowList).hasSize(databaseSizeBeforeCreate + 1);
    }

    @Test
    @Transactional
    void updateWorkflowWithDetails() throws Exception {
        // Get an existing workflow
        Workflow existingWorkflow =
                workflowRepository.findById(2L).orElseThrow(); // Refund Process Workflow
        WorkflowDetailedDTO workflowDetailedDTO =
                workflowService.getWorkflowDetail(existingWorkflow.getId()).orElseThrow();

        // Update workflow properties
        workflowDetailedDTO.setName(UPDATED_NAME);
        workflowDetailedDTO.setDescription(UPDATED_DESCRIPTION);

        int databaseSizeBeforeUpdate = workflowRepository.findAll().size();

        // Update the workflow
        restWorkflowMockMvc
                .perform(
                        put("/api/workflows/details/{workflowId}", existingWorkflow.getId())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(workflowDetailedDTO)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.id").value(existingWorkflow.getId().intValue()))
                .andExpect(jsonPath("$.name").value(UPDATED_NAME))
                .andExpect(jsonPath("$.description").value(UPDATED_DESCRIPTION));

        // Validate the Workflow in the database
        List<Workflow> workflowList = workflowRepository.findAll();
        assertThat(workflowList).hasSize(databaseSizeBeforeUpdate);
        Workflow testWorkflow =
                workflowList.stream()
                        .filter(w -> w.getId().equals(existingWorkflow.getId()))
                        .findFirst()
                        .orElseThrow();
        assertThat(testWorkflow.getName()).isEqualTo(UPDATED_NAME);
        assertThat(testWorkflow.getDescription()).isEqualTo(UPDATED_DESCRIPTION);
    }

    @Test
    @Transactional
    void createWorkflowByReference() throws Exception {
        // Get an existing workflow to reference
        Workflow existingWorkflow = workflowRepository.findById(1L).orElseThrow();

        // Create a workflow DTO
        WorkflowDTO workflowDTO = new WorkflowDTO();
        workflowDTO.setName("Referenced Workflow");
        workflowDTO.setDescription("Created by reference");
        workflowDTO.setRequestName("Referenced Request");

        int databaseSizeBeforeCreate = workflowRepository.findAll().size();

        // Create the workflow by reference
        restWorkflowMockMvc
                .perform(
                        post(
                                        "/api/workflows/{referencedWorkflowId}/teams/{teamId}/create-workflow-reference",
                                        existingWorkflow.getId(),
                                        team.getId())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(workflowDTO)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.name").value("Referenced Workflow"))
                .andExpect(jsonPath("$.description").value("Created by reference"))
                .andExpect(jsonPath("$.requestName").value("Referenced Request"))
                .andExpect(jsonPath("$.ownerId").value(team.getId().intValue()))
                .andExpect(jsonPath("$.states").isArray())
                .andExpect(jsonPath("$.transitions").isArray());

        // Validate the Workflow in the database
        List<Workflow> workflowList = workflowRepository.findAll();
        assertThat(workflowList).hasSize(databaseSizeBeforeCreate + 1);
    }

    @Test
    @Transactional
    void createWorkflowByCloning() throws Exception {
        // Get an existing workflow to clone
        Workflow existingWorkflow =
                workflowRepository.findById(2L).orElseThrow(); // Refund Process Workflow

        // Create a workflow DTO
        WorkflowDTO workflowDTO = new WorkflowDTO();
        workflowDTO.setName("Cloned Workflow");
        workflowDTO.setDescription("Created by cloning");
        workflowDTO.setRequestName("Cloned Request");

        int databaseSizeBeforeCreate = workflowRepository.findAll().size();

        // Create the workflow by cloning
        restWorkflowMockMvc
                .perform(
                        post(
                                        "/api/workflows/{workflowToCloneId}/teams/{teamId}/create-workflow-clone",
                                        existingWorkflow.getId(),
                                        team.getId())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(workflowDTO)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.name").value("Cloned Workflow"))
                .andExpect(jsonPath("$.description").value("Created by cloning"))
                .andExpect(jsonPath("$.requestName").value("Cloned Request"))
                .andExpect(jsonPath("$.ownerId").value(team.getId().intValue()))
                .andExpect(jsonPath("$.states").isArray())
                .andExpect(jsonPath("$.transitions").isArray());

        // Validate the Workflow in the database
        List<Workflow> workflowList = workflowRepository.findAll();
        assertThat(workflowList).hasSize(databaseSizeBeforeCreate + 1);
    }
}
