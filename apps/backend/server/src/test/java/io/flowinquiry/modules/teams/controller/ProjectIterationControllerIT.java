package io.flowinquiry.modules.teams.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.flowinquiry.it.IntegrationTest;
import io.flowinquiry.it.WithMockFwUser;
import io.flowinquiry.modules.teams.domain.Project;
import io.flowinquiry.modules.teams.domain.ProjectIteration;
import io.flowinquiry.modules.teams.domain.Team;
import io.flowinquiry.modules.teams.repository.ProjectIterationRepository;
import io.flowinquiry.modules.teams.repository.ProjectRepository;
import io.flowinquiry.modules.teams.service.ProjectIterationService;
import io.flowinquiry.modules.teams.service.dto.ProjectIterationDTO;
import io.flowinquiry.modules.usermanagement.AuthoritiesConstants;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** Integration tests for the {@link ProjectIterationController} REST controller. */
@AutoConfigureMockMvc
@WithMockFwUser(
        userId = 1L,
        authorities = {AuthoritiesConstants.ADMIN})
@IntegrationTest
public class ProjectIterationControllerIT {

    private static final String DEFAULT_NAME = "Test Iteration";
    private static final String UPDATED_NAME = "Updated Test Iteration";

    private static final String DEFAULT_DESCRIPTION = "Test Iteration Description";
    private static final String UPDATED_DESCRIPTION = "Updated Test Iteration Description";

    private static final String DEFAULT_STATUS = "ACTIVE";
    private static final String UPDATED_STATUS = "COMPLETED";

    private static final Instant DEFAULT_START_DATE = Instant.now().truncatedTo(ChronoUnit.SECONDS);
    private static final Instant DEFAULT_END_DATE = DEFAULT_START_DATE.plus(30, ChronoUnit.DAYS);
    private static final Instant UPDATED_START_DATE = DEFAULT_START_DATE.plus(1, ChronoUnit.DAYS);
    private static final Instant UPDATED_END_DATE = DEFAULT_END_DATE.plus(1, ChronoUnit.DAYS);

    @Autowired private ObjectMapper om;

    @Autowired private ProjectIterationRepository iterationRepository;

    @Autowired private ProjectRepository projectRepository;

    @Autowired private ProjectIterationService iterationService;

    @Autowired private EntityManager em;

    @Autowired private MockMvc restIterationMockMvc;

    private ProjectIteration iteration;
    private Project project;

    @BeforeEach
    public void initTest() {
        // First ensure we have a project
        project = createProject(em);
        projectRepository.saveAndFlush(project);

        iteration = createEntity(em);
    }

    /** Create a Project entity for testing. */
    public static Project createProject(EntityManager em) {
        // Create a team first
        Team team =
                Team.builder()
                        .name("Test Team")
                        .slogan("Test Slogan")
                        .description("Test Description")
                        .build();

        // Save the team to get an ID
        em.persist(team);
        em.flush();

        // Create the project with the team
        Project project = new Project();
        project.setName("Test Project");
        project.setDescription("Test Project Description");
        project.setShortName("TEST");
        project.setStatus(io.flowinquiry.modules.teams.domain.ProjectStatus.Active);
        project.setStartDate(Instant.now().truncatedTo(ChronoUnit.SECONDS));
        project.setEndDate(Instant.now().plus(60, ChronoUnit.DAYS).truncatedTo(ChronoUnit.SECONDS));
        project.setTeam(team);

        return project;
    }

    /** Create a ProjectIteration entity for testing. */
    public static ProjectIteration createEntity(EntityManager em) {
        ProjectIteration iteration = new ProjectIteration();
        iteration.setName(DEFAULT_NAME);
        iteration.setDescription(DEFAULT_DESCRIPTION);
        iteration.setStatus(DEFAULT_STATUS);
        iteration.setStartDate(DEFAULT_START_DATE);
        iteration.setEndDate(DEFAULT_END_DATE);

        // Set the project
        Project project = em.find(Project.class, 1L);
        if (project != null) {
            iteration.setProject(project);
        }

        return iteration;
    }

