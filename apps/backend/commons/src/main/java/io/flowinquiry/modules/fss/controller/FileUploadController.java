package io.flowinquiry.modules.fss.controller;

import io.flowinquiry.modules.fss.service.StorageService;
import io.flowinquiry.modules.usermanagement.service.dto.UserKey;
import io.flowinquiry.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.json.Json;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
@Tag(name = "File Upload", description = "API for uploading files to the storage system")
@Slf4j
public class FileUploadController {

    private final StorageService storageService;

    public FileUploadController(StorageService storageService) {
        this.storageService = storageService;
    }

    @Operation(
            summary = "Upload single file",
            description =
                    "Uploads a single file to the storage system with specified type and optional parent path")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "File uploaded successfully",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema =
                                                @Schema(
                                                        type = "object",
                                                        example =
                                                                "{\"path\":\"images/example.jpg\"}"))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Invalid request - unsupported file type",
                        content = @Content(mediaType = "text/plain"))
            })
    @PostMapping(value = "/singleUpload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> submit(
            @Parameter(description = "File to upload", required = true) @RequestParam("file")
                    MultipartFile file,
            @Parameter(description = "Type of file (determines storage location)", required = true)
                    @RequestParam("type")
                    String type,
            @Parameter(description = "Optional parent path within the storage location")
                    @RequestParam("parentPath")
                    Optional<String> parentPath)
            throws Exception {
        String currentUser = SecurityUtils.getCurrentUserLogin().map(UserKey::getEmail).orElse("");
        log.debug(
                "User {} saves file {} into the storage with options {}",
                currentUser,
                file.getOriginalFilename(),
                type);
        String prefixPath = storageService.getRelativePathByType(type);
        if (prefixPath == null) {
            return ResponseEntity.badRequest().body("Not support upload with type " + type);
        }

        String path =
                storageService.uploadFile(
                        prefixPath, file.getOriginalFilename(), file.getInputStream());
        return ResponseEntity.ok(Json.createObjectBuilder().add("path", path).build().toString());
    }
}
