package io.flowinquiry.modules.fss.controller;

import io.flowinquiry.modules.fss.service.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import java.io.ByteArrayOutputStream;
import java.util.concurrent.TimeUnit;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/files")
@Tag(name = "File Download", description = "API for downloading files from the storage system")
public class FileDownloadController {

    private final StorageService storageService;

    public FileDownloadController(StorageService storageService) {
        this.storageService = storageService;
    }

    @Operation(
            summary = "Download file",
            description = "Downloads a file from the storage system based on the file path")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "File downloaded successfully",
                        content = @Content(mediaType = "application/octet-stream")),
                @ApiResponse(
                        responseCode = "400",
                        description = "Invalid request - missing file container",
                        content = @Content),
                @ApiResponse(
                        responseCode = "404",
                        description = "File not found",
                        content = @Content)
            })
    @GetMapping(value = "/**")
    public ResponseEntity<byte[]> downloadFile(
            @Parameter(description = "HTTP request containing the file path", required = true)
                    HttpServletRequest request)
            throws Exception {
        String requestUrl = request.getRequestURI();
        int fileIndex = requestUrl.lastIndexOf("/");
        if (fileIndex == -1) {
            throw new IllegalArgumentException("Invalid request. Miss the file container");
        }
        String fileName = requestUrl.substring(fileIndex + 1);
        String container = requestUrl.substring("/api/files".length() + 1, fileIndex);

        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        storageService.downloadFile(container, fileName, byteArrayOutputStream);

        final HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setContentType(
                MediaTypeFactory.getMediaType(fileName).orElse(MediaType.APPLICATION_OCTET_STREAM));
        httpHeaders.setCacheControl(CacheControl.maxAge(1, TimeUnit.DAYS).cachePublic());
        httpHeaders.setExpires(System.currentTimeMillis() + 3600 * 1000 * 24);
        httpHeaders.setETag("\"" + byteArrayOutputStream.size() + "\""); // ETag for revalidation

        return new ResponseEntity<>(
                byteArrayOutputStream.toByteArray(), httpHeaders, HttpStatus.OK);
    }
}
