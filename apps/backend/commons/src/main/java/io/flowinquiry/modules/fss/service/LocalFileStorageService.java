package io.flowinquiry.modules.fss.service;

import io.flowinquiry.exceptions.ResourceNotFoundException;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import javax.imageio.ImageIO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class LocalFileStorageService implements StorageService {

    private final String rootDirectory;

    public LocalFileStorageService(
            @Value("${application.file.rootDirectory:storage}") String rootDirectory) {
        this.rootDirectory = rootDirectory;
        File storageDir = new File(rootDirectory);
        if (!storageDir.exists()) {
            storageDir.mkdirs();
            log.info("Created storage folder : {}", storageDir.getAbsolutePath());
        }
    }

    @Override
    public String uploadFile(String containerName, String blobName, InputStream inputStream)
            throws Exception {

        File directory = new File(rootDirectory, containerName);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        String fileName = URLEncoder.encode(blobName, StandardCharsets.UTF_8);
        File destinationFile = new File(directory, fileName);
        try (OutputStream outputStream = new FileOutputStream(destinationFile)) {
            byte[] buffer = new byte[1024];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }
        }
        log.debug(
                "Save container {} blob {} to file {} successfully",
                containerName,
                fileName,
                destinationFile.getAbsolutePath());
        return containerName + "/" + fileName;
    }

    @Override
    public String uploadImage(String containerName, String blobName, InputStream inputStream)
            throws Exception {

        File directory = new File(rootDirectory, containerName);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        // Ensure the file is saved as a .png
        String pngFileName =
                URLEncoder.encode(blobName.replaceFirst("[.][^.]+$", ""), StandardCharsets.UTF_8)
                        + ".png";
        File destinationFile = new File(directory, pngFileName);

        // Read the input stream as an image and write it as PNG
        try (OutputStream outputStream = new FileOutputStream(destinationFile)) {
            BufferedImage image = ImageIO.read(inputStream);
            if (image == null) {
                throw new IllegalArgumentException("Input stream does not contain a valid image");
            }
            ImageIO.write(image, "png", outputStream);
        }

        log.debug(
                "Converted and saved container {} blob {} as PNG to file {} successfully",
                containerName,
                pngFileName,
                destinationFile.getAbsolutePath());

        return containerName + "/" + pngFileName;
    }

    @Override
    public void downloadFile(String containerName, String blobName, OutputStream outputStream)
            throws Exception {
        File sourceFile = new File(rootDirectory + File.separator + containerName, blobName);
        if (sourceFile.exists()) {
            try (InputStream inputStream = new FileInputStream(sourceFile)) {
                byte[] buffer = new byte[1024];
                int bytesRead;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, bytesRead);
                }
            }
        } else {
            throw new ResourceNotFoundException(
                    "Can not find the resource " + blobName + " in the container " + containerName);
        }
    }

    @Override
    public void deleteFile(String containerName, String blobName) throws Exception {
        Files.deleteIfExists(Paths.get(rootDirectory, containerName, blobName));
    }

    @Override
    public void deleteFile(String objectPath) throws Exception {
        Files.deleteIfExists(Paths.get(rootDirectory, objectPath));
    }
}
