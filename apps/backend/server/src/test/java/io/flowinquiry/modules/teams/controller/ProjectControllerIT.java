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
import io.flowinquiry.modules.teams.domain.Project;
import io.flowinquiry.modules.teams.domain.ProjectEpic;
import io.flowinquiry.modules.teams.domain.ProjectIteration;
import io.flowinquiry.modules.teams.domain.ProjectStatus;
import io.flowinquiry.modules.teams.domain.Team;
import io.flowinquiry.modules.teams.repository.ProjectEpicRepository;
import io.flowinquiry.modules.teams.repository.ProjectIterationRepository;
import io.flowinquiry.modules.teams.repository.ProjectRepository;
import io.flowinquiry.modules.teams.repository.TeamRepository;
import io.flowinquiry.modules.teams.service.ProjectEpicService;
import io.flowinquiry.modules.teams.service.ProjectIterationService;
import io.flowinquiry.modules.teams.service.ProjectService;
import io.flowinquiry.modules.teams.service.dto.ProjectDTO;
import io.flowinquiry.modules.teams.service.mapper.ProjectMapper;
import io.flowinquiry.modules.usermanagement.AuthoritiesConstants;
import io.flowinquiry.modules.usermanagement.controller.WithMockFwUser;
import io.flowinquiry.query.Filter;
import io.flowinquiry.query.FilterOperator;
import io.flowinquiry.query.QueryDTO;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** Integration tests for the {@link ProjectController} REST controller. */
@AutoConfigureMockMvc
@WithMockFwUser(
        userId = 1L,
        authorities = {AuthoritiesConstants.ADMIN})
@IntegrationTest
class ProjectControllerIT {

    private static final String DEFAULT_NAME = "Test Project";
    private static final String UPDATED_NAME = "Updated Test Project";

    private static final String DEFAULT_DESCRIPTION = "Test Description";
    private static final String UPDATED_DESCRIPTION = "Updated Test Description";

    private static final UUID DEFAULT_TENANT_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000001");

    private static final String DEFAULT_SHORT_NAME = "TEST";
    private static final String UPDATED_SHORT_NAME = "UPDT";

    private static final ProjectStatus DEFAULT_STATUS = ProjectStatus.Active;
    private static final ProjectStatus UPDATED_STATUS = ProjectStatus.Closed;

    private static final Instant DEFAULT_START_DATE = Instant.now().truncatedTo(ChronoUnit.SECONDS);
    private static final Instant DEFAULT_END_DATE = DEFAULT_START_DATE.plus(30, ChronoUnit.DAYS);
    private static final Instant UPDATED_START_DATE = DEFAULT_START_DATE.plus(1, ChronoUnit.DAYS);
    private static final Instant UPDATED_END_DATE = DEFAULT_END_DATE.plus(1, ChronoUnit.DAYS);

    private static final Long DEFAULT_TEAM_ID = 1L;

    @Autowired private ObjectMapper om;

    @Autowired private ProjectRepository projectRepository;

    @Autowired private TeamRepository teamRepository;

    @Autowired private ProjectEpicRepository projectEpicRepository;

    @Autowired private ProjectIterationRepository projectIterationRepository;

    @Autowired private ProjectService projectService;

    @Autowired private ProjectEpicService projectEpicService;

    @Autowired private ProjectIterationService projectIterationService;

    @Autowired private ProjectMapper projectMapper;

    @Autowired private EntityManager em;

    @Autowired private MockMvc restProjectMockMvc;

    private Project project;
    private Team team;

    @BeforeEach
    public void initTest() {
        // First ensure we have a team
        team =
                teamRepository
                        .findById(DEFAULT_TEAM_ID)
                        .orElseGet(
                                () -> {
                                    Team newTeam =
                                            Team.builder()
                                                    .name("Test Team")
                                                    .slogan("Test Slogan")
                                                    .description("Test Description")
                                                    .build();
                                    return teamRepository.save(newTeam);
                                });

        project = createEntity(em);
    }

