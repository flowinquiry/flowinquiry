package io.flowinquiry.modules.fss.service;

import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;

public interface StorageService {

    String AVATAR_TYPE = "avatar";

    String ATTACHMENTS = "attachments";

    Map<String, String> typeRelativePaths =
            new HashMap<>() {
                {
                    put(AVATAR_TYPE, AVATAR_TYPE);
                }
            };

    default String getRelativePathByType(String type) {
        return typeRelativePaths.get(type);
    }

    String uploadFile(String containerName, String blobName, InputStream inputStream)
            throws Exception;

    String uploadImage(String containerName, String blobName, InputStream inputStream)
            throws Exception;

    /**
     * Upload an image, reusing the existing stored path when one is present, or generating a fresh
     * UUID-based path when not.
     *
     * <p>The caller does not need to check whether an existing path is present — this method
     * handles both cases:
     *
     * <ul>
     *   <li>If {@code existingPath} is non-blank the file is overwritten in-place and the same path
     *       is returned.
     *   <li>Otherwise a new random UUID path is created and returned.
     * </ul>
     *
     * @param containerName the storage container / folder
     * @param inputStream image data
     * @param existingPath the currently stored path, or {@code null} / blank for a first upload
     * @return the stored path (existing one reused, or newly generated)
     */
    default String uploadImage(String containerName, InputStream inputStream, String existingPath)
            throws Exception {
        if (existingPath != null && !existingPath.isBlank()) {
            // Strip the leading "container/" prefix to get just the blob name
            String blobName =
                    existingPath.contains("/")
                            ? existingPath.substring(existingPath.lastIndexOf('/') + 1)
                            : existingPath;
            // Remove extension so uploadImage can normalise it (e.g. re-append .png)
            blobName = blobName.replaceFirst("[.][^.]+$", "");
            return uploadImage(containerName, blobName, inputStream);
        }
        return uploadImage(containerName, java.util.UUID.randomUUID().toString(), inputStream);
    }

    void downloadFile(String containerName, String blobName, OutputStream outputStream)
            throws Exception;

    void deleteFile(String containerName, String blobName) throws Exception;

    void deleteFile(String objectPath) throws Exception;
}
