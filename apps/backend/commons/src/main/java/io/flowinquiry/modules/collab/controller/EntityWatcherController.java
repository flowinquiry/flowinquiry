package io.flowinquiry.modules.collab.controller;

import io.flowinquiry.modules.collab.domain.EntityType;
import io.flowinquiry.modules.collab.service.EntityWatcherService;
import io.flowinquiry.modules.fss.service.dto.EntityWatcherDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/entity-watchers")
@Tag(name = "Entity Watchers", description = "API for managing entity watchers/followers")
public class EntityWatcherController {

    private final EntityWatcherService entityWatcherService;

    public EntityWatcherController(EntityWatcherService entityWatcherService) {
        this.entityWatcherService = entityWatcherService;
    }

    @Operation(
            summary = "Remove watcher",
            description = "Removes a user from watching/following an entity")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Watcher removed successfully")
            })
    @DeleteMapping
    public void removeWatcher(
            @Parameter(description = "Type of entity (e.g., TICKET, PROJECT)", required = true)
                    @RequestParam
                    String entityType,
            @Parameter(description = "ID of the entity", required = true) @RequestParam
                    Long entityId,
            @Parameter(description = "ID of the user to remove as watcher", required = true)
                    @RequestParam
                    Long userId) {

        entityWatcherService.removeWatcher(EntityType.valueOf(entityType), entityId, userId);
    }

    @Operation(
            summary = "Get watchers for entity",
            description = "Retrieves all users watching/following a specific entity")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Watchers retrieved successfully",
                        content =
                                @Content(schema = @Schema(implementation = EntityWatcherDTO.class)))
            })
    @GetMapping
    public List<EntityWatcherDTO> getWatchersForEntity(
            @Parameter(description = "Type of entity (e.g., TICKET, PROJECT)", required = true)
                    @RequestParam
                    String entityType,
            @Parameter(description = "ID of the entity", required = true) @RequestParam
                    Long entityId) {

        return entityWatcherService.getWatchersForEntity(EntityType.valueOf(entityType), entityId);
    }

    @Operation(
            summary = "Get watched entities for user",
            description = "Retrieves all entities that a specific user is watching/following")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Watched entities retrieved successfully",
                        content =
                                @Content(schema = @Schema(implementation = EntityWatcherDTO.class)))
            })
    @GetMapping("/user")
    public Page<EntityWatcherDTO> getWatchedEntitiesForUser(
            @Parameter(description = "ID of the user", required = true) @RequestParam Long userId,
            @Parameter(description = "Pagination parameters") Pageable pageable) {
        return entityWatcherService.getWatchedEntitiesForUser(userId, pageable);
    }

    @Operation(
            summary = "Add watchers to entity",
            description = "Adds multiple users as watchers/followers to a specific entity")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Watchers added successfully")
            })
    @PostMapping("/add")
    public void addWatchersToEntity(
            @Parameter(description = "Type of entity (e.g., TICKET, PROJECT)", required = true)
                    @RequestParam
                    String entityType,
            @Parameter(description = "ID of the entity", required = true) @RequestParam
                    Long entityId,
            @Parameter(description = "List of user IDs to add as watchers", required = true)
                    @RequestBody
                    List<Long> watcherIds) {
        entityWatcherService.addWatchers(EntityType.valueOf(entityType), entityId, watcherIds);
    }

    @Operation(
            summary = "Remove watchers from entity",
            description = "Removes multiple users from watching/following a specific entity")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Watchers removed successfully")
            })
    @DeleteMapping("/remove")
    public void removeWatchersFromEntity(
            @Parameter(description = "Type of entity (e.g., TICKET, PROJECT)", required = true)
                    @RequestParam
                    String entityType,
            @Parameter(description = "ID of the entity", required = true) @RequestParam
                    Long entityId,
            @Parameter(description = "List of user IDs to remove as watchers", required = true)
                    @RequestBody
                    List<Long> watcherIds) {
        entityWatcherService.removeWatchers(EntityType.valueOf(entityType), entityId, watcherIds);
    }
}