    /** Create a Project entity for testing. */
    public static Project createEntity(EntityManager em) {
        Project project =
                Project.builder()
                        .name(DEFAULT_NAME)
                        .description(DEFAULT_DESCRIPTION)
                        .shortName(DEFAULT_SHORT_NAME)
                        .status(DEFAULT_STATUS)
                        .startDate(DEFAULT_START_DATE)
                        .endDate(DEFAULT_END_DATE)
                        .build();

        // Set the team
        Team team = em.find(Team.class, DEFAULT_TEAM_ID);
        if (team != null) {
            project.setTeam(team);
        }

        return project;
    }

    @Test
    @Transactional
    void createProject() throws Exception {
        int databaseSizeBeforeCreate = projectRepository.findAll().size();

        // Create the Project DTO
        ProjectDTO projectDTO = new ProjectDTO();
        projectDTO.setName(DEFAULT_NAME);
        projectDTO.setDescription(DEFAULT_DESCRIPTION);
        projectDTO.setShortName(DEFAULT_SHORT_NAME);
        projectDTO.setStatus(DEFAULT_STATUS);
        projectDTO.setStartDate(DEFAULT_START_DATE);
        projectDTO.setEndDate(DEFAULT_END_DATE);
        projectDTO.setTeamId(team.getId());

        // Perform the request and validate the response
        restProjectMockMvc
                .perform(
                        post("/api/projects")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(projectDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value(DEFAULT_NAME))
                .andExpect(jsonPath("$.description").value(DEFAULT_DESCRIPTION))
                .andExpect(jsonPath("$.shortName").value(DEFAULT_SHORT_NAME))
                .andExpect(jsonPath("$.status").value(DEFAULT_STATUS.toString()))
                .andExpect(jsonPath("$.teamId").value(team.getId().intValue()));

        // Validate the Project in the database
        List<Project> projectList = projectRepository.findAll();
        assertThat(projectList).hasSize(databaseSizeBeforeCreate + 1);
        Project testProject = projectList.getLast();
        assertThat(testProject.getName()).isEqualTo(DEFAULT_NAME);
        assertThat(testProject.getDescription()).isEqualTo(DEFAULT_DESCRIPTION);
        assertThat(testProject.getShortName()).isEqualTo(DEFAULT_SHORT_NAME);
        assertThat(testProject.getStatus()).isEqualTo(DEFAULT_STATUS);
        assertThat(testProject.getTeam().getId()).isEqualTo(team.getId());
    }

    @Test
    @Transactional
    void getProjectById() throws Exception {
        // Initialize the database
        projectRepository.saveAndFlush(project);

        // Get the project
        restProjectMockMvc
                .perform(get("/api/projects/{id}", project.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.id").value(project.getId().intValue()))
                .andExpect(jsonPath("$.name").value(DEFAULT_NAME))
                .andExpect(jsonPath("$.description").value(DEFAULT_DESCRIPTION))
                .andExpect(jsonPath("$.shortName").value(DEFAULT_SHORT_NAME))
                .andExpect(jsonPath("$.status").value(DEFAULT_STATUS.toString()));
    }

    @Test
    @Transactional
    void getNonExistingProject() throws Exception {
        // Get the project
        restProjectMockMvc
                .perform(get("/api/projects/{id}", Long.MAX_VALUE))
                .andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void searchProjects() throws Exception {
        // Initialize the database
        projectRepository.saveAndFlush(project);

        // Search for all projects
        restProjectMockMvc
                .perform(
                        post("/api/projects/search")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE));
    }

    @Test
    @Transactional
    void searchProjectsWithQuery() throws Exception {
        // Initialize the database
        projectRepository.saveAndFlush(project);

        // Create a query DTO with a filter for the project name
        QueryDTO queryDTO = new QueryDTO();
        Filter nameFilter = new Filter("name", FilterOperator.EQ, DEFAULT_NAME);
        queryDTO.setFilters(List.of(nameFilter));

        // Search for projects with the query
        restProjectMockMvc
                .perform(
                        post("/api/projects/search")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(Optional.of(queryDTO))))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.content.[*].name").value(hasItem(DEFAULT_NAME)));
    }

    @Test
    @Transactional
    void updateProject() throws Exception {
        // Initialize the database
        projectRepository.saveAndFlush(project);
        int databaseSizeBeforeUpdate = projectRepository.findAll().size();

        // Update the project
        Project updatedProject = projectRepository.findById(project.getId()).orElseThrow();

        ProjectDTO projectDTO = projectMapper.toDto(updatedProject);
        projectDTO.setName(UPDATED_NAME);
        projectDTO.setDescription(UPDATED_DESCRIPTION);
        projectDTO.setStatus(UPDATED_STATUS);
        projectDTO.setStartDate(UPDATED_START_DATE);
        projectDTO.setEndDate(UPDATED_END_DATE);

        restProjectMockMvc
                .perform(
                        put("/api/projects/{projectId}", updatedProject.getId())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(projectDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(updatedProject.getId().intValue()))
                .andExpect(jsonPath("$.name").value(UPDATED_NAME))
                .andExpect(jsonPath("$.description").value(UPDATED_DESCRIPTION))
                .andExpect(jsonPath("$.status").value(UPDATED_STATUS.toString()));

        // Validate the Project in the database
        List<Project> projectList = projectRepository.findAll();
        assertThat(projectList).hasSize(databaseSizeBeforeUpdate);
        Project testProject = projectList.getLast();
        assertThat(testProject.getName()).isEqualTo(UPDATED_NAME);
        assertThat(testProject.getDescription()).isEqualTo(UPDATED_DESCRIPTION);
        assertThat(testProject.getStatus()).isEqualTo(UPDATED_STATUS);
    }

    @Test
    @Transactional
    void deleteProject() throws Exception {
        // Initialize the database
        projectRepository.saveAndFlush(project);
        int databaseSizeBeforeDelete = projectRepository.findAll().size();

        // Delete the project
        restProjectMockMvc
                .perform(
                        delete("/api/projects/{projectId}", project.getId())
                                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        // Validate the database contains one less item
        List<Project> projectList = projectRepository.findAll();
        assertThat(projectList).hasSize(databaseSizeBeforeDelete - 1);
    }

    @Test
    @Transactional
    void getProjectIterations() throws Exception {
        // Initialize the database
        projectRepository.saveAndFlush(project);

        // Create a project iteration
        ProjectIteration iteration = new ProjectIteration();
        iteration.setName("Test Iteration");
        iteration.setDescription("Test Iteration Description");
        iteration.setStartDate(DEFAULT_START_DATE);
        iteration.setEndDate(DEFAULT_END_DATE);
        iteration.setProject(project);
        projectIterationRepository.saveAndFlush(iteration);

        // Get project iterations
        restProjectMockMvc
                .perform(get("/api/projects/{projectId}/iterations", project.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").value("Test Iteration"))
                .andExpect(jsonPath("$[0].description").value("Test Iteration Description"));
    }

    @Test
    @Transactional
    void getProjectEpics() throws Exception {
        // Initialize the database
        projectRepository.saveAndFlush(project);

        // Create a project epic
        ProjectEpic epic = new ProjectEpic();
        epic.setName("Test Epic");
        epic.setDescription("Test Epic Description");
        epic.setStartDate(DEFAULT_START_DATE);
        epic.setEndDate(DEFAULT_END_DATE);
        epic.setProject(project);
        projectEpicRepository.saveAndFlush(epic);

        // Get project epics
        restProjectMockMvc
                .perform(get("/api/projects/{projectId}/epics", project.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").value("Test Epic"))
                .andExpect(jsonPath("$[0].description").value("Test Epic Description"));
    }

    @Test
    @Transactional
    void getProjectByShortName() throws Exception {
        // Initialize the database
        projectRepository.saveAndFlush(project);

        // Get the project by short name
        restProjectMockMvc
                .perform(get("/api/projects/short-name/{shortName}", DEFAULT_SHORT_NAME))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.id").value(project.getId().intValue()))
                .andExpect(jsonPath("$.name").value(DEFAULT_NAME))
                .andExpect(jsonPath("$.description").value(DEFAULT_DESCRIPTION))
                .andExpect(jsonPath("$.shortName").value(DEFAULT_SHORT_NAME))
                .andExpect(jsonPath("$.status").value(DEFAULT_STATUS.toString()));
    }

    @Test
    @Transactional
    void getProjectsByUser() throws Exception {
        // Initialize the database
        projectRepository.saveAndFlush(project);

        // Get projects by user ID
        restProjectMockMvc
                .perform(get("/api/projects/by-user/{userId}", 1L))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$").isNotEmpty());
    }
}