    @Test
    @Transactional
    void createIteration() throws Exception {
        int databaseSizeBeforeCreate = iterationRepository.findAll().size();

        // Create the Iteration DTO
        ProjectIterationDTO iterationDTO = new ProjectIterationDTO();
        iterationDTO.setName(DEFAULT_NAME);
        iterationDTO.setDescription(DEFAULT_DESCRIPTION);
        iterationDTO.setStartDate(DEFAULT_START_DATE);
        iterationDTO.setEndDate(DEFAULT_END_DATE);
        iterationDTO.setProjectId(project.getId());

        // Perform the request and validate the response
        restIterationMockMvc
                .perform(
                        post("/api/project-iterations")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(iterationDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value(DEFAULT_NAME))
                .andExpect(jsonPath("$.description").value(DEFAULT_DESCRIPTION))
                .andExpect(jsonPath("$.projectId").value(project.getId().intValue()));

        // Validate the Iteration in the database
        List<ProjectIteration> iterationList = iterationRepository.findAll();
        assertThat(iterationList).hasSize(databaseSizeBeforeCreate + 1);
        ProjectIteration testIteration = iterationList.getLast();
        assertThat(testIteration.getName()).isEqualTo(DEFAULT_NAME);
        assertThat(testIteration.getDescription()).isEqualTo(DEFAULT_DESCRIPTION);
        assertThat(testIteration.getProject().getId()).isEqualTo(project.getId());
    }

    @Test
    @Transactional
    void getIterationById() throws Exception {
        // Initialize the database
        iteration.setProject(project);
        iterationRepository.saveAndFlush(iteration);

        // Get the iteration
        restIterationMockMvc
                .perform(get("/api/project-iterations/{id}", iteration.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.id").value(iteration.getId().intValue()))
                .andExpect(jsonPath("$.name").value(DEFAULT_NAME))
                .andExpect(jsonPath("$.description").value(DEFAULT_DESCRIPTION))
                .andExpect(jsonPath("$.projectId").value(project.getId().intValue()));
    }

    @Test
    @Transactional
    void getNonExistingIteration() throws Exception {
        // Get the iteration
        restIterationMockMvc
                .perform(get("/api/project-iterations/{id}", Long.MAX_VALUE))
                .andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void updateIteration() throws Exception {
        // Initialize the database
        iteration.setProject(project);
        iterationRepository.saveAndFlush(iteration);
        int databaseSizeBeforeUpdate = iterationRepository.findAll().size();

        // Update the iteration
        ProjectIteration updatedIteration =
                iterationRepository.findById(iteration.getId()).orElseThrow();

        ProjectIterationDTO iterationDTO = new ProjectIterationDTO();
        iterationDTO.setId(updatedIteration.getId());
        iterationDTO.setName(UPDATED_NAME);
        iterationDTO.setDescription(UPDATED_DESCRIPTION);
        iterationDTO.setStartDate(UPDATED_START_DATE);
        iterationDTO.setEndDate(UPDATED_END_DATE);
        iterationDTO.setProjectId(project.getId());

        restIterationMockMvc
                .perform(
                        put("/api/project-iterations/{id}", updatedIteration.getId())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(iterationDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(updatedIteration.getId().intValue()))
                .andExpect(jsonPath("$.name").value(UPDATED_NAME))
                .andExpect(jsonPath("$.description").value(UPDATED_DESCRIPTION));

        // Validate the Iteration in the database
        List<ProjectIteration> iterationList = iterationRepository.findAll();
        assertThat(iterationList).hasSize(databaseSizeBeforeUpdate);
        ProjectIteration testIteration = iterationList.getLast();
        assertThat(testIteration.getName()).isEqualTo(UPDATED_NAME);
        assertThat(testIteration.getDescription()).isEqualTo(UPDATED_DESCRIPTION);
    }

    @Test
    @Transactional
    void deleteIteration() throws Exception {
        // Initialize the database
        iteration.setProject(project);
        iterationRepository.saveAndFlush(iteration);
        int databaseSizeBeforeDelete = iterationRepository.findAll().size();

        // Delete the iteration
        restIterationMockMvc
                .perform(
                        delete("/api/project-iterations/{id}", iteration.getId())
                                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        // Validate the database contains one less item
        List<ProjectIteration> iterationList = iterationRepository.findAll();
        assertThat(iterationList).hasSize(databaseSizeBeforeDelete - 1);
    }
}
