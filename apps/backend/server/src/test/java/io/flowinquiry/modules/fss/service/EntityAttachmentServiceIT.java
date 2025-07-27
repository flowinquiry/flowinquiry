package io.flowinquiry.modules.fss.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import io.flowinquiry.it.IntegrationTest;
import io.flowinquiry.modules.fss.domain.EntityAttachment;
import io.flowinquiry.modules.fss.repository.EntityAttachmentRepository;
import io.flowinquiry.modules.fss.service.dto.EntityAttachmentDTO;
import java.io.InputStream;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@IntegrationTest
@Transactional
public class EntityAttachmentServiceIT {

    @Autowired private EntityAttachmentService entityAttachmentService;

    @Autowired private EntityAttachmentRepository entityAttachmentRepository;

    private StorageService mockStorageService;

    private static final String ENTITY_TYPE = "test";
    private static final Long ENTITY_ID = 1L;
    private static final String FILE_NAME = "test.txt";
    private static final String FILE_TYPE = "text/plain";
    private static final Long FILE_SIZE = 100L;
    private static final String FILE_URL = "attachments/test.txt";
    private static final String FILE_URL_1 = "attachments/file1.txt";
    private static final String FILE_URL_2 = "attachments/file2.txt";

    private EntityAttachment testAttachment;

    @BeforeEach
    public void setup() throws Exception {
        // Clean up any existing attachments
        entityAttachmentRepository.deleteAll();

        // Create and configure the mock storage service
        mockStorageService = Mockito.mock(StorageService.class);

        // Use doAnswer to provide a custom implementation that returns different file URLs based on
        // the file name
        Mockito.doAnswer(
                        invocation -> {
                            String containerName = invocation.getArgument(0);
                            String fileName = invocation.getArgument(1);

                            return switch (fileName) {
                                case FILE_NAME -> FILE_URL;
                                case "file1.txt" -> FILE_URL_1;
                                case "file2.txt" -> FILE_URL_2;
                                default -> "attachments/" + fileName;
                            };
                        })
                .when(mockStorageService)
                .uploadFile(anyString(), anyString(), any(InputStream.class));
        doNothing().when(mockStorageService).deleteFile(anyString());

        // Inject the mock storage service into the entity attachment service
        ReflectionTestUtils.setField(entityAttachmentService, "storageService", mockStorageService);

        // Create a test attachment
        testAttachment = new EntityAttachment();
        testAttachment.setEntityType(ENTITY_TYPE);
        testAttachment.setEntityId(ENTITY_ID);
        testAttachment.setFileName(FILE_NAME);
        testAttachment.setFileType(FILE_TYPE);
        testAttachment.setFileSize(FILE_SIZE);
        testAttachment.setFileUrl(FILE_URL);
        testAttachment.setUploadedAt(Instant.now());
        entityAttachmentService.saveEntityAttachment(testAttachment);
    }

    @AfterEach
    public void cleanup() {
        entityAttachmentRepository.deleteAll();
    }

    @Test
    public void testUploadAttachments() throws Exception {
        // Create mock files
        MockMultipartFile file1 =
                new MockMultipartFile(
                        "file1", "file1.txt", "text/plain", "test content 1".getBytes());
        MockMultipartFile file2 =
                new MockMultipartFile(
                        "file2", "file2.txt", "text/plain", "test content 2".getBytes());

        MultipartFile[] files = {file1, file2};

        // Call the service method
        List<EntityAttachment> result =
                entityAttachmentService.uploadAttachments(ENTITY_TYPE, ENTITY_ID, files);

        // Verify the result
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getEntityType()).isEqualTo(ENTITY_TYPE);
        assertThat(result.get(0).getEntityId()).isEqualTo(ENTITY_ID);
        assertThat(result.get(0).getFileName()).isEqualTo("file1.txt");
        assertThat(result.get(0).getFileType()).isEqualTo("text/plain");
        assertThat(result.get(0).getFileUrl()).isEqualTo(FILE_URL_1);

        assertThat(result.get(1).getEntityType()).isEqualTo(ENTITY_TYPE);
        assertThat(result.get(1).getEntityId()).isEqualTo(ENTITY_ID);
        assertThat(result.get(1).getFileName()).isEqualTo("file2.txt");
        assertThat(result.get(1).getFileType()).isEqualTo("text/plain");
        assertThat(result.get(1).getFileUrl()).isEqualTo(FILE_URL_2);

        // Verify the storage service was called
        verify(mockStorageService, times(2))
                .uploadFile(eq(StorageService.ATTACHMENTS), anyString(), any(InputStream.class));

        // Verify the attachments were saved to the database
        List<EntityAttachment> savedAttachments =
                entityAttachmentRepository.findByEntityTypeAndEntityId(ENTITY_TYPE, ENTITY_ID);
        assertThat(savedAttachments).hasSize(3); // 1 from setup + 2 new ones
    }

    @Test
    public void testGetAttachments() {
        // Call the service method
        List<EntityAttachmentDTO> result =
                entityAttachmentService.getAttachments(ENTITY_TYPE, ENTITY_ID);

        // Verify the result
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getEntityType()).isEqualTo(ENTITY_TYPE);
        assertThat(result.get(0).getEntityId()).isEqualTo(ENTITY_ID);
        assertThat(result.get(0).getFileName()).isEqualTo(FILE_NAME);
        assertThat(result.get(0).getFileType()).isEqualTo(FILE_TYPE);
        assertThat(result.get(0).getFileSize()).isEqualTo(FILE_SIZE);
        assertThat(result.get(0).getFileUrl()).isEqualTo(FILE_URL);
    }

    @Test
    public void testDeleteAttachments() throws Exception {
        // Call the service method
        entityAttachmentService.deleteAttachments(ENTITY_TYPE, ENTITY_ID);

        // Verify the storage service was called
        verify(mockStorageService, times(1)).deleteFile(FILE_URL);

        // Verify the attachments were deleted from the database
        List<EntityAttachment> remainingAttachments =
                entityAttachmentRepository.findByEntityTypeAndEntityId(ENTITY_TYPE, ENTITY_ID);
        assertThat(remainingAttachments).isEmpty();
    }

    @Test
    public void testDeleteAttachment() throws Exception {
        // Call the service method
        entityAttachmentService.deleteAttachment(testAttachment.getId());

        // Verify the storage service was called
        verify(mockStorageService, times(1)).deleteFile(FILE_URL);

        // Verify the attachment was deleted from the database
        Optional<EntityAttachment> deletedAttachment =
                entityAttachmentRepository.findById(testAttachment.getId());
        assertThat(deletedAttachment).isEmpty();
    }
}
