package io.flowinquiry.modules.teams.service;

import static io.flowinquiry.modules.teams.service.TeamService.ROLE_GUEST;
import static io.flowinquiry.modules.teams.service.TeamService.ROLE_MANAGER;
import static io.flowinquiry.modules.teams.service.TeamService.ROLE_MEMBER;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import io.flowinquiry.exceptions.ResourceNotFoundException;
import io.flowinquiry.it.IntegrationTest;
import io.flowinquiry.modules.teams.service.dto.TeamDTO;
import io.flowinquiry.modules.teams.service.event.NewTeamCreatedEvent;
import io.flowinquiry.modules.teams.service.event.RemoveUserOutOfTeamEvent;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.service.dto.UserDTO;
import io.flowinquiry.modules.usermanagement.service.dto.UserWithTeamRoleDTO;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
public class TeamServiceIT {

    @Autowired private TeamService teamService;

    @Autowired private ApplicationEventPublisher realEventPublisher;
    private ApplicationEventPublisher spyEventPublisher;

    @BeforeEach
    void setUp() {
        spyEventPublisher = Mockito.spy(realEventPublisher);
        ReflectionTestUtils.setField(teamService, "eventPublisher", spyEventPublisher);
        doNothing().when(spyEventPublisher).publishEvent(any());
    }

    @Test
    void shouldCreateTeamSuccessfully() {
        TeamDTO teamDTO = teamService.findTeamById(1L).orElseThrow();
        teamDTO.setId(null);
        teamDTO.setName("Flow Inquiry Team");
        teamDTO.setSlogan("Driving Innovation");
        teamDTO.setDescription("A team dedicated to workflow excellence.");

        TeamDTO savedTeam = teamService.createTeam(teamDTO);

        assertThat(savedTeam).isNotNull();
        assertThat(savedTeam.getId()).isNotNull();
        assertThat(savedTeam.getName()).isEqualTo("Flow Inquiry Team");
        assertThat(savedTeam.getSlogan()).isEqualTo("Driving Innovation");
        assertThat(savedTeam.getDescription())
                .isEqualTo("A team dedicated to workflow excellence.");
        ArgumentCaptor<NewTeamCreatedEvent> eventCaptor =
                ArgumentCaptor.forClass(NewTeamCreatedEvent.class);
        verify(spyEventPublisher, times(1)).publishEvent(eventCaptor.capture());
    }

    @Test
    void shouldUpdateTeamSuccessfully() {
        TeamDTO teamDTO = new TeamDTO();
        teamDTO.setName("Initial Team Name");
        teamDTO.setSlogan("Initial Slogan");
        teamDTO.setDescription("Initial Description");

        TeamDTO savedTeam = teamService.createTeam(teamDTO);
        Long teamId = savedTeam.getId();

        savedTeam.setName("Updated Team Name");
        savedTeam.setSlogan("Updated Slogan");
        savedTeam.setDescription("Updated Description");

        TeamDTO updatedTeam = teamService.updateTeam(savedTeam);

        // Then: Ensure values are correctly updated
        assertThat(updatedTeam).isNotNull();
        assertThat(updatedTeam.getId()).isEqualTo(teamId);
        assertThat(updatedTeam.getName()).isEqualTo("Updated Team Name");
        assertThat(updatedTeam.getSlogan()).isEqualTo("Updated Slogan");
        assertThat(updatedTeam.getDescription()).isEqualTo("Updated Description");

        // Verify the updated team in the database
        Optional<TeamDTO> fetchedTeam = teamService.findTeamById(teamId);
        assertThat(fetchedTeam).isPresent();
        assertThat(fetchedTeam.get().getName()).isEqualTo("Updated Team Name");
        assertThat(fetchedTeam.get().getSlogan()).isEqualTo("Updated Slogan");
        assertThat(fetchedTeam.get().getDescription()).isEqualTo("Updated Description");
    }

