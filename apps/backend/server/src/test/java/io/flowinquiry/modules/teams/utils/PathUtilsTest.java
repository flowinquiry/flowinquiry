package io.flowinquiry.modules.teams.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;

import io.flowinquiry.modules.teams.service.dto.TicketDTO;
import io.flowinquiry.utils.HtmlUtils;
import io.flowinquiry.utils.Obfuscator;
import org.junit.jupiter.api.Test;

public class PathUtilsTest {

    @Test
    public void testBuildTicketPathWithProjectId() {
        // Given
        Long teamId = 123L;
        Long ticketId = 456L;
        String projectShortName = "PRJ";
        Long projectTicketNumber = 789L;

        TicketDTO ticketDTO =
                TicketDTO.builder()
                        .id(ticketId)
                        .teamId(teamId)
                        .projectId(999L) // Any non-null value
                        .projectShortName(projectShortName)
                        .projectTicketNumber(projectTicketNumber)
                        .build();

        // When
        String path = HtmlUtils.buildTicketPath(ticketDTO);

        // Then
        String expectedPath =
                String.format(
                        "/portal/teams/%s/projects/%s/%s",
                        Obfuscator.obfuscate(teamId), projectShortName, projectTicketNumber);
        assertEquals(expectedPath, path);
    }

    @Test
    public void testBuildTicketPathWithoutProjectId() {
        // Given
        Long teamId = 123L;
        Long ticketId = 456L;

        TicketDTO ticketDTO =
                TicketDTO.builder()
                        .id(ticketId)
                        .teamId(teamId)
                        .projectId(null) // Explicitly set to null
                        .build();

        // When
        String path = HtmlUtils.buildTicketPath(ticketDTO);

        // Then
        String expectedPath =
                String.format(
                        "/portal/teams/%s/tickets/%s",
                        Obfuscator.obfuscate(teamId), Obfuscator.obfuscate(ticketId));
        assertEquals(expectedPath, path);
    }
}
