package io.flowinquiry.modules.teams.controller;

import io.flowinquiry.modules.fss.service.StorageService;
import io.flowinquiry.modules.fss.service.event.ResourceRemoveEvent;
import io.flowinquiry.modules.teams.service.TeamService;
import io.flowinquiry.modules.teams.service.dto.TeamDTO;
import io.flowinquiry.modules.teams.service.dto.UserTeamsContextDTO;
import io.flowinquiry.modules.usermanagement.AuthoritiesConstants;
import io.flowinquiry.modules.usermanagement.service.dto.UserDTO;
import io.flowinquiry.modules.usermanagement.service.dto.UserWithTeamRoleDTO;
import io.flowinquiry.query.QueryDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.json.Json;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.Getter;
import lombok.Setter;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/teams")
@Tag(name = "Team Management", description = "API endpoints for managing teams and team members")
public class TeamController {

    private final TeamService teamService;
    private final StorageService storageService;
    private final ApplicationEventPublisher eventPublisher;

    public TeamController(
            TeamService teamService,
            StorageService storageService,
            ApplicationEventPublisher eventPublisher) {
        this.teamService = teamService;
        this.storageService = storageService;
        this.eventPublisher = eventPublisher;
    }

    @Operation(
            summary = "Create a new team",
            description =
                    "Creates a new team with the provided information and optional logo image")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "201",
                        description = "Team successfully created",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = TeamDTO.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Bad request - invalid input",
                        content = @Content)
            })
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public TeamDTO createTeam(
            @Parameter(description = "Team data to create", required = true) @RequestPart("teamDTO")
                    TeamDTO team,
            @Parameter(description = "Team logo image file (optional)")
                    @RequestPart(value = "file", required = false)
                    MultipartFile file)
            throws Exception {
        if (file != null && !file.isEmpty()) {
            String avatarPath =
                    storageService.uploadImage("teams", file.getInputStream(), team.getLogoUrl());
            team.setLogoUrl(avatarPath);
        }
        return teamService.createTeam(team);
    }

    @Operation(
            summary = "Update an existing team",
            description =
                    "Updates an existing team with the provided information and optional new logo image")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Team successfully updated",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = TeamDTO.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Bad request - invalid input",
                        content = @Content),
                @ApiResponse(
                        responseCode = "404",
                        description = "Team not found",
                        content = @Content)
            })
    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public TeamDTO updateTeam(
            @Parameter(description = "Updated team data", required = true) @RequestPart("teamDTO")
                    TeamDTO team,
            @Parameter(description = "New team logo image file (optional)")
                    @RequestPart(value = "file", required = false)
                    MultipartFile file)
            throws Exception {
        Optional<String> fileRemovedPath = Optional.empty();
        if (file != null && !file.isEmpty()) {
            fileRemovedPath = Optional.ofNullable(team.getLogoUrl());
            String teamLogoPath =
                    storageService.uploadImage("teams", team.getLogoUrl(), file.getInputStream());
            team.setLogoUrl(teamLogoPath);
        }
        TeamDTO updatedTeam = teamService.updateTeam(team);
        fileRemovedPath.ifPresent(
                s -> eventPublisher.publishEvent(new ResourceRemoveEvent(this, s)));
        return updatedTeam;
    }

    @Operation(summary = "Delete a team", description = "Deletes a team by its ID")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Team successfully deleted"),
                @ApiResponse(
                        responseCode = "404",
                        description = "Team not found",
                        content = @Content)
            })
    @DeleteMapping("/{id}")
    public void deleteTeam(
            @PathVariable @Parameter(description = "ID of the team to delete", required = true)
                    Long id) {
        teamService.deleteTeam(id);
    }

    @Operation(
            summary = "Delete multiple teams",
            description = "Deletes multiple teams by their IDs")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Teams successfully deleted"),
                @ApiResponse(
                        responseCode = "400",
                        description = "Bad request - invalid input",
                        content = @Content)
            })
    @DeleteMapping
    public void deleteTeams(
            @Parameter(description = "List of team IDs to delete", required = true) @RequestBody
                    List<Long> ids) {
        teamService.deleteTeams(ids);
    }

    @Operation(summary = "Get team by ID", description = "Retrieves a team by its ID")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved team",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = TeamDTO.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Team not found",
                        content = @Content)
            })
    @GetMapping("/{id}")
    public TeamDTO findTeamById(
            @PathVariable @Parameter(description = "ID of the team to retrieve", required = true)
                    Long id) {
        return teamService
                .findTeamById(id)
                .orElseThrow(
                        () ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND, "Team not found with id: " + id));
    }

    @Operation(
            summary = "Search teams",
            description = "Search for teams based on query criteria with pagination")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved teams",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = Page.class))),
                @ApiResponse(responseCode = "400", description = "Bad request", content = @Content)
            })
    @PostMapping("/search")
    public Page<TeamDTO> findTeams(
            @Parameter(description = "Query parameters for filtering teams") @Valid @RequestBody
                    Optional<QueryDTO> queryDTO,
            @Parameter(description = "Pagination information") Pageable pageable) {
        return teamService.findTeams(queryDTO, pageable);
    }

    @Operation(
            summary = "Get team members",
            description = "Retrieves all members of a specific team with their roles")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved team members",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                UserWithTeamRoleDTO.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Team not found",
                        content = @Content)
            })
    @GetMapping("/{teamId}/members")
    public List<UserWithTeamRoleDTO> findUsersByTeamId(
            @PathVariable @Parameter(description = "ID of the team", required = true) Long teamId) {
        return teamService.getUsersByTeam(teamId);
    }

    @Operation(
            summary = "Get teams by user ID",
            description = "Retrieves all teams that a specific user belongs to")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved teams",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = TeamDTO.class))),
                @ApiResponse(
                        responseCode = "204",
                        description = "User is not a member of any team",
                        content = @Content)
            })
    @GetMapping("/users/{userId}")
    public List<TeamDTO> getTeamsByUserId(
            @PathVariable @Parameter(description = "ID of the user", required = true) Long userId) {
        return teamService.findAllTeamsByUserId(userId);
    }

    @Operation(
            summary = "Get team-membership context for a user",
            description =
                    "Returns all teams the user belongs to together with their role in each team,"
                            + " in a single query. Admins receive all teams with a synthetic manager"
                            + " role.")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved team context",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                UserTeamsContextDTO.class)))
            })
    @GetMapping("/users/{userId}/teams-context")
    public UserTeamsContextDTO getTeamsContextByUserId(
            @PathVariable @Parameter(description = "ID of the user", required = true) Long userId,
            Authentication authentication) {
        boolean isAdmin =
                authentication != null
                        && authentication.getAuthorities().stream()
                                .anyMatch(a -> AuthoritiesConstants.ADMIN.equals(a.getAuthority()));
        return teamService.findTeamsContextByUserId(userId, isAdmin);
    }

    @Operation(
            summary = "Add users to a team",
            description = "Adds multiple users to a team with a specified role")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Users successfully added to team"),
                @ApiResponse(
                        responseCode = "400",
                        description = "Bad request - invalid input",
                        content = @Content),
                @ApiResponse(
                        responseCode = "404",
                        description = "Team or user not found",
                        content = @Content)
            })
    @PostMapping("/{teamId}/add-users")
    public void addUsersToTeam(
            @PathVariable @Parameter(description = "ID of the team", required = true) Long teamId,
            @Parameter(description = "List of user IDs and role to assign", required = true)
                    @RequestBody
                    ListUserIdsAndRoleDTO userIdsAndRoleDTO) {
        teamService.addUsersToTeam(
                userIdsAndRoleDTO.getUserIds(), userIdsAndRoleDTO.getRole(), teamId);
    }

    @Operation(
            summary = "Search for users not in a team",
            description = "Searches for users that are not members of a specific team")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved users",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = UserDTO.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Team not found",
                        content = @Content)
            })
    @GetMapping("/searchUsersNotInTeam")
    public List<UserDTO> findUsersNotInTeam(
            @Parameter(description = "Search term for finding users", required = true)
                    @RequestParam("userTerm")
                    String searchTerm,
            @Parameter(description = "ID of the team", required = true) @RequestParam("teamId")
                    Long teamId) {
        PageRequest pageRequest = PageRequest.of(0, 20);
        return teamService.findUsersNotInTeam(searchTerm, teamId, pageRequest);
    }

    @Operation(
            summary = "Remove a user from a team",
            description = "Removes a specific user from a team")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "User successfully removed from team"),
                @ApiResponse(
                        responseCode = "404",
                        description = "Team or user not found",
                        content = @Content)
            })
    @DeleteMapping("/{teamId}/users/{userId}")
    public void removeUserFromTeam(
            @PathVariable @Parameter(description = "ID of the user to remove", required = true)
                    Long userId,
            @PathVariable @Parameter(description = "ID of the team", required = true) Long teamId) {
        teamService.removeUserFromTeam(userId, teamId);
    }

    @Operation(
            summary = "Update user role in team",
            description = "Changes the role of a user within a team")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "204", description = "Role updated successfully"),
                @ApiResponse(responseCode = "400", description = "Invalid role or only manager"),
                @ApiResponse(responseCode = "404", description = "Team or user not found")
            })
    @PutMapping("/{teamId}/users/{userId}/role")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateUserRoleInTeam(
            @PathVariable @Parameter(description = "ID of the team", required = true) Long teamId,
            @PathVariable @Parameter(description = "ID of the user", required = true) Long userId,
            @RequestBody Map<String, String> body) {
        teamService.updateUserRoleInTeam(userId, teamId, body.get("role"));
    }

    @Operation(
            summary = "Get user role in team",
            description = "Retrieves the role of a specific user in a team")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved user role",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(example = "{\"role\": \"ADMIN\"}"))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Team or user not found",
                        content = @Content)
            })
    @GetMapping("/{teamId}/users/{userId}/role")
    public String getUserRoleInTeam(
            @PathVariable @Parameter(description = "ID of the team", required = true) Long teamId,
            @PathVariable @Parameter(description = "ID of the user", required = true) Long userId) {
        String role = teamService.getUserRoleInTeam(userId, teamId);
        return Json.createObjectBuilder().add("role", role).build().toString();
    }

    @Operation(
            summary = "Check if team has a manager",
            description = "Checks if a specific team has at least one manager")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully checked team manager status",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(example = "{\"result\": true}"))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Team not found",
                        content = @Content)
            })
    @GetMapping("/{teamId}/has-manager")
    public Map<String, Boolean> checkIfTeamHasManager(
            @Parameter(description = "ID of the team to check", required = true) @PathVariable
                    Long teamId) {
        return Map.of("result", teamService.hasManager(teamId));
    }

    @Getter
    @Setter
    public static class ListUserIdsAndRoleDTO {
        private List<Long> userIds;
        private String role;
    }
}