    @Test
    void shouldFailToUpdateNonExistentTeam() {
        TeamDTO nonExistentTeam = new TeamDTO();
        nonExistentTeam.setId(9999L);
        nonExistentTeam.setName("Non-Existent Team");

        assertThatThrownBy(() -> teamService.updateTeam(nonExistentTeam))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Team not found with id: 9999");
    }

    @Test
    void shouldGetUsersByTeamSuccessfully() {
        assertThat(teamService.getUsersByTeam(1L)).hasSize(12);
        teamService.addUsersToTeam(List.of(13L, 14L), ROLE_MEMBER, 1L);

        List<UserWithTeamRoleDTO> usersByTeam = teamService.getUsersByTeam(1L);

        assertThat(usersByTeam).hasSize(14);
    }

    @Test
    void shouldReturnEmptyListWhenNoUsersInTeam() {
        TeamDTO teamDTO = new TeamDTO();
        teamDTO.setName("Empty Team");
        teamDTO.setSlogan("No members yet");
        teamDTO.setDescription("A test team without members");

        TeamDTO savedTeam = teamService.createTeam(teamDTO);
        Long teamId = savedTeam.getId();

        List<UserWithTeamRoleDTO> usersByTeam = teamService.getUsersByTeam(teamId);

        assertThat(usersByTeam).isEmpty();
    }

    @Test
    void shouldRemoveUserFromTeamSuccessfully() {
        assertThat(teamService.getUsersByTeam(1L)).hasSize(12);
        teamService.removeUserFromTeam(1L, 1L);
        assertThat(teamService.getUsersByTeam(1L)).hasSize(11);

        ArgumentCaptor<RemoveUserOutOfTeamEvent> eventCaptor =
                ArgumentCaptor.forClass(RemoveUserOutOfTeamEvent.class);
        verify(spyEventPublisher, times(1)).publishEvent(eventCaptor.capture());
    }

