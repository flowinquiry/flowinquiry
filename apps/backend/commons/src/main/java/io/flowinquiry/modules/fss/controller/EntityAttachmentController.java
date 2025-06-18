package io.flowinquiry.modules.fss.controller;

import io.flowinquiry.modules.fss.domain.EntityAttachment;
import io.flowinquiry.modules.fss.service.EntityAttachmentService;
import io.flowinquiry.modules.fss.service.dto.EntityAttachmentDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/entity-attachments")
@Tag(
        name = "Entity Attachments",
        description = "API for managing file attachments associated with entities")
public class EntityAttachmentController {

    private final EntityAttachmentService attachmentService;

    public EntityAttachmentController(EntityAttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    /**
     * Upload multiple attachments and associate them with a specific entity.
     *
     * @param entityType The type of entity (e.g., "ticket", "comment").
     * @param entityId The ID of the entity.
     * @param files The list of files to upload.
     * @return A list of saved attachment entities.
     */
    @Operation(
            summary = "Upload entity attachments",
            description = "Upload multiple files and associate them with a specific entity")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Files uploaded successfully",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        array =
                                                @ArraySchema(
                                                        schema =
                                                                @Schema(
                                                                        implementation =
                                                                                EntityAttachment
                                                                                        .class)))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Invalid request parameters",
                        content = @Content)
            })
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<EntityAttachment>> uploadAttachments(
            @Parameter(description = "Type of entity (e.g., 'ticket', 'comment')", required = true)
                    @RequestParam("entityType")
                    String entityType,
            @Parameter(description = "ID of the entity", required = true) @RequestParam("entityId")
                    Long entityId,
            @Parameter(description = "Files to upload", required = true) @RequestPart("files")
                    MultipartFile[] files)
            throws Exception {
        List<EntityAttachment> attachments =
                attachmentService.uploadAttachments(entityType, entityId, files);
        return ResponseEntity.ok(attachments);
    }

    /**
     * Retrieve all attachments for a specific entity.
     *
     * @param entityType The type of entity (e.g., "ticket", "comment").
     * @param entityId The ID of the entity.
     * @return A list of attachments for the specified entity.
     */
    @Operation(
            summary = "Get entity attachments",
            description = "Retrieve all file attachments associated with a specific entity")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Attachments retrieved successfully",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        array =
                                                @ArraySchema(
                                                        schema =
                                                                @Schema(
                                                                        implementation =
                                                                                EntityAttachmentDTO
                                                                                        .class)))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Invalid request parameters",
                        content = @Content)
            })
    @GetMapping
    public ResponseEntity<List<EntityAttachmentDTO>> getAttachments(
            @Parameter(description = "Type of entity (e.g., 'ticket', 'comment')", required = true)
                    @RequestParam("entityType")
                    String entityType,
            @Parameter(description = "ID of the entity", required = true) @RequestParam("entityId")
                    Long entityId) {
        List<EntityAttachmentDTO> attachments =
                attachmentService.getAttachments(entityType, entityId);
        return ResponseEntity.ok(attachments);
    }

    /**
     * Deletes an attachment by its ID.
     *
     * @param attachmentId The ID of the attachment to delete.
     * @return A ResponseEntity indicating the result of the deletion.
     */
    @Operation(summary = "Delete attachment", description = "Deletes a file attachment by its ID")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "204", description = "Attachment deleted successfully"),
                @ApiResponse(
                        responseCode = "404",
                        description = "Attachment not found",
                        content = @Content),
                @ApiResponse(
                        responseCode = "403",
                        description = "Not authorized to delete this attachment",
                        content = @Content)
            })
    @DeleteMapping("/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(
            @Parameter(description = "ID of the attachment to delete", required = true)
                    @PathVariable("attachmentId")
                    Long attachmentId) {
        attachmentService.deleteAttachment(attachmentId);
        return ResponseEntity.noContent().build();
    }
}
