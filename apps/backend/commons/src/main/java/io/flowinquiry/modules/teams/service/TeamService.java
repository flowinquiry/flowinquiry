package io.flowinquiry.modules.teams.service;

import static io.flowinquiry.query.QueryUtils.createSpecification;

import io.flowinquiry.exceptions.ResourceNotFoundException;
import io.flowinquiry.modules.teams.domain.Team;
import io.flowinquiry.modules.teams.domain.TeamRole;
import io.flowinquiry.modules.teams.repository.TeamRepository;
import io.flowinquiry.modules.teams.repository.TeamRoleRepository;
import io.flowinquiry.modules.teams.service.dto.TeamDTO;
import io.flowinquiry.modules.teams.service.event.NewTeamCreatedEvent;
import io.flowinquiry.modules.teams.service.event.NewUsersAddedIntoTeamEvent;
import io.flowinquiry.modules.teams.service.event.RemoveUserOutOfTeamEvent;
import io.flowinquiry.modules.teams.service.mapper.TeamMapper;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.domain.UserTeam;
import io.flowinquiry.modules.usermanagement.domain.UserTeamId;
import io.flowinquiry.modules.usermanagement.repository.UserRepository;
import io.flowinquiry.modules.usermanagement.repository.UserTeamRepository;
import io.flowinquiry.modules.usermanagement.service.dto.UserDTO;
import io.flowinquiry.modules.usermanagement.service.dto.UserWithTeamRoleDTO;
import io.flowinquiry.modules.usermanagement.service.mapper.UserMapper;
import io.flowinquiry.query.QueryDTO;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Optional;
import org.apache.commons.lang3.StringUtils;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TeamService {

    static final String ROLE_GUEST = "guest";

    static final String ROLE_MEMBER = "member";

    static final String ROLE_MANAGER = "manager";

    private final TeamRepository teamRepository;

    private final UserRepository userRepository;

    private final UserTeamRepository userTeamRepository;

    private final TeamRoleRepository teamRoleRepository;

    private final TeamMapper teamMapper;

    private final UserMapper userMapper;

    private final ApplicationEventPublisher eventPublisher;

    public TeamService(
            TeamRepository teamRepository,
            UserRepository userRepository,
            UserTeamRepository userTeamRepository,
            TeamRoleRepository teamRoleRepository,
            TeamMapper teamMapper,
            UserMapper userMapper,
            ApplicationEventPublisher eventPublisher) {
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
        this.userTeamRepository = userTeamRepository;
        this.teamRoleRepository = teamRoleRepository;
        this.teamMapper = teamMapper;
        this.userMapper = userMapper;
        this.eventPublisher = eventPublisher;
    }

    public TeamDTO createTeam(TeamDTO teamDTO) {
        Team team = teamMapper.toEntity(teamDTO);
        TeamDTO savedTeam = teamMapper.toDto(teamRepository.save(team));
        eventPublisher.publishEvent(new NewTeamCreatedEvent(this, savedTeam));
        return savedTeam;
    }

    public TeamDTO updateTeam(TeamDTO updatedTeam) {
        Team existingTeam =
                teamRepository
                        .findById(updatedTeam.getId())
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Team not found with id: " + updatedTeam.getId()));
        teamMapper.updateFromDto(updatedTeam, existingTeam);

        return teamMapper.toDto(teamRepository.save(existingTeam));
    }

    public void deleteTeam(Long id) {
        Team existingTeam =
                teamRepository
                        .findById(id)
                        .orElseThrow(
                                () -> new EntityNotFoundException("Team not found with id: " + id));

        teamRepository.delete(existingTeam);
    }

    @Transactional
    public void deleteTeams(List<Long> ids) {
        teamRepository.deleteAllByIdInBatch(ids);
    }

    @Transactional(readOnly = true)
    public Optional<TeamDTO> findTeamById(Long id) {
        return teamRepository.findById(id).map(teamMapper::toDto);
    }

    @Transactional(readOnly = true)
    public Page<TeamDTO> findTeams(Optional<QueryDTO> queryDTO, Pageable pageable) {
        Specification<Team> spec = createSpecification(queryDTO.orElse(null));
        return teamRepository.findAll(spec, pageable).map(teamMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<TeamDTO> findAllTeamsByUserId(Long userId) {
        return teamRepository.findTeamsByUserId(userId).stream().map(teamMapper::toDto).toList();
    }

    public List<UserWithTeamRoleDTO> getUsersByTeam(Long teamId) {
        return teamRepository.findUsersByTeamId(teamId);
    }

    @Transactional(readOnly = true)
    public List<UserDTO> findUsersNotInTeam(String searchTerm, Long teamId, Pageable pageable) {
        return userMapper.toDtos(teamRepository.findUsersNotInTeam(searchTerm, teamId, pageable));
    }

    public void addUsersToTeam(List<Long> userIds, String roleName, Long teamId) {
        // Fetch the authority entity
        Team team =
                teamRepository
                        .findById(teamId)
                        .orElseThrow(
                                () -> new IllegalArgumentException("Team not found: " + teamId));

        TeamRole teamRole =
                teamRoleRepository
                        .findById(roleName)
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Invalid role name: " + roleName));

        // Fetch the users and associate them with the authority
        List<User> users = userRepository.findAllById(userIds);

        // Ensure all user IDs are valid
        if (users.size() != userIds.size()) {
            throw new IllegalArgumentException("Some user IDs are invalid.");
        }

        List<UserTeam> userTeams =
                users.stream()
                        .map(
                                user ->
                                        new UserTeam(
                                                new UserTeamId(
                                                        user.getId(), team.getId(), roleName),
                                                user,
                                                team,
                                                teamRole,
                                                user.getTenantId()))
                        .toList();

        // Save all UserTeam entities in a batch
        userTeamRepository.saveAll(userTeams);

        eventPublisher.publishEvent(
                new NewUsersAddedIntoTeamEvent(this, userIds, teamId, roleName));
    }

    @Transactional
    public void removeUserFromTeam(Long userId, Long teamId) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(
                                () -> new IllegalArgumentException("User not found: " + userId));

        Team team =
                teamRepository
                        .findById(teamId)
                        .orElseThrow(
                                () -> new IllegalArgumentException("Team not found: " + teamId));

        // Remove the team from the user's teams set
        if (user.getTeams().contains(team)) {
            user.getTeams().remove(team);
            userRepository.save(user);
            eventPublisher.publishEvent(new RemoveUserOutOfTeamEvent(this, teamId, userId));
        }
    }

    public String getUserRoleInTeam(Long userId, Long teamId) {
        String role = teamRepository.findUserRoleInTeam(userId, teamId);
        return (StringUtils.isNotEmpty(role)) ? role : ROLE_GUEST;
    }

    @Transactional(readOnly = true)
    public boolean hasManager(Long teamId) {
        return teamRepository.existsManagerInTeam(teamId);
    }

    /**
     * Retrieves all users who have the 'Manager' role in the specified team.
     *
     * @param teamId the ID of the team.
     * @return a list of users who are managers of the given team.
     */
    @Transactional(readOnly = true)
    public List<User> getTeamManagers(Long teamId) {
        return teamRepository.findManagersByTeamId(teamId);
    }
}
