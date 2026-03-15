package io.flowinquiry.modules.usermanagement.controller;

import io.flowinquiry.modules.usermanagement.domain.Authority;
import io.flowinquiry.modules.usermanagement.service.AuthorityService;
import io.flowinquiry.modules.usermanagement.service.dto.AuthorityDTO;
import io.flowinquiry.modules.usermanagement.service.dto.AuthorityWithPermissionsDTO;
import io.flowinquiry.modules.usermanagement.service.dto.UserDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/authorities")
@Transactional
@Tag(name = "Authorities", description = "API endpoints for managing authorities and permissions")
@Slf4j
public class AuthorityController {

    private final AuthorityService authorityService;

    public AuthorityController(AuthorityService authorityService) {
        this.authorityService = authorityService;
    }

    /**
     * {@code POST /authorities} : Create a new authority.
     *
     * @param authority the authority to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new
     *     authority, or with status {@code 400 (Bad Request)} if the authority has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
            summary = "Create a new authority",
            description = "Creates a new authority with the given details",
            responses = {
                @ApiResponse(
                        responseCode = "201",
                        description = "Authority created successfully",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = AuthorityDTO.class))),
                @ApiResponse(responseCode = "400", description = "Invalid input"),
                @ApiResponse(responseCode = "401", description = "Unauthorized"),
                @ApiResponse(responseCode = "403", description = "Forbidden - requires ROLE_ADMIN")
            })
    public AuthorityDTO createAuthority(
            @Parameter(description = "Authority to create", required = true) @Valid @RequestBody
                    Authority authority) {
        log.debug("REST request to save Authority : {}", authority);
        return authorityService.createAuthority(authority);
    }

    /**
     * {@code POST /authorities/with-permissions} : Create a new authority together with its
     * resource permissions in one transaction.
     */
    @PostMapping("/with-permissions")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
            summary = "Create a new authority with permissions",
            description = "Creates a new authority and saves its resource permissions atomically",
            responses = {
                @ApiResponse(
                        responseCode = "201",
                        description = "Authority with permissions created successfully",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                AuthorityWithPermissionsDTO
                                                                        .class))),
                @ApiResponse(responseCode = "400", description = "Invalid input"),
                @ApiResponse(responseCode = "401", description = "Unauthorized"),
                @ApiResponse(responseCode = "403", description = "Forbidden - requires ROLE_ADMIN")
            })
    public AuthorityWithPermissionsDTO createAuthorityWithPermissions(
            @Parameter(description = "Authority with permissions to create", required = true)
                    @RequestBody
                    AuthorityWithPermissionsDTO request) {
        log.debug("REST request to save Authority with permissions : {}", request);
        return authorityService.createAuthorityWithPermissions(request);
    }

    /**
     * {@code GET /authorities} : get all the authorities.
     *
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of authorities
     *     in body.
     */
    @GetMapping("")
    @Operation(
            summary = "Get all authorities",
            description = "Returns a paginated list of all authorities",
            responses = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved authorities",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = Page.class))),
                @ApiResponse(responseCode = "401", description = "Unauthorized"),
                @ApiResponse(responseCode = "403", description = "Forbidden")
            })
    public Page<AuthorityDTO> getAllAuthorities(
            @Parameter(description = "Pagination information") Pageable pageable) {
        return authorityService.findAllAuthorities(pageable);
    }

    /**
     * {@code GET /authorities/:id} : get the "id" authority.
     *
     * @param name the id of the authority to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the authority,
     *     or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{name}")
    @Operation(
            summary = "Get authority by name",
            description = "Retrieves an authority by its name",
            responses = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved authority",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = AuthorityDTO.class))),
                @ApiResponse(responseCode = "404", description = "Authority not found"),
                @ApiResponse(responseCode = "401", description = "Unauthorized"),
                @ApiResponse(responseCode = "403", description = "Forbidden")
            })
    public AuthorityDTO getAuthority(
            @PathVariable @Parameter(description = "Name of the authority", required = true)
                    String name) {
        return authorityService
                .findAuthorityByName(name)
                .orElseThrow(
                        () ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND, "Authority not found: " + name));
    }

    /**
     * {@code DELETE /authorities/:id} : delete the "id" authority.
     *
     * @param id the id of the authority to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
            summary = "Delete authority",
            description = "Deletes an authority by its ID",
            responses = {
                @ApiResponse(responseCode = "204", description = "Authority successfully deleted"),
                @ApiResponse(responseCode = "401", description = "Unauthorized"),
                @ApiResponse(responseCode = "403", description = "Forbidden - requires ROLE_ADMIN"),
                @ApiResponse(responseCode = "404", description = "Authority not found")
            })
    public void deleteAuthority(
            @PathVariable @Parameter(description = "ID of the authority to delete", required = true)
                    String id) {
        authorityService.deleteAuthority(id);
    }

    @GetMapping("/{authorityName}/users")
    @Operation(
            summary = "Get users by authority",
            description = "Retrieves a paginated list of users with the specified authority",
            responses = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved users",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = Page.class))),
                @ApiResponse(responseCode = "401", description = "Unauthorized"),
                @ApiResponse(responseCode = "403", description = "Forbidden"),
                @ApiResponse(responseCode = "404", description = "Authority not found")
            })
    public Page<UserDTO> getUsersByAuthority(
            @Parameter(description = "Name of the authority", required = true)
                    @PathVariable("authorityName")
                    String authorityName,
            @Parameter(description = "Pagination information") Pageable pageable) {
        return authorityService.findAllUsersByAuthority(authorityName, pageable);
    }

    @GetMapping("/searchUsersNotInAuthority")
    @Operation(
            summary = "Search users not in authority",
            description = "Searches for users that don't have the specified authority",
            responses = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved users",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        array =
                                                @ArraySchema(
                                                        schema =
                                                                @Schema(
                                                                        implementation =
                                                                                UserDTO.class)))),
                @ApiResponse(responseCode = "401", description = "Unauthorized"),
                @ApiResponse(responseCode = "403", description = "Forbidden")
            })
    public List<UserDTO> findUsersNotInAuthority(
            @Parameter(description = "Search term for user", required = true)
                    @RequestParam("userTerm")
                    String searchTerm,
            @Parameter(description = "Name of the authority", required = true)
                    @RequestParam("authorityName")
                    String authorityName) {
        return authorityService.findUsersNotInAuthority(
                searchTerm, authorityName, PageRequest.of(0, 20));
    }

    @PostMapping("/{authorityName}/add-users")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
            summary = "Add users to authority",
            description = "Adds multiple users to the specified authority",
            responses = {
                @ApiResponse(
                        responseCode = "204",
                        description = "Users successfully added to authority"),
                @ApiResponse(responseCode = "401", description = "Unauthorized"),
                @ApiResponse(responseCode = "403", description = "Forbidden"),
                @ApiResponse(responseCode = "404", description = "Authority or users not found")
            })
    public void addUsersToAuthority(
            @Parameter(description = "Name of the authority", required = true)
                    @PathVariable("authorityName")
                    String authorityName,
            @Parameter(description = "List of user IDs to add to the authority", required = true)
                    @RequestBody
                    List<Long> userIds) {
        authorityService.addUsersToAuthority(userIds, authorityName);
    }

    @DeleteMapping("/{authorityName}/users/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
            summary = "Remove user from authority",
            description = "Removes a user from the specified authority",
            responses = {
                @ApiResponse(
                        responseCode = "204",
                        description = "User successfully removed from authority"),
                @ApiResponse(responseCode = "401", description = "Unauthorized"),
                @ApiResponse(responseCode = "403", description = "Forbidden"),
                @ApiResponse(responseCode = "404", description = "Authority or user not found")
            })
    public void removeUserFromAuthority(
            @Parameter(description = "ID of the user to remove", required = true)
                    @PathVariable("userId")
                    Long userId,
            @Parameter(description = "Name of the authority", required = true) @PathVariable
                    String authorityName) {
        authorityService.removeUserFromAuthority(userId, authorityName);
    }
}
