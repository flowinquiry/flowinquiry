package io.flowinquiry.modules.teams.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.flowinquiry.it.IntegrationTest;
import io.flowinquiry.it.WithMockFwUser;
import io.flowinquiry.modules.teams.domain.Team;
import io.flowinquiry.modules.teams.repository.TeamRepository;
import io.flowinquiry.modules.teams.service.TeamService;
import io.flowinquiry.modules.teams.service.dto.TeamDTO;
import io.flowinquiry.modules.teams.service.mapper.TeamMapper;
import io.flowinquiry.modules.usermanagement.AuthoritiesConstants;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.domain.UserTeam;
import io.flowinquiry.modules.usermanagement.domain.UserTeamId;
import io.flowinquiry.modules.usermanagement.repository.UserTeamRepository;
import jakarta.persistence.EntityManager;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** Integration tests for the {@link TeamController} REST controller. */
@AutoConfigureMockMvc
@WithMockFwUser(
        userId = 1L,
        authorities = {AuthoritiesConstants.ADMIN})
@IntegrationTest
class TeamControllerIT {

    private static final String DEFAULT_NAME = "Test Team";
    private static final String UPDATED_NAME = "Updated Test Team";

    private static final String DEFAULT_SLOGAN = "Test Slogan";
    private static final String UPDATED_SLOGAN = "Updated Test Slogan";

    private static final String DEFAULT_DESCRIPTION = "Test Description";
    private static final String UPDATED_DESCRIPTION = "Updated Test Description";

    private static final Long DEFAULT_ORGANIZATION_ID = 1L;

    @Autowired private ObjectMapper om;

    @Autowired private TeamRepository teamRepository;

    @Autowired private UserTeamRepository userTeamRepository;

    @Autowired private TeamService teamService;

    @Autowired private TeamMapper teamMapper;

    @Autowired private EntityManager em;

    @Autowired private MockMvc restTeamMockMvc;

    @Test
    @Transactional
    void createTeam() throws Exception {
        int databaseSizeBeforeCreate = teamRepository.findAll().size();

        // Create the Team DTO
        TeamDTO teamDTO = new TeamDTO();
        teamDTO.setName(DEFAULT_NAME);
        teamDTO.setSlogan(DEFAULT_SLOGAN);
        teamDTO.setDescription(DEFAULT_DESCRIPTION);
        teamDTO.setOrganizationId(DEFAULT_ORGANIZATION_ID);

        // Create a mock file for the logo - using a minimal valid PNG image
        byte[] pngBytes = {
            (byte) 0x89,
            0x50,
            0x4E,
            0x47,
            0x0D,
            0x0A,
            0x1A,
            0x0A,
            0x00,
            0x00,
            0x00,
            0x0D,
            0x49,
            0x48,
            0x44,
            0x52,
            0x00,
            0x00,
            0x00,
            0x01,
            0x00,
            0x00,
            0x00,
            0x01,
            0x08,
            0x06,
            0x00,
            0x00,
            0x00,
            0x1F,
            0x15,
            (byte) 0xC4,
            (byte) 0x89,
            0x00,
            0x00,
            0x00,
            0x0A,
            0x49,
            0x44,
            0x41,
            0x54,
            0x78,
            (byte) 0x9C,
            0x63,
            0x00,
            0x01,
            0x00,
            0x00,
            0x05,
            0x00,
            0x01,
            (byte) 0x0D,
            0x0A,
            0x2D,
            (byte) 0xB4,
            0x00,
            0x00,
            0x00,
            0x00,
            0x49,
            0x45,
            0x4E,
            0x44,
            (byte) 0xAE,
            0x42,
            0x60,
            (byte) 0x82
        };

        MockMultipartFile file =
                new MockMultipartFile("file", "test-logo.png", MediaType.IMAGE_PNG_VALUE, pngBytes);

        // Create a mock JSON part for the teamDTO
        MockMultipartFile teamDTOFile =
                new MockMultipartFile(
                        "teamDTO",
                        "",
                        MediaType.APPLICATION_JSON_VALUE,
                        om.writeValueAsBytes(teamDTO));

        // Perform the request and validate the response
        restTeamMockMvc
                .perform(multipart("/api/teams").file(file).file(teamDTOFile))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value(DEFAULT_NAME))
                .andExpect(jsonPath("$.slogan").value(DEFAULT_SLOGAN))
                .andExpect(jsonPath("$.description").value(DEFAULT_DESCRIPTION))
                .andExpect(jsonPath("$.logoUrl").isNotEmpty());

