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
import io.flowinquiry.modules.teams.repository.ProjectIterationRepository;
import io.flowinquiry.modules.teams.repository.ProjectRepository;
import io.flowinquiry.modules.teams.service.dto.ProjectIterationDTO;
import io.flowinquiry.modules.usermanagement.AuthoritiesConstants;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@AutoConfigureMockMvc
@WithMockFwUser(
        userId = 1L,
        authorities = {AuthoritiesConstants.ADMIN})
@IntegrationTest
@Transactional
public class ProjectIterationControllerIT {

    private static final String DEFAULT_NAME = "Test Iteration";
    private static final String UPDATED_NAME = "Updated Test Iteration";

    private static final String DEFAULT_DESCRIPTION = "Test Iteration Description";
    private static final String UPDATED_DESCRIPTION = "Updated Test Iteration Description";

    private static final Instant DEFAULT_START_DATE = Instant.now().truncatedTo(ChronoUnit.SECONDS);
    private static final Instant DEFAULT_END_DATE = DEFAULT_START_DATE.plus(30, ChronoUnit.DAYS);
    private static final Instant UPDATED_START_DATE = DEFAULT_START_DATE.plus(1, ChronoUnit.DAYS);
    private static final Instant UPDATED_END_DATE = DEFAULT_END_DATE.plus(1, ChronoUnit.DAYS);

    @Autowired private ObjectMapper om;

    @Autowired private ProjectRepository projectRepository;

    @Autowired private ProjectIterationRepository iterationRepository;

    @Autowired private MockMvc restIterationMockMvc;

    @Test
    void createIteration() throws Exception {
        Project project = projectRepository.findById(1L).orElseThrow();

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
    }

    @Test
    void getIterationById() throws Exception {

        // Get the iteration
        restIterationMockMvc
                .perform(get("/api/project-iterations/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.name").value("Iteration 1"))
                .andExpect(jsonPath("$.description").value("Description for Iteration 1"))
                .andExpect(jsonPath("$.projectId").value(1L));
    }

    @Test
    void getNonExistingIteration() throws Exception {
        restIterationMockMvc
                .perform(get("/api/project-iterations/{id}", Long.MAX_VALUE))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateIteration() throws Exception {
        ProjectIteration updatedIteration = iterationRepository.findById(1L).orElseThrow();

        ProjectIterationDTO iterationDTO = new ProjectIterationDTO();
        iterationDTO.setId(updatedIteration.getId());
        iterationDTO.setName(UPDATED_NAME);
        iterationDTO.setDescription(UPDATED_DESCRIPTION);
        iterationDTO.setStartDate(UPDATED_START_DATE);
        iterationDTO.setEndDate(UPDATED_END_DATE);
        iterationDTO.setProjectId(1L);

        restIterationMockMvc
                .perform(
                        put("/api/project-iterations/{id}", updatedIteration.getId())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(iterationDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(updatedIteration.getId().intValue()))
                .andExpect(jsonPath("$.name").value(UPDATED_NAME))
                .andExpect(jsonPath("$.description").value(UPDATED_DESCRIPTION));
    }

    @Test
    void deleteIteration() throws Exception {
        int databaseSizeBeforeDelete = iterationRepository.findAll().size();

        // Delete the iteration
        restIterationMockMvc
                .perform(
                        delete("/api/project-iterations/{id}", 1L)
                                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        // Validate the database contains one less item
        List<ProjectIteration> iterationList = iterationRepository.findAll();
        assertThat(iterationList).hasSize(databaseSizeBeforeDelete - 1);
    }
}
