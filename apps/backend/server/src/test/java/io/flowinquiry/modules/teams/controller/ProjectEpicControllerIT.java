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
import io.flowinquiry.IntegrationTest;
import io.flowinquiry.modules.teams.domain.Project;
import io.flowinquiry.modules.teams.domain.ProjectEpic;
import io.flowinquiry.modules.teams.domain.Team;
import io.flowinquiry.modules.teams.repository.ProjectEpicRepository;
import io.flowinquiry.modules.teams.repository.ProjectRepository;
import io.flowinquiry.modules.teams.service.ProjectEpicService;
import io.flowinquiry.modules.teams.service.dto.ProjectEpicDTO;
import io.flowinquiry.modules.usermanagement.AuthoritiesConstants;
import io.flowinquiry.modules.usermanagement.controller.WithMockFwUser;
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

/** Integration tests for the {@link ProjectEpicController} REST controller. */
@AutoConfigureMockMvc
@WithMockFwUser(
        userId = 1L,
        authorities = {AuthoritiesConstants.ADMIN})
@IntegrationTest
public class ProjectEpicControllerIT {

    private static final String DEFAULT_NAME = "Test Epic";
    private static final String UPDATED_NAME = "Updated Test Epic";

    private static final String DEFAULT_DESCRIPTION = "Test Epic Description";
    private static final String UPDATED_DESCRIPTION = "Updated Test Epic Description";

    private static final String DEFAULT_STATUS = "ACTIVE";
    private static final String UPDATED_STATUS = "COMPLETED";

    private static final Integer DEFAULT_PRIORITY = 1;
    private static final Integer UPDATED_PRIORITY = 2;

    private static final Instant DEFAULT_START_DATE = Instant.now().truncatedTo(ChronoUnit.SECONDS);
    private static final Instant DEFAULT_END_DATE = DEFAULT_START_DATE.plus(30, ChronoUnit.DAYS);
    private static final Instant UPDATED_START_DATE = DEFAULT_START_DATE.plus(1, ChronoUnit.DAYS);
    private static final Instant UPDATED_END_DATE = DEFAULT_END_DATE.plus(1, ChronoUnit.DAYS);

    @Autowired private ObjectMapper om;

    @Autowired private ProjectEpicRepository epicRepository;

    @Autowired private ProjectRepository projectRepository;

    @Autowired private ProjectEpicService epicService;

    @Autowired private EntityManager em;

    @Autowired private MockMvc restEpicMockMvc;

    private ProjectEpic epic;
    private Project project;

    @BeforeEach
    public void initTest() {
        // First ensure we have a project
        project = createProject(em);
        projectRepository.saveAndFlush(project);

        epic = createEntity(em);
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

    /** Create a ProjectEpic entity for testing. */
    public static ProjectEpic createEntity(EntityManager em) {
        ProjectEpic epic = new ProjectEpic();
        epic.setName(DEFAULT_NAME);
        epic.setDescription(DEFAULT_DESCRIPTION);
        epic.setStatus(DEFAULT_STATUS);
        epic.setPriority(DEFAULT_PRIORITY);
        epic.setStartDate(DEFAULT_START_DATE);
        epic.setEndDate(DEFAULT_END_DATE);

        // Set the project
        Project project = em.find(Project.class, 1L);
        if (project != null) {
            epic.setProject(project);
        }

        return epic;
    }

    @Test
    @Transactional
    void createEpic() throws Exception {
        int databaseSizeBeforeCreate = epicRepository.findAll().size();

        // Create the Epic DTO
        ProjectEpicDTO epicDTO = new ProjectEpicDTO();
        epicDTO.setName(DEFAULT_NAME);
        epicDTO.setDescription(DEFAULT_DESCRIPTION);
        epicDTO.setStartDate(DEFAULT_START_DATE);
        epicDTO.setEndDate(DEFAULT_END_DATE);
        epicDTO.setProjectId(project.getId());

        // Perform the request and validate the response
        restEpicMockMvc
                .perform(
                        post("/api/project-epics")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(epicDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value(DEFAULT_NAME))
                .andExpect(jsonPath("$.description").value(DEFAULT_DESCRIPTION))
                .andExpect(jsonPath("$.projectId").value(project.getId().intValue()));

        // Validate the Epic in the database
        List<ProjectEpic> epicList = epicRepository.findAll();
        assertThat(epicList).hasSize(databaseSizeBeforeCreate + 1);
        ProjectEpic testEpic = epicList.getLast();
        assertThat(testEpic.getName()).isEqualTo(DEFAULT_NAME);
        assertThat(testEpic.getDescription()).isEqualTo(DEFAULT_DESCRIPTION);
        assertThat(testEpic.getProject().getId()).isEqualTo(project.getId());
    }

    @Test
    @Transactional
    void getEpicById() throws Exception {
        // Initialize the database
        epic.setProject(project);
        epicRepository.saveAndFlush(epic);

        // Get the epic
        restEpicMockMvc
                .perform(get("/api/project-epics/{id}", epic.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.id").value(epic.getId().intValue()))
                .andExpect(jsonPath("$.name").value(DEFAULT_NAME))
                .andExpect(jsonPath("$.description").value(DEFAULT_DESCRIPTION))
                .andExpect(jsonPath("$.projectId").value(project.getId().intValue()));
    }

    @Test
    @Transactional
    void getNonExistingEpic() throws Exception {
        // Get the epic
        restEpicMockMvc
                .perform(get("/api/project-epics/{id}", Long.MAX_VALUE))
                .andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void updateEpic() throws Exception {
        // Initialize the database
        epic.setProject(project);
        epicRepository.saveAndFlush(epic);
        int databaseSizeBeforeUpdate = epicRepository.findAll().size();

        // Update the epic
        ProjectEpic updatedEpic = epicRepository.findById(epic.getId()).orElseThrow();

        ProjectEpicDTO epicDTO = new ProjectEpicDTO();
        epicDTO.setId(updatedEpic.getId());
        epicDTO.setName(UPDATED_NAME);
        epicDTO.setDescription(UPDATED_DESCRIPTION);
        epicDTO.setStartDate(UPDATED_START_DATE);
        epicDTO.setEndDate(UPDATED_END_DATE);
        epicDTO.setProjectId(project.getId());

        restEpicMockMvc
                .perform(
                        put("/api/project-epics/{id}", updatedEpic.getId())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(epicDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(updatedEpic.getId().intValue()))
                .andExpect(jsonPath("$.name").value(UPDATED_NAME))
                .andExpect(jsonPath("$.description").value(UPDATED_DESCRIPTION));

        // Validate the Epic in the database
        List<ProjectEpic> epicList = epicRepository.findAll();
        assertThat(epicList).hasSize(databaseSizeBeforeUpdate);
        ProjectEpic testEpic = epicList.getLast();
        assertThat(testEpic.getName()).isEqualTo(UPDATED_NAME);
        assertThat(testEpic.getDescription()).isEqualTo(UPDATED_DESCRIPTION);
    }

    @Test
    @Transactional
    void deleteEpic() throws Exception {
        // Initialize the database
        epic.setProject(project);
        epicRepository.saveAndFlush(epic);
        int databaseSizeBeforeDelete = epicRepository.findAll().size();

        // Delete the epic
        restEpicMockMvc
                .perform(
                        delete("/api/project-epics/{id}", epic.getId())
                                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        // Validate the database contains one less item
        List<ProjectEpic> epicList = epicRepository.findAll();
        assertThat(epicList).hasSize(databaseSizeBeforeDelete - 1);
    }
}
