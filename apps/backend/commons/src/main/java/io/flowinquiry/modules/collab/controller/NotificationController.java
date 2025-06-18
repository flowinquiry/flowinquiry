package io.flowinquiry.modules.collab.controller;

import io.flowinquiry.modules.collab.service.NotificationService;
import io.flowinquiry.modules.collab.service.dto.NotificationDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.Data;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notifications", description = "API for managing user notifications")
public class NotificationController {
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Operation(
            summary = "Get user notifications",
            description = "Retrieves paginated notifications for a specific user")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Notifications retrieved successfully",
                        content =
                                @Content(schema = @Schema(implementation = NotificationDTO.class)))
            })
    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<NotificationDTO>> getUserNotifications(
            @Parameter(description = "ID of the user", required = true) @PathVariable("userId")
                    Long userId,
            @Parameter(description = "Pagination parameters") Pageable pageable) {
        return ResponseEntity.ok(notificationService.getNotificationsForUser(userId, pageable));
    }

    @Operation(
            summary = "Mark notifications as read",
            description = "Marks multiple notifications as read")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "204",
                        description = "Notifications marked as read successfully"),
                @ApiResponse(
                        responseCode = "400",
                        description = "Invalid request (empty notification IDs)")
            })
    @PostMapping("/mark-read")
    public ResponseEntity<Void> markNotificationsAsRead(
            @Parameter(description = "List of notification IDs to mark as read", required = true)
                    @RequestBody
                    MarkReadRequest request) {
        if (request.getNotificationIds() == null || request.getNotificationIds().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        notificationService.markNotificationsAsRead(request.getNotificationIds());
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Get unread notifications",
            description = "Retrieves all unread notifications for a specific user")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Unread notifications retrieved successfully",
                        content =
                                @Content(schema = @Schema(implementation = NotificationDTO.class)))
            })
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications(
            @Parameter(description = "ID of the user", required = true) @RequestParam("userId")
                    Long userId) {
        List<NotificationDTO> notifications =
                notificationService.getUnreadNotificationsForUser(userId);
        return ResponseEntity.ok(notifications);
    }

    @Data
    public static class MarkReadRequest {
        private List<Long> notificationIds;
    }
}
