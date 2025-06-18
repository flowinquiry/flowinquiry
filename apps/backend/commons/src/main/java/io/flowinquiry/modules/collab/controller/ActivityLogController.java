package io.flowinquiry.modules.collab.controller;

import io.flowinquiry.modules.collab.domain.EntityType;
import io.flowinquiry.modules.collab.service.ActivityLogService;
import io.flowinquiry.modules.collab.service.dto.ActivityLogDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/activity-logs")
@RequiredArgsConstructor
@Tag(name = "Activity Logs", description = "API endpoints for managing activity logs")
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    @GetMapping
    @Operation(
            summary = "Get activity logs for an entity",
            description = "Retrieves a paginated list of activity logs for a specific entity",
            responses = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved activity logs",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = Page.class))),
                @ApiResponse(responseCode = "401", description = "Unauthorized"),
                @ApiResponse(responseCode = "403", description = "Forbidden")
            })
    public ResponseEntity<Page<ActivityLogDTO>> getActivityLogs(
            @Parameter(description = "Type of entity to get activity logs for")
                    @RequestParam("entityType")
                    EntityType entityType,
            @Parameter(description = "ID of the entity") @RequestParam("entityId") Long entityId,
            @Parameter(description = "Pagination information") Pageable pageable) {
        Page<ActivityLogDTO> activityLogs =
                activityLogService.getActivityLogs(entityType, entityId, pageable);
        return ResponseEntity.ok(activityLogs);
    }

    @GetMapping("/user/{userId}")
    @Operation(
            summary = "Get activity logs for a user",
            description = "Retrieves a paginated list of activity logs for a specific user",
            responses = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved user activities",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = Page.class))),
                @ApiResponse(responseCode = "401", description = "Unauthorized"),
                @ApiResponse(responseCode = "403", description = "Forbidden"),
                @ApiResponse(responseCode = "404", description = "User not found")
            })
    public ResponseEntity<Page<ActivityLogDTO>> getUserActivities(
            @Parameter(description = "ID of the user") @PathVariable("userId") Long userId,
            @Parameter(description = "Pagination information") Pageable pageable) {
        Page<ActivityLogDTO> activities = activityLogService.getActivitiesForUser(userId, pageable);
        return ResponseEntity.ok(activities);
    }
}
