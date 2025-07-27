package io.flowinquiry.modules.collab.service.mapper;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import io.flowinquiry.modules.collab.domain.ActivityLog;
import io.flowinquiry.modules.collab.domain.EntityType;
import io.flowinquiry.modules.collab.service.dto.ActivityLogDTO;
import io.flowinquiry.modules.usermanagement.domain.User;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

public class ActivityLogMapperTest {

    private ActivityLogMapper activityLogMapper = Mappers.getMapper(ActivityLogMapper.class);

    @Test
    public void testToDTO() {
        // Given
        Instant now = Instant.now();
        User user =
                User.builder()
                        .id(1L)
                        .firstName("John")
                        .lastName("Doe")
                        .imageUrl("http://example.com/image.jpg")
                        .build();

        ActivityLog activityLog =
                ActivityLog.builder()
                        .id(1L)
                        .entityType(EntityType.Ticket)
                        .entityId(2L)
                        .content("Test content")
                        .createdAt(now)
                        .createdBy(user)
                        .build();

        // When
        ActivityLogDTO activityLogDTO = activityLogMapper.toDTO(activityLog);

        // Then
        assertAll(
                () -> assertEquals(activityLog.getId(), activityLogDTO.getId()),
                () -> assertEquals(activityLog.getEntityType(), activityLogDTO.getEntityType()),
                () -> assertEquals(activityLog.getEntityId(), activityLogDTO.getEntityId()),
                () -> assertEquals(activityLog.getContent(), activityLogDTO.getContent()),
                () -> assertEquals(activityLog.getCreatedAt(), activityLogDTO.getCreatedAt()),
                () ->
                        assertEquals(
                                activityLog.getCreatedBy().getId(),
                                activityLogDTO.getCreatedById()),
                () -> assertEquals("John Doe", activityLogDTO.getCreatedByName()),
                () ->
                        assertEquals(
                                activityLog.getCreatedBy().getImageUrl(),
                                activityLogDTO.getCreatedByImageUrl()));
    }

    @Test
    public void testToDTOWithNullCreatedBy() {
        // Given
        Instant now = Instant.now();
        ActivityLog activityLog =
                ActivityLog.builder()
                        .id(1L)
                        .entityType(EntityType.Ticket)
                        .entityId(2L)
                        .content("Test content")
                        .createdAt(now)
                        .createdBy(null)
                        .build();

        // When
        ActivityLogDTO activityLogDTO = activityLogMapper.toDTO(activityLog);

        // Then
        assertAll(
                () -> assertEquals(activityLog.getId(), activityLogDTO.getId()),
                () -> assertEquals(activityLog.getEntityType(), activityLogDTO.getEntityType()),
                () -> assertEquals(activityLog.getEntityId(), activityLogDTO.getEntityId()),
                () -> assertEquals(activityLog.getContent(), activityLogDTO.getContent()),
                () -> assertEquals(activityLog.getCreatedAt(), activityLogDTO.getCreatedAt()),
                () -> assertNull(activityLogDTO.getCreatedById()),
                () -> assertEquals("", activityLogDTO.getCreatedByName()),
                () -> assertNull(activityLogDTO.getCreatedByImageUrl()));
    }
}
