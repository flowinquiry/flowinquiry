package io.flowinquiry.modules.usermanagement.controller;

import io.flowinquiry.modules.usermanagement.service.AuthorityResourcePermissionService;
import io.flowinquiry.modules.usermanagement.service.dto.AuthorityResourcePermissionDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/authority-permissions")
@Tag(
        name = "Authority Permissions",
        description = "API endpoints for managing authority resource permissions")
public class AuthorityResourcePermissionController {

    private final AuthorityResourcePermissionService authorityResourcePermissionService;

    @Autowired
    public AuthorityResourcePermissionController(
            AuthorityResourcePermissionService authorityResourcePermissionService) {
        this.authorityResourcePermissionService = authorityResourcePermissionService;
    }

    /**
     * Endpoint to get all resource permissions associated with a specific authority.
     *
     * @param authorityName The name of the authority.
     * @return A list of AuthorityResourcePermission objects.
     */
    @GetMapping("/{authorityName}")
    @Operation(
            summary = "Get permissions by authority",
            description = "Retrieves all resource permissions associated with a specific authority",
            responses = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved permissions",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        array =
                                                @ArraySchema(
                                                        schema =
                                                                @Schema(
                                                                        implementation =
                                                                                AuthorityResourcePermissionDTO
                                                                                        .class)))),
                @ApiResponse(responseCode = "401", description = "Unauthorized"),
                @ApiResponse(responseCode = "403", description = "Forbidden"),
                @ApiResponse(responseCode = "404", description = "Authority not found")
            })
    public List<AuthorityResourcePermissionDTO> getPermissionsByAuthority(
            @Parameter(description = "Name of the authority", required = true)
                    @PathVariable("authorityName")
                    String authorityName) {
        return authorityResourcePermissionService.getResourcePermissionsByAuthority(authorityName);
    }

    @PostMapping("/batchSave")
    @Operation(
            summary = "Save multiple permissions",
            description = "Saves a batch of authority resource permissions",
            responses = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully saved permissions",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        array =
                                                @ArraySchema(
                                                        schema =
                                                                @Schema(
                                                                        implementation =
                                                                                AuthorityResourcePermissionDTO
                                                                                        .class)))),
                @ApiResponse(responseCode = "400", description = "Invalid input"),
                @ApiResponse(responseCode = "401", description = "Unauthorized"),
                @ApiResponse(responseCode = "403", description = "Forbidden")
            })
    public List<AuthorityResourcePermissionDTO> savePermissions(
            @Parameter(description = "List of permissions to save", required = true) @RequestBody
                    List<AuthorityResourcePermissionDTO> permissions) {
        return authorityResourcePermissionService.saveAllPermissions(permissions);
    }
}
