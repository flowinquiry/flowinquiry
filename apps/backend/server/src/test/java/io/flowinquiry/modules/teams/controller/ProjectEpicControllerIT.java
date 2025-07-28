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
import io.flowinquiry.modules.teams.domain.ProjectEpic;
import io.flowinquiry.modules.teams.repository.ProjectEpicRepository;
import io.flowinquiry.modules.teams.service.dto.ProjectEpicDTO;
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

    private static final Instant DEFAULT_START_DATE = Instant.now().truncatedTo(ChronoUnit.SECONDS);
    private static final Instant DEFAULT_END_DATE = DEFAULT_START_DATE.plus(30, ChronoUnit.DAYS);
    private static final Instant UPDATED_START_DATE = DEFAULT_START_DATE.plus(1, ChronoUnit.DAYS);
    private static final Instant UPDATED_END_DATE = DEFAULT_END_DATE.plus(1, ChronoUnit.DAYS);

    @Autowired private ObjectMapper om;

    @Autowired private ProjectEpicRepository epicRepository;

    @Autowired private MockMvc restEpicMockMvc;

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
        epicDTO.setProjectId(1L);

        // Perform the request and validate the response
        restEpicMockMvc
                .perform(
                        post("/api/project-epics")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(epicDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value(DEFAULT_NAME))
                .andExpect(jsonPath("$.description").value(DEFAULT_DESCRIPTION))
                .andExpect(jsonPath("$.projectId").value(1L));

        // Validate the Epic in the database
        List<ProjectEpic> epicList = epicRepository.findAll();
        assertThat(epicList).hasSize(databaseSizeBeforeCreate + 1);
        ProjectEpic testEpic = epicList.getLast();
        assertThat(testEpic.getName()).isEqualTo(DEFAULT_NAME);
        assertThat(testEpic.getDescription()).isEqualTo(DEFAULT_DESCRIPTION);
        assertThat(testEpic.getProject().getId()).isEqualTo(1L);
    }

    @Test
    @Transactional
    void getEpicById() throws Exception {
        restEpicMockMvc
                .perform(get("/api/project-epics/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.name").value("Epic Alpha"))
                .andExpect(jsonPath("$.description").value("Description for Epic Alpha"))
                .andExpect(jsonPath("$.projectId").value(1L));
    }

    @Test
    @Transactional
    void getNonExistingEpic() throws Exception {
        restEpicMockMvc
                .perform(get("/api/project-epics/{id}", Long.MAX_VALUE))
                .andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void updateEpic() throws Exception {
        ProjectEpic updatedEpic = epicRepository.findById(1L).orElseThrow();

        ProjectEpicDTO epicDTO = new ProjectEpicDTO();
        epicDTO.setId(updatedEpic.getId());
        epicDTO.setName(UPDATED_NAME);
        epicDTO.setDescription(UPDATED_DESCRIPTION);
        epicDTO.setStartDate(UPDATED_START_DATE);
        epicDTO.setEndDate(UPDATED_END_DATE);
        epicDTO.setProjectId(1L);

        restEpicMockMvc
                .perform(
                        put("/api/project-epics/{id}", updatedEpic.getId())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(epicDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(updatedEpic.getId().intValue()))
                .andExpect(jsonPath("$.name").value(UPDATED_NAME))
                .andExpect(jsonPath("$.description").value(UPDATED_DESCRIPTION));
    }

    @Test
    @Transactional
    void deleteEpic() throws Exception {
        int databaseSizeBeforeDelete = epicRepository.findAll().size();

        // Delete the epic
        restEpicMockMvc
                .perform(delete("/api/project-epics/{id}", 1L).accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        // Validate the database contains one less item
        List<ProjectEpic> epicList = epicRepository.findAll();
        assertThat(epicList).hasSize(databaseSizeBeforeDelete - 1);
    }
}
