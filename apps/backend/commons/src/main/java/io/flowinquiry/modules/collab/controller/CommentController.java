package io.flowinquiry.modules.collab.controller;

import io.flowinquiry.modules.collab.domain.EntityType;
import io.flowinquiry.modules.collab.service.CommentService;
import io.flowinquiry.modules.collab.service.dto.CommentDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/comments")
@Tag(name = "Comments", description = "API for managing entity comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @Operation(
            summary = "Create or update comment",
            description = "Creates a new comment or updates an existing one")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Comment saved successfully",
                        content = @Content(schema = @Schema(implementation = CommentDTO.class)))
            })
    @PostMapping
    public CommentDTO saveComment(
            @Parameter(description = "Comment details", required = true) @RequestBody
                    CommentDTO comment) {
        return commentService.saveComment(comment);
    }

    @Operation(
            summary = "Get comment by ID",
            description = "Retrieves a specific comment by its ID")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Comment found",
                        content = @Content(schema = @Schema(implementation = CommentDTO.class))),
                @ApiResponse(responseCode = "404", description = "Comment not found")
            })
    @GetMapping("/{id}")
    public CommentDTO getCommentById(
            @Parameter(description = "Comment ID", required = true) @PathVariable("id") Long id) {
        return commentService.getCommentById(id);
    }

    @Operation(
            summary = "Get comments for entity",
            description = "Retrieves all comments for a specific entity")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Comments retrieved successfully",
                        content = @Content(schema = @Schema(implementation = CommentDTO.class)))
            })
    @GetMapping
    public List<CommentDTO> getCommentsForEntity(
            @Parameter(description = "Type of entity (e.g., TICKET, PROJECT)", required = true)
                    @RequestParam("entityType")
                    EntityType entityType,
            @Parameter(description = "ID of the entity", required = true) @RequestParam("entityId")
                    Long entityId) {
        return commentService.getCommentsForEntity(entityType, entityId);
    }

    @Operation(summary = "Delete comment", description = "Deletes a comment by its ID")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "204", description = "Comment deleted successfully"),
                @ApiResponse(responseCode = "404", description = "Comment not found")
            })
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(
            @Parameter(description = "Comment ID", required = true) @PathVariable("id") Long id) {
        commentService.deleteComment(id);
    }
}
