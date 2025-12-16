package io.flowinquiry.modules.teams.service;

import static org.assertj.core.api.Assertions.assertThat;

import io.flowinquiry.it.IntegrationTest;
import io.flowinquiry.modules.teams.service.dto.TicketAgingDTO;
import io.flowinquiry.modules.teams.service.dto.TicketAgingReportDTO;
import io.flowinquiry.modules.teams.service.dto.TicketQueryParams;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
public class TicketAgingReportServiceIT {

    @Autowired private TicketAgingReportService reportsService;

    @Test
    public void testAllTicketsReport() {
        // Given: Query params to get all tickets in project
        TicketQueryParams params = new TicketQueryParams();
        params.setProjectId("3");
        params.setIncludeClosed(true); // Include all tickets

        // When: Generate aging report
        TicketAgingReportDTO report = reportsService.getTicketAgingReport(params);

        // Then: Verify report contains data
        assertThat(report).isNotNull();
        assertThat(report.getTotalTickets()).isGreaterThan(0);

        // Verify statistics are calculated
        assertThat(report.getAverageAge()).isGreaterThanOrEqualTo(0.0);
        assertThat(report.getMaxAge()).isGreaterThanOrEqualTo(0L);
        assertThat(report.getMinAge()).isGreaterThanOrEqualTo(0L);

        // Verify grouped tickets exist
        assertThat(report.getGroupedTickets()).isNotNull();
        assertThat(report.getGroupedTickets()).isNotEmpty();

        // Verify each group has tickets
        report.getGroupedTickets()
                .values()
                .forEach(
                        tickets -> {
                            assertThat(tickets).isNotEmpty();

                            // Verify each ticket has required fields
                            tickets.forEach(
                                    ticket -> {
                                        assertThat(ticket.getTicketId()).isNotNull();
                                        assertThat(ticket.getTicketKey()).isNotBlank();
                                        assertThat(ticket.getTitle()).isNotBlank();
                                        assertThat(ticket.getStatus()).isNotBlank();
                                        assertThat(ticket.getAgeInDays())
                                                .isGreaterThanOrEqualTo(0L);
                                        assertThat(ticket.getCreatedDate()).isNotNull();
                                    });
                        });

        // Verify statistics match actual data
        List<TicketAgingDTO> allTickets =
                report.getGroupedTickets().values().stream()
                        .flatMap(List::stream)
                        .collect(Collectors.toList());

        assertThat(allTickets.size()).isEqualTo(report.getTotalTickets());

        // Verify max/min age match actual tickets
        long actualMaxAge =
                allTickets.stream().mapToLong(TicketAgingDTO::getAgeInDays).max().orElse(0L);
        assertThat(report.getMaxAge()).isEqualTo(actualMaxAge);

        long actualMinAge =
                allTickets.stream().mapToLong(TicketAgingDTO::getAgeInDays).min().orElse(0L);
        assertThat(report.getMinAge()).isEqualTo(actualMinAge);
    }

    @Test
    public void testAllOpenTicketsReport() {}

    @Test
    public void testAllTicketsCreatedFromDateRangeReport() {}

    @Test
    public void testAllTicketsCreatedToDateRangeReport() {}

    @Test
    public void testAllTicketsGroupedByStatusReport() {}

    @Test
    public void testAllTicketsGroupedByPriorityReport() {}

    @Test
    public void testAllTicketsFilterByAssignId() {}

    @Test
    public void testAllTicketsFilterByPriority() {}

    @Test
    public void testAllTicketsFilterByStatus() {}
}