        // Validate the Team in the database
        List<Team> teamList = teamRepository.findAll();
        assertThat(teamList).hasSize(databaseSizeBeforeCreate + 1);
        Team testTeam = teamList.getLast();
        assertThat(testTeam.getName()).isEqualTo(DEFAULT_NAME);
        assertThat(testTeam.getSlogan()).isEqualTo(DEFAULT_SLOGAN);
        assertThat(testTeam.getDescription()).isEqualTo(DEFAULT_DESCRIPTION);
        assertThat(testTeam.getLogoUrl()).isNotNull();
    }

    @Test
    @Transactional
    void createTeamWithoutLogo() throws Exception {
        int databaseSizeBeforeCreate = teamRepository.findAll().size();

        // Create the Team DTO
        TeamDTO teamDTO = new TeamDTO();
        teamDTO.setName(DEFAULT_NAME);
        teamDTO.setSlogan(DEFAULT_SLOGAN);
        teamDTO.setDescription(DEFAULT_DESCRIPTION);
        teamDTO.setOrganizationId(DEFAULT_ORGANIZATION_ID);

        // Create a mock JSON part for the teamDTO
        MockMultipartFile teamDTOFile =
                new MockMultipartFile(
                        "teamDTO",
                        "",
                        MediaType.APPLICATION_JSON_VALUE,
                        om.writeValueAsBytes(teamDTO));

        // Perform the request and validate the response
        restTeamMockMvc
                .perform(multipart("/api/teams").file(teamDTOFile))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value(DEFAULT_NAME))
                .andExpect(jsonPath("$.slogan").value(DEFAULT_SLOGAN))
                .andExpect(jsonPath("$.description").value(DEFAULT_DESCRIPTION));

        // Validate the Team in the database
        List<Team> teamList = teamRepository.findAll();
        assertThat(teamList).hasSize(databaseSizeBeforeCreate + 1);
        Team testTeam = teamList.getLast();
        assertThat(testTeam.getName()).isEqualTo(DEFAULT_NAME);
        assertThat(testTeam.getSlogan()).isEqualTo(DEFAULT_SLOGAN);
        assertThat(testTeam.getDescription()).isEqualTo(DEFAULT_DESCRIPTION);
    }

    @Test
    @Transactional
    void updateTeam() throws Exception {
        int databaseSizeBeforeUpdate = teamRepository.findAll().size();

        // Update the team
        Team updatedTeam = teamRepository.findById(1L).orElseThrow();

        TeamDTO teamDTO = teamMapper.toDto(updatedTeam);
        teamDTO.setName(UPDATED_NAME);
        teamDTO.setSlogan(UPDATED_SLOGAN);
        teamDTO.setDescription(UPDATED_DESCRIPTION);

        // Create a mock file for the logo - using a minimal valid PNG image
        byte[] pngBytes = {
            (byte) 0x89,
            0x50,
            0x4E,
            0x47,
            0x0D,
            0x0A,
            0x1A,
            0x0A,
            0x00,
            0x00,
            0x00,
            0x0D,
            0x49,
            0x48,
            0x44,
            0x52,
            0x00,
            0x00,
            0x00,
            0x01,
            0x00,
            0x00,
            0x00,
            0x01,
            0x08,
            0x06,
            0x00,
            0x00,
            0x00,
            0x1F,
            0x15,
            (byte) 0xC4,
            (byte) 0x89,
            0x00,
            0x00,
            0x00,
            0x0A,
            0x49,
            0x44,
            0x41,
            0x54,
            0x78,
            (byte) 0x9C,
            0x63,
            0x00,
            0x01,
            0x00,
            0x00,
            0x05,
            0x00,
            0x01,
            (byte) 0x0D,
            0x0A,
            0x2D,
            (byte) 0xB4,
            0x00,
            0x00,
            0x00,
            0x00,
            0x49,
            0x45,
            0x4E,
            0x44,
            (byte) 0xAE,
            0x42,
            0x60,
            (byte) 0x82
        };

        MockMultipartFile file =
                new MockMultipartFile(
                        "file", "updated-logo.png", MediaType.IMAGE_PNG_VALUE, pngBytes);

        // Create a mock JSON part for the teamDTO
        MockMultipartFile teamDTOFile =
                new MockMultipartFile(
                        "teamDTO",
                        "",
                        MediaType.APPLICATION_JSON_VALUE,
                        om.writeValueAsBytes(teamDTO));

        // Perform the request and validate the response
        restTeamMockMvc
                .perform(
                        multipart("/api/teams")
                                .file(file)
                                .file(teamDTOFile)
                                .with(
                                        request -> {
                                            request.setMethod("PUT");
                                            return request;
                                        }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(updatedTeam.getId().intValue()))
                .andExpect(jsonPath("$.name").value(UPDATED_NAME))
                .andExpect(jsonPath("$.slogan").value(UPDATED_SLOGAN))
                .andExpect(jsonPath("$.description").value(UPDATED_DESCRIPTION))
                .andExpect(jsonPath("$.logoUrl").isNotEmpty());
    }

    @Test
    @Transactional
    void updateTeamWithoutLogo() throws Exception {
        int databaseSizeBeforeUpdate = teamRepository.findAll().size();

        // Update the team
        Team updatedTeam = teamRepository.findById(1L).orElseThrow();

        TeamDTO teamDTO = teamMapper.toDto(updatedTeam);
        teamDTO.setName(UPDATED_NAME);
        teamDTO.setSlogan(UPDATED_SLOGAN);
        teamDTO.setDescription(UPDATED_DESCRIPTION);

        // Create a mock JSON part for the teamDTO
        MockMultipartFile teamDTOFile =
                new MockMultipartFile(
                        "teamDTO",
                        "",
                        MediaType.APPLICATION_JSON_VALUE,
                        om.writeValueAsBytes(teamDTO));

        // Perform the request and validate the response
        restTeamMockMvc
                .perform(
                        multipart("/api/teams")
                                .file(teamDTOFile)
                                .with(
                                        request -> {
                                            request.setMethod("PUT");
                                            return request;
                                        }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(updatedTeam.getId().intValue()))
                .andExpect(jsonPath("$.name").value(UPDATED_NAME))
                .andExpect(jsonPath("$.slogan").value(UPDATED_SLOGAN))
                .andExpect(jsonPath("$.description").value(UPDATED_DESCRIPTION));
    }

    @Test
    @Transactional
    void deleteTeam() throws Exception {
        int databaseSizeBeforeDelete = teamRepository.findAll().size();

        // Delete the team
        restTeamMockMvc
                .perform(delete("/api/teams/{id}", 1L).accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        // Validate the database contains one less item
        List<Team> teamList = teamRepository.findAll();
        assertThat(teamList).hasSize(databaseSizeBeforeDelete - 1);
    }

    @Test
    @Transactional
    void deleteTeams() throws Exception {
        int databaseSizeBeforeDelete = teamRepository.findAll().size();

        // Delete the teams
        restTeamMockMvc
                .perform(
                        delete("/api/teams")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(List.of(1L, 2L))))
                .andExpect(status().isOk());

        // Validate the database contains two less items
        List<Team> teamList = teamRepository.findAll();
        assertThat(teamList).hasSize(databaseSizeBeforeDelete - 2);
    }

    @Test
    @Transactional
    void getTeam() throws Exception {
        restTeamMockMvc
                .perform(get("/api/teams/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.name").value("Development Team"))
                .andExpect(jsonPath("$.slogan").value("Building the Future"))
                .andExpect(
                        jsonPath("$.description")
                                .value("Focused on developing new products and features."));
    }

    @Test
    @Transactional
    void getNonExistingTeam() throws Exception {
        // Get the team
        restTeamMockMvc
                .perform(get("/api/teams/{id}", Long.MAX_VALUE))
                .andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void searchTeams() throws Exception {
        // Search for all teams - we're not testing the search functionality here,
        // just verifying that the endpoint works and returns a valid response
        restTeamMockMvc
                .perform(
                        post("/api/teams/search")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE));
    }

    @Test
    @Transactional
    void searchTeamsWithQuery() throws Exception {
        restTeamMockMvc
                .perform(
                        post("/api/teams/search")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE));
    }

    @Test
    @Transactional
    void getTeamMembers() throws Exception {
        restTeamMockMvc
                .perform(get("/api/teams/{teamId}/members", 1L))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isNotEmpty());
    }

    @Test
    @Transactional
    void getTeamsByUserId() throws Exception {
        // Use an existing user ID from the test database
        Long userId = 1L;

        // Get teams for the user
        restTeamMockMvc
                .perform(get("/api/teams/users/{userId}", userId))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @Transactional
    void addUsersToTeam() throws Exception {
        TeamController.ListUserIdsAndRoleDTO userIdsAndRoleDTO =
                new TeamController.ListUserIdsAndRoleDTO();
        userIdsAndRoleDTO.setUserIds(List.of(15L, 16L));
        userIdsAndRoleDTO.setRole("member");

        // Add users to the team
        restTeamMockMvc
                .perform(
                        post("/api/teams/{teamId}/add-users", 1L)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(userIdsAndRoleDTO)))
                .andExpect(status().isOk());

        // Verify users were added to the team
        List<UserTeam> userTeams =
                userTeamRepository.findAll().stream()
                        .filter(ut -> ut.getId().getTeamId().equals(1L))
                        .toList();
        assertThat(userTeams).hasSize(14);
        assertThat(userTeams.stream().map(ut -> ut.getId().getUserId()).toList()).contains(1L, 2L);
        assertThat(userTeams)
                .filteredOn(ut -> List.of(15L, 16L).contains(ut.getId().getUserId()))
                .allSatisfy(ut -> assertThat(ut.getId().getRoleName()).isEqualTo("member"));
    }

    @Test
    @Transactional
    void findUsersNotInTeam() throws Exception {

        // Search for users not in the team
        restTeamMockMvc
                .perform(
                        get("/api/teams/searchUsersNotInTeam")
                                .param("userTerm", "")
                                .param("teamId", "1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @Transactional
    void removeUserFromTeam() throws Exception {

        Team team = teamRepository.findById(1L).orElseThrow();

        // Remove the user from the team
        restTeamMockMvc
                .perform(delete("/api/teams/{teamId}/users/{userId}", team.getId(), 1L))
                .andExpect(status().isOk());

        // Verify the user was removed
        List<Long> userIds =
                userTeamRepository.findAll().stream()
                        .filter(ut -> ut.getId().getTeamId().equals(team.getId()))
                        .map(it -> it.getUser().getId())
                        .toList();
        assertThat(userIds).doesNotContain(1L);
    }

    @Test
    @Transactional
    void getUserRoleInTeam() throws Exception {
        Team team = teamRepository.findById(1L).orElseThrow();

        // Add a user to the team with a specific role
        UserTeamId userTeamId = new UserTeamId(14L, team.getId(), "manager");
        UserTeam userTeam = new UserTeam();
        userTeam.setId(userTeamId);

        // Get the user and team entities
        User user = em.find(User.class, 14L);
        if (user == null) {
            throw new IllegalStateException("User with ID 1 not found");
        }

        userTeam.setUser(user);
        userTeam.setTeam(team);

        userTeamRepository.saveAndFlush(userTeam);

        // Get the user's role in the team
        restTeamMockMvc
                .perform(get("/api/teams/{teamId}/users/{userId}/role", team.getId(), 14L))
                .andExpect(status().isOk())
                .andExpect(content().contentType("text/plain;charset=UTF-8"))
                .andExpect(jsonPath("$.role").value("manager"));
    }

    @Test
    @Transactional
    void checkIfTeamHasManager() throws Exception {
        restTeamMockMvc
                .perform(get("/api/teams/{teamId}/has-manager", 1L))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.result").value(true));

        restTeamMockMvc
                .perform(get("/api/teams/{teamId}/has-manager", 18L))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.result").value(false));
    }
}
