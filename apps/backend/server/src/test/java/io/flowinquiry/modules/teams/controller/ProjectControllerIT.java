package io.flowinquiry.modules.teams.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.flowinquiry.it.IntegrationTest;
import io.flowinquiry.it.WithMockFwUser;
import io.flowinquiry.modules.teams.domain.*;
import io.flowinquiry.modules.teams.repository.ProjectEpicRepository;
import io.flowinquiry.modules.teams.repository.ProjectIterationRepository;
import io.flowinquiry.modules.teams.repository.ProjectRepository;
import io.flowinquiry.modules.teams.service.dto.ProjectDTO;
import io.flowinquiry.modules.teams.service.mapper.ProjectMapper;
import io.flowinquiry.modules.usermanagement.AuthoritiesConstants;
import io.flowinquiry.query.Filter;
import io.flowinquiry.query.FilterOperator;
import io.flowinquiry.query.QueryDTO;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** Integration tests for the {@link ProjectController} REST controller. */
@AutoConfigureMockMvc
@WithMockFwUser(
        userId = 1L,
        authorities = {AuthoritiesConstants.ADMIN})
@IntegrationTest
@Transactional
class ProjectControllerIT {

    private static final String DEFAULT_NAME = "Test Project";
    private static final String UPDATED_NAME = "Updated Test Project";

    private static final String DEFAULT_DESCRIPTION = "Test Description";
    private static final String UPDATED_DESCRIPTION = "Updated Test Description";

    private static final String DEFAULT_SHORT_NAME = "TEST";

    private static final ProjectStatus DEFAULT_STATUS = ProjectStatus.Active;
    private static final ProjectStatus UPDATED_STATUS = ProjectStatus.Closed;

    private static final Instant DEFAULT_START_DATE = Instant.now().truncatedTo(ChronoUnit.SECONDS);
    private static final Instant DEFAULT_END_DATE = DEFAULT_START_DATE.plus(30, ChronoUnit.DAYS);
    private static final Instant UPDATED_START_DATE = DEFAULT_START_DATE.plus(1, ChronoUnit.DAYS);
    private static final Instant UPDATED_END_DATE = DEFAULT_END_DATE.plus(1, ChronoUnit.DAYS);

    @Autowired private ObjectMapper om;

    @Autowired private ProjectRepository projectRepository;

    @Autowired private ProjectEpicRepository projectEpicRepository;

    @Autowired private ProjectIterationRepository projectIterationRepository;

    @Autowired private ProjectMapper projectMapper;

    @Autowired private MockMvc restProjectMockMvc;

    @Test
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
        projectDTO.setTeamId(1L);

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
                .andExpect(jsonPath("$.teamId").value(1L));

        // Validate the Project in the database
        List<Project> projectList = projectRepository.findAll();
        assertThat(projectList).hasSize(databaseSizeBeforeCreate + 1);
        Project testProject = projectList.getLast();
        assertThat(testProject.getName()).isEqualTo(DEFAULT_NAME);
        assertThat(testProject.getDescription()).isEqualTo(DEFAULT_DESCRIPTION);
        assertThat(testProject.getShortName()).isEqualTo(DEFAULT_SHORT_NAME);
        assertThat(testProject.getStatus()).isEqualTo(DEFAULT_STATUS);
        assertThat(testProject.getTeam().getId()).isEqualTo(1L);
    }

    @Test
    void getProjectById() throws Exception {
        restProjectMockMvc
                .perform(get("/api/projects/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.name").value("Customer Portal"))
                .andExpect(jsonPath("$.description").value("Customer-facing web portal"))
                .andExpect(jsonPath("$.shortName").value("cust"))
                .andExpect(jsonPath("$.status").value(DEFAULT_STATUS.toString()));
    }

    @Test
    void getNonExistingProject() throws Exception {
        restProjectMockMvc
                .perform(get("/api/projects/{id}", Long.MAX_VALUE))
                .andExpect(status().isNotFound());
    }

    @Test
    void searchProjects() throws Exception {
        restProjectMockMvc
                .perform(
                        post("/api/projects/search")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE));
    }

    @Test
    void exportToCsv() throws Exception {
        restProjectMockMvc
                .perform(
                        post("/api/projects/export")
                                .contentType(MediaType.APPLICATION_JSON)
                                .accept("text/csv")
                                .content("{}"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, containsString("text/csv")))
                .andExpect(
                        header().string(
                                        HttpHeaders.CONTENT_DISPOSITION,
                                        containsString("projects.csv")));
    }

    @Test
    void exportToXlsx() throws Exception {
        restProjectMockMvc
                .perform(
                        post("/api/projects/export")
                                .contentType(MediaType.APPLICATION_JSON)
                                .accept(
                                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                                .content("{}"))
                .andExpect(status().isOk())
                .andExpect(
                        header().string(
                                        HttpHeaders.CONTENT_TYPE,
                                        containsString(
                                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")))
                .andExpect(
                        header().string(
                                        HttpHeaders.CONTENT_DISPOSITION,
                                        containsString("projects.xlsx")));
    }

    @Test
    void searchProjectsWithQuery() throws Exception {
        QueryDTO queryDTO = new QueryDTO();
        Filter nameFilter = new Filter("name", FilterOperator.EQ, "Customer Portal");
        queryDTO.setFilters(List.of(nameFilter));

        // Search for projects with the query
        restProjectMockMvc
                .perform(
                        post("/api/projects/search")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(Optional.of(queryDTO))))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.content.[*].name").value(hasItem("Customer Portal")));
    }

    @Test
    void updateProject() throws Exception {
        Project updatedProject = projectRepository.findById(1L).orElseThrow();

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
    }

    @Test
    void deleteProject() throws Exception {
        int databaseSizeBeforeDelete = projectRepository.findAll().size();

        restProjectMockMvc
                .perform(delete("/api/projects/{projectId}", 1L).accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        // Validate the database contains one less item
        List<Project> projectList = projectRepository.findAll();
        assertThat(projectList).hasSize(databaseSizeBeforeDelete - 1);
    }

    @Test
    void getProjectIterations() throws Exception {
        Project project = projectRepository.findById(1L).orElseThrow();

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
                .andExpect(jsonPath("$[*].name").value(hasItem("Test Iteration")))
                .andExpect(
                        jsonPath("$[*].description").value(hasItem("Test Iteration Description")));
    }

    @Test
    void getProjectEpics() throws Exception {
        Project project = projectRepository.findById(1L).orElseThrow();

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
                .andExpect(jsonPath("$[*].name").value(hasItem("Test Epic")))
                .andExpect(jsonPath("$[*].description").value(hasItem("Test Epic Description")));
    }

    @Test
    void getProjectByShortName() throws Exception {
        restProjectMockMvc
                .perform(get("/api/projects/short-name/{shortName}", "cust"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.name").value("Customer Portal"))
                .andExpect(jsonPath("$.description").value("Customer-facing web portal"))
                .andExpect(jsonPath("$.shortName").value("cust"))
                .andExpect(jsonPath("$.status").value(DEFAULT_STATUS.toString()));
    }

    @Test
    void getProjectsByUser() throws Exception {
        restProjectMockMvc
                .perform(get("/api/projects/by-user/{userId}", 1L))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$").isNotEmpty());
    }
}
