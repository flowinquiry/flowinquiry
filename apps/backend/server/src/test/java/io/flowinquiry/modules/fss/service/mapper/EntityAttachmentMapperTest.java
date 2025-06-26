package io.flowinquiry.modules.fss.service.mapper;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import io.flowinquiry.modules.fss.domain.EntityAttachment;
import io.flowinquiry.modules.fss.service.dto.EntityAttachmentDTO;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

public class EntityAttachmentMapperTest {

    private EntityAttachmentMapper entityAttachmentMapper =
            Mappers.getMapper(EntityAttachmentMapper.class);

    @Test
    public void testToDto() {
        // Given
        Instant now = Instant.now();
        EntityAttachment entityAttachment =
                EntityAttachment.builder()
                        .id(1L)
                        .entityType("Ticket")
                        .entityId(2L)
                        .fileName("test.jpg")
                        .fileType("image/jpeg")
                        .fileSize(1024L)
                        .fileUrl("http://example.com/test.jpg")
                        .uploadedAt(now)
                        .build();

        // When
        EntityAttachmentDTO dto = entityAttachmentMapper.toDto(entityAttachment);

        // Then
        assertAll(
                () -> assertEquals(entityAttachment.getId(), dto.getId()),
                () -> assertEquals(entityAttachment.getEntityType(), dto.getEntityType()),
                () -> assertEquals(entityAttachment.getEntityId(), dto.getEntityId()),
                () -> assertEquals(entityAttachment.getFileName(), dto.getFileName()),
                () -> assertEquals(entityAttachment.getFileType(), dto.getFileType()),
                () -> assertEquals(entityAttachment.getFileSize(), dto.getFileSize()),
                () -> assertEquals(entityAttachment.getFileUrl(), dto.getFileUrl()),
                () -> assertEquals(entityAttachment.getUploadedAt(), dto.getUploadedAt()));
    }

    @Test
    public void testToDtoList() {
        // Given
        Instant now = Instant.now();
        EntityAttachment entityAttachment1 =
                EntityAttachment.builder()
                        .id(1L)
                        .entityType("Ticket")
                        .entityId(2L)
                        .fileName("test1.jpg")
                        .fileType("image/jpeg")
                        .fileSize(1024L)
                        .fileUrl("http://example.com/test1.jpg")
                        .uploadedAt(now)
                        .build();

        EntityAttachment entityAttachment2 =
                EntityAttachment.builder()
                        .id(2L)
                        .entityType("Ticket")
                        .entityId(2L)
                        .fileName("test2.jpg")
                        .fileType("image/jpeg")
                        .fileSize(2048L)
                        .fileUrl("http://example.com/test2.jpg")
                        .uploadedAt(now)
                        .build();

        List<EntityAttachment> entityAttachments =
                Arrays.asList(entityAttachment1, entityAttachment2);

        // When
        List<EntityAttachmentDTO> dtos = entityAttachmentMapper.toDtoList(entityAttachments);

        // Then
        assertNotNull(dtos);
        assertEquals(2, dtos.size());

        // Verify first attachment
        EntityAttachmentDTO dto1 = dtos.get(0);
        assertAll(
                () -> assertEquals(entityAttachment1.getId(), dto1.getId()),
                () -> assertEquals(entityAttachment1.getEntityType(), dto1.getEntityType()),
                () -> assertEquals(entityAttachment1.getEntityId(), dto1.getEntityId()),
                () -> assertEquals(entityAttachment1.getFileName(), dto1.getFileName()),
                () -> assertEquals(entityAttachment1.getFileType(), dto1.getFileType()),
                () -> assertEquals(entityAttachment1.getFileSize(), dto1.getFileSize()),
                () -> assertEquals(entityAttachment1.getFileUrl(), dto1.getFileUrl()),
                () -> assertEquals(entityAttachment1.getUploadedAt(), dto1.getUploadedAt()));

        // Verify second attachment
        EntityAttachmentDTO dto2 = dtos.get(1);
        assertAll(
                () -> assertEquals(entityAttachment2.getId(), dto2.getId()),
                () -> assertEquals(entityAttachment2.getEntityType(), dto2.getEntityType()),
                () -> assertEquals(entityAttachment2.getEntityId(), dto2.getEntityId()),
                () -> assertEquals(entityAttachment2.getFileName(), dto2.getFileName()),
                () -> assertEquals(entityAttachment2.getFileType(), dto2.getFileType()),
                () -> assertEquals(entityAttachment2.getFileSize(), dto2.getFileSize()),
                () -> assertEquals(entityAttachment2.getFileUrl(), dto2.getFileUrl()),
                () -> assertEquals(entityAttachment2.getUploadedAt(), dto2.getUploadedAt()));
    }
}
