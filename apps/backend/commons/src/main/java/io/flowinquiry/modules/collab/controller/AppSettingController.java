package io.flowinquiry.modules.collab.controller;

import io.flowinquiry.modules.collab.service.AppSettingService;
import io.flowinquiry.modules.collab.service.dto.AppSettingDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Optional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settings")
@Tag(name = "Application Settings", description = "API for managing application settings")
public class AppSettingController {

    private final AppSettingService appSettingService;

    public AppSettingController(AppSettingService appSettingService) {
        this.appSettingService = appSettingService;
    }

    @Operation(
            summary = "Get setting by key",
            description = "Retrieves a specific application setting by its key")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Setting found",
                        content = @Content(schema = @Schema(implementation = AppSettingDTO.class))),
                @ApiResponse(responseCode = "404", description = "Setting not found")
            })
    @GetMapping("/{key}")
    public ResponseEntity<AppSettingDTO> getSetting(
            @Parameter(description = "Setting key", required = true) @PathVariable String key) {
        Optional<String> value = appSettingService.getValue(key);
        return value.map(v -> ResponseEntity.ok(new AppSettingDTO(key, v, null, null, null)))
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(
            summary = "Get all settings",
            description = "Retrieves all application settings, optionally filtered by group")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Settings retrieved successfully",
                        content = @Content(schema = @Schema(implementation = AppSettingDTO.class)))
            })
    @GetMapping
    public List<AppSettingDTO> getAllSettings(
            @Parameter(description = "Optional group filter")
                    @RequestParam(value = "group", required = false)
                    String group) {
        if (group != null) {
            return appSettingService.getSettingsByGroup(group);
        }
        return appSettingService.getAllSettingDTOs();
    }

    @Operation(
            summary = "Update multiple settings",
            description = "Updates multiple application settings at once")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Settings updated successfully")
            })
    @PutMapping
    public void updateSettings(
            @Parameter(description = "List of settings to update", required = true) @RequestBody
                    List<AppSettingDTO> settings) {
        appSettingService.updateSettings(settings);
    }

    @Operation(
            summary = "Update single setting",
            description = "Updates a single application setting by its key")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Setting updated successfully"),
                @ApiResponse(
                        responseCode = "400",
                        description = "Key mismatch between path and request body")
            })
    @PutMapping("/{key}")
    public void updateSetting(
            @Parameter(description = "Setting key", required = true) @PathVariable String key,
            @Parameter(description = "Setting details", required = true) @RequestBody
                    AppSettingDTO dto) {
        if (!key.equals(dto.getKey())) {
            return;
        }
        appSettingService.updateValue(dto.getKey(), dto.getValue());
    }
}