    @Test
    void shouldThrowExceptionWhenRemovingUserFromNonExistentTeam() {
        assertThatThrownBy(() -> teamService.removeUserFromTeam(1L, 9999L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Team not found");
    }

    @Test
    void shouldBeSilentIfUserNotBelongInTeam() {
        assertThat(teamService.getUsersByTeam(1L)).hasSize(12);
        teamService.removeUserFromTeam(15L, 1L);
        assertThat(teamService.getUsersByTeam(1L)).hasSize(12);
        ArgumentCaptor<RemoveUserOutOfTeamEvent> eventCaptor =
                ArgumentCaptor.forClass(RemoveUserOutOfTeamEvent.class);
        verify(spyEventPublisher, times(0)).publishEvent(eventCaptor.capture());
    }

    @Test
    void shouldReturnCorrectUserRoleInTeam() {
        assertThat(teamService.getUserRoleInTeam(1L, 1L)).isEqualTo(ROLE_GUEST);
        assertThat(teamService.getUserRoleInTeam(3L, 1L)).isEqualTo(ROLE_MEMBER);
        assertThat(teamService.getUserRoleInTeam(7L, 1L)).isEqualTo(ROLE_MANAGER);
        assertThat(teamService.getUserRoleInTeam(15L, 1L)).isEqualTo(ROLE_GUEST);
    }

    @Test
    void shouldDeleteTeamSuccessfully() {
        // Create a new team to delete
        TeamDTO teamDTO = new TeamDTO();
        teamDTO.setName("Team to Delete");
        teamDTO.setSlogan("Delete Me");
        teamDTO.setDescription("This team will be deleted");

        TeamDTO savedTeam = teamService.createTeam(teamDTO);
        Long teamId = savedTeam.getId();

        // Verify team exists
        assertThat(teamService.findTeamById(teamId)).isPresent();

        // Delete the team
        teamService.deleteTeam(teamId);

        // Verify team no longer exists
        assertThat(teamService.findTeamById(teamId)).isEmpty();
    }

    @Test
    void shouldDeleteMultipleTeamsSuccessfully() {
        // Create first team to delete
        TeamDTO teamDTO1 = new TeamDTO();
        teamDTO1.setName("Team to Delete 1");
        teamDTO1.setSlogan("Delete Me 1");
        teamDTO1.setDescription("This team will be deleted 1");

        TeamDTO savedTeam1 = teamService.createTeam(teamDTO1);
        Long teamId1 = savedTeam1.getId();

        // Create second team to delete
        TeamDTO teamDTO2 = new TeamDTO();
        teamDTO2.setName("Team to Delete 2");
        teamDTO2.setSlogan("Delete Me 2");
        teamDTO2.setDescription("This team will be deleted 2");

        TeamDTO savedTeam2 = teamService.createTeam(teamDTO2);
        Long teamId2 = savedTeam2.getId();

        // Verify teams exist
        assertThat(teamService.findTeamById(teamId1)).isPresent();
        assertThat(teamService.findTeamById(teamId2)).isPresent();

        // Delete the teams individually
        teamService.deleteTeam(teamId1);
        teamService.deleteTeam(teamId2);

        // Verify teams no longer exist
        assertThat(teamService.findTeamById(teamId1)).isEmpty();
        assertThat(teamService.findTeamById(teamId2)).isEmpty();
    }

    @Test
    void shouldFindTeamByIdSuccessfully() {
        // Using teamId 1 as suggested in the issue description
        Optional<TeamDTO> teamOptional = teamService.findTeamById(1L);

        // Verify team exists and has correct properties
        assertThat(teamOptional).isPresent();
        TeamDTO team = teamOptional.get();
        assertThat(team.getId()).isEqualTo(1L);
        // We can't assert on name, slogan, or description as we don't know what they are in the
        // test database
        // But we can assert that they're not null or empty
        assertThat(team.getName()).isNotEmpty();
    }

    @Test
    void shouldReturnEmptyWhenTeamIdNotFound() {
        // Use a very large ID that is unlikely to exist
        Optional<TeamDTO> teamOptional = teamService.findTeamById(99999L);

        // Verify team does not exist
        assertThat(teamOptional).isEmpty();
    }

    @Test
    void shouldFindTeamsSuccessfully() {
        // Create a PageRequest for pagination
        PageRequest pageRequest = PageRequest.of(0, 10);

        // Call findTeams with empty query (returns all teams)
        Page<TeamDTO> teamsPage = teamService.findTeams(Optional.empty(), pageRequest);

        // Verify that teams are returned
        assertThat(teamsPage).isNotNull();
        assertThat(teamsPage.getContent()).isNotEmpty();

        // Create a new team to ensure we have at least one team
        TeamDTO newTeam = new TeamDTO();
        newTeam.setName("Test Team for Find");
        newTeam.setSlogan("Find Me");
        newTeam.setDescription("This team is for testing findTeams");
        teamService.createTeam(newTeam);

        // Call findTeams again to ensure the new team is included
        Page<TeamDTO> updatedTeamsPage = teamService.findTeams(Optional.empty(), pageRequest);
        assertThat(updatedTeamsPage.getContent().size())
                .isGreaterThanOrEqualTo(teamsPage.getContent().size());
    }

    @Test
    void shouldFindAllTeamsByUserIdSuccessfully() {
        // Using userId 1 as suggested in the issue description
        List<TeamDTO> teams = teamService.findAllTeamsByUserId(1L);

        // Verify that teams are returned
        assertThat(teams).isNotEmpty();

        // Verify that team with ID 1 is in the list (as per fw_user_team_test.csv)
        assertThat(teams.stream().anyMatch(team -> team.getId().equals(1L))).isTrue();
    }

    @Test
    void shouldFindUsersNotInTeamSuccessfully() {
        // Create a PageRequest for pagination
        PageRequest pageRequest = PageRequest.of(0, 10);

        // Find users not in team with ID 1
        List<UserDTO> usersNotInTeam = teamService.findUsersNotInTeam("", 1L, pageRequest);

        // Verify that the list is not null
        assertThat(usersNotInTeam).isNotNull();

        // Verify that user with ID 1 is not in the list (as they are in team 1)
        assertThat(usersNotInTeam.stream().noneMatch(user -> user.getId().equals(1L))).isTrue();
    }

    @Test
    void shouldAddUsersToTeamSuccessfully() {
        // Create a new team
        TeamDTO teamDTO = new TeamDTO();
        teamDTO.setName("Team for Adding Users");
        teamDTO.setSlogan("Add Users Test");
        teamDTO.setDescription("This team is for testing addUsersToTeam");

        TeamDTO savedTeam = teamService.createTeam(teamDTO);
        Long teamId = savedTeam.getId();

        // Get initial count of users in the team
        int initialUserCount = teamService.getUsersByTeam(teamId).size();

        // Add user with ID 1 to the team with member role
        teamService.addUsersToTeam(List.of(1L), ROLE_MEMBER, teamId);

        // Verify user was added to the team
        List<UserWithTeamRoleDTO> usersInTeam = teamService.getUsersByTeam(teamId);
        assertThat(usersInTeam).hasSize(initialUserCount + 1);

        // Verify user has the correct role
        assertThat(teamService.getUserRoleInTeam(1L, teamId)).isEqualTo(ROLE_MEMBER);

        // Verify the user is in the team
        assertThat(usersInTeam.stream().anyMatch(user -> user.getId().equals(1L))).isTrue();
    }

    @Test
    void shouldCheckIfTeamHasManagerCorrectly() {
        // Team 1 has a manager (user 7) according to fw_user_team_test.csv
        boolean hasManager = teamService.hasManager(1L);
        assertThat(hasManager).isTrue();

        // Create a new team without managers
        TeamDTO teamDTO = new TeamDTO();
        teamDTO.setName("Team without Managers");
        teamDTO.setSlogan("No Managers");
        teamDTO.setDescription("This team is for testing hasManager");

        TeamDTO savedTeam = teamService.createTeam(teamDTO);
        Long teamId = savedTeam.getId();

        // Add users with non-manager roles
        teamService.addUsersToTeam(List.of(1L), ROLE_MEMBER, teamId);
        teamService.addUsersToTeam(List.of(2L), ROLE_GUEST, teamId);

        // Verify team has no managers
        assertThat(teamService.hasManager(teamId)).isFalse();

        // Add a manager to the team
        teamService.addUsersToTeam(List.of(3L), ROLE_MANAGER, teamId);

        // Verify team now has a manager
        assertThat(teamService.hasManager(teamId)).isTrue();
    }

    @Test
    void shouldGetTeamManagersSuccessfully() {
        // Team 1 has a manager (user 7) according to fw_user_team_test.csv
        List<User> managers = teamService.getTeamManagers(1L);

        // Verify that managers are returned
        assertThat(managers).isNotEmpty();

        // Verify that user 7 is in the list of managers
        assertThat(managers.stream().anyMatch(user -> user.getId().equals(7L))).isTrue();

        // Create a new team without managers
        TeamDTO teamDTO = new TeamDTO();
        teamDTO.setName("Team for Manager Test");
        teamDTO.setSlogan("Manager Test");
        teamDTO.setDescription("This team is for testing getTeamManagers");

        TeamDTO savedTeam = teamService.createTeam(teamDTO);
        Long teamId = savedTeam.getId();

        // Verify team has no managers
        assertThat(teamService.getTeamManagers(teamId)).isEmpty();

        // Add a manager to the team
        teamService.addUsersToTeam(List.of(1L), ROLE_MANAGER, teamId);

        // Verify team now has a manager
        List<User> newManagers = teamService.getTeamManagers(teamId);
        assertThat(newManagers).hasSize(1);
        assertThat(newManagers.get(0).getId()).isEqualTo(1L);
    }
}
