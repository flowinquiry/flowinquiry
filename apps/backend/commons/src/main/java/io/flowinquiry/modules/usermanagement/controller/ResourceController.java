package io.flowinquiry.modules.usermanagement.controller;

import io.flowinquiry.modules.usermanagement.repository.ResourceRepository;
import io.flowinquiry.modules.usermanagement.service.dto.ResourceDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/resources")
@Tag(name = "Resources", description = "API endpoints for managing resources")
public class ResourceController {

    private final ResourceRepository resourceRepository;

    @Autowired
    public ResourceController(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    @GetMapping
    @Operation(
            summary = "Get all resources",
            description = "Retrieves a list of all available resources",
            responses = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully retrieved resources",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        array =
                                                @ArraySchema(
                                                        schema =
                                                                @Schema(
                                                                        implementation =
                                                                                ResourceDTO
                                                                                        .class)))),
                @ApiResponse(responseCode = "401", description = "Unauthorized"),
                @ApiResponse(responseCode = "403", description = "Forbidden")
            })
    public ResponseEntity<List<ResourceDTO>> getAllResources() {
        List<ResourceDTO> resources =
                resourceRepository.findAll().stream()
                        .map(
                                resource ->
                                        new ResourceDTO(
                                                resource.getName(), resource.getDescription()))
                        .collect(Collectors.toList());
        return ResponseEntity.ok(resources);
    }
}
