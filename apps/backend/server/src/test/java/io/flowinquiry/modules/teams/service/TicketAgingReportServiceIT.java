package io.flowinquiry.modules.teams.service;

import static org.assertj.core.api.Assertions.assertThat;

import io.flowinquiry.it.IntegrationTest;
import io.flowinquiry.modules.teams.domain.TicketPriority;
import io.flowinquiry.modules.teams.service.dto.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import io.flowinquiry.modules.teams.service.dto.report.Granularity;
import io.flowinquiry.modules.teams.service.dto.report.GroupBy;
import io.flowinquiry.modules.teams.service.dto.report.Period;
import io.flowinquiry.modules.teams.service.dto.report.ThroughputReportDTO;
import io.flowinquiry.modules.teams.service.dto.report.TicketThroughputQueryParams;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
public class TicketAgingReportServiceIT {

    @Autowired private TicketAgingReportService ticketAgingReportService;

    @Test
    public void testAllTicketsReport() {
        TicketQueryParams queryParams = new TicketQueryParams();

        queryParams.setProjectId("3");
        queryParams.setIncludeClosed(true);

        Instant fixed = Instant.parse("2025-11-15T23:59:59.846138634Z");
        try (MockedStatic<Instant> mocked =
                Mockito.mockStatic(Instant.class, Mockito.CALLS_REAL_METHODS)) {
            mocked.when(Instant::now).thenReturn(fixed);

            TicketAgingReportDTO reports =
                    ticketAgingReportService.getAgingTicketsReport(queryParams);

            assertThat(reports.getGroupedTickets().isEmpty()).isEqualTo(false);
            assertThat(reports.getTotalTickets()).isEqualTo(24);
            assertThat(reports.getMaxAge()).isEqualTo(41);
            assertThat(reports.getMinAge()).isEqualTo(0);
            assertThat(reports.getGroupedTickets().size()).isEqualTo(3);
            assertThat(reports.getGroupedTickets().keySet())
                    .containsExactlyInAnyOrder("Alice Johnson", "John Doe", "Jane Smith");
            reports.getGroupedTickets()
                    .forEach((key, value) -> assertThat(value.size()).isEqualTo(8));

            assertThat(reports.getGroupedTickets().get("Alice Johnson").getFirst())
                    .usingRecursiveComparison()
                    .ignoringExpectedNullFields()
                    .isEqualTo(
                            TicketAgingDTO.builder()
                                    .ticketId(35L)
                                    .ticketKey("TICKET-35")
                                    .title("Dummy Ticket - Bucket 6 - Critical")
                                    .priority(TicketPriority.Critical)
                                    .assignee("Alice Johnson")
                                    .ageInDays(41L)
                                    .build());
            assertThat(reports.getGroupedTickets().get("John Doe").getFirst())
                    .usingRecursiveComparison()
                    .ignoringExpectedNullFields()
                    .isEqualTo(
                            TicketAgingDTO.builder()
                                    .ticketId(33L)
                                    .ticketKey("TICKET-33")
                                    .title("Dummy Ticket - Bucket 6 - Low")
                                    .priority(TicketPriority.Medium)
                                    .assignee("John Doe")
                                    .ageInDays(36L)
                                    .build());
        }
    }

    @Test
    public void testAllOpenTicketsReport() {
        TicketQueryParams queryParams = new TicketQueryParams();
        queryParams.setProjectId("3");
        queryParams.setIncludeClosed(false);
        Instant fixed = Instant.parse("2025-11-15T23:59:59.846138634Z");
        try (MockedStatic<Instant> mocked =
                Mockito.mockStatic(Instant.class, Mockito.CALLS_REAL_METHODS)) {
            mocked.when(Instant::now).thenReturn(fixed);
            TicketAgingReportDTO reports =
                    ticketAgingReportService.getAgingTicketsReport(queryParams);

            assertThat(reports.getTotalTickets()).isEqualTo(18);
            assertThat(reports.getGroupedTickets().size()).isEqualTo(3);
            assertThat(reports.getGroupedTickets().keySet())
                    .containsExactlyInAnyOrder("Alice Johnson", "John Doe", "Jane Smith");
            reports.getGroupedTickets()
                    .forEach((key, value) -> assertThat(value.size()).isEqualTo(6));
        }
    }

    @Test
    public void testAllTicketsCreatedFromDateRangeReport() {
        TicketQueryParams queryParams = new TicketQueryParams();
        queryParams.setProjectId("3");
        queryParams.setIncludeClosed(true);
        queryParams.setCreatedFrom(LocalDate.of(2025, 11, 13));

        Instant fixed = Instant.parse("2025-11-15T23:59:59.846138634Z");
        try (MockedStatic<Instant> mocked =
                Mockito.mockStatic(Instant.class, Mockito.CALLS_REAL_METHODS)) {
            mocked.when(Instant::now).thenReturn(fixed);
            TicketAgingReportDTO reports =
                    ticketAgingReportService.getAgingTicketsReport(queryParams);

            assertThat(reports.getGroupedTickets().isEmpty()).isEqualTo(false);
            assertThat(reports.getGroupedTickets().size()).isEqualTo(3);
            assertThat(reports.getGroupedTickets().keySet())
                    .containsExactlyInAnyOrder("Alice Johnson", "John Doe", "Jane Smith");
            assertThat(reports.getTotalTickets()).isEqualTo(4);
            assertThat(reports.getGroupedTickets().get("Alice Johnson").size()).isEqualTo(1);
            assertThat(reports.getGroupedTickets().get("John Doe").size()).isEqualTo(2);
            assertThat(reports.getGroupedTickets().get("Jane Smith").size()).isEqualTo(1);
            assertThat(reports.getGroupedTickets().get("Alice Johnson").getFirst())
                    .usingRecursiveComparison()
                    .ignoringExpectedNullFields()
                    .isEqualTo(
                            TicketAgingDTO.builder()
                                    .ticketId(15L)
                                    .ticketKey("TICKET-15")
                                    .title("Dummy Ticket - Bucket 1 - Critical")
                                    .priority(TicketPriority.High)
                                    .assignee("Alice Johnson")
                                    .ageInDays(2L)
                                    .build());
        }
    }

    @Test
    public void testAllTicketsCreatedToDateRangeReport() {
        TicketQueryParams queryParams = new TicketQueryParams();
        queryParams.setProjectId("3");
        queryParams.setIncludeClosed(true);
        queryParams.setCreatedTo(LocalDate.of(2025, 11, 13));
        Instant fixed = Instant.parse("2025-11-15T23:59:59.846138634Z");
        try (MockedStatic<Instant> mocked =
                Mockito.mockStatic(Instant.class, Mockito.CALLS_REAL_METHODS)) {
            mocked.when(Instant::now).thenReturn(fixed);
            TicketAgingReportDTO reports =
                    ticketAgingReportService.getAgingTicketsReport(queryParams);

            assertThat(reports.getGroupedTickets().isEmpty()).isEqualTo(false);
            assertThat(reports.getGroupedTickets().size()).isEqualTo(3);
            assertThat(reports.getTotalTickets()).isEqualTo(20);
            assertThat(reports.getGroupedTickets().keySet())
                    .containsExactlyInAnyOrder("Alice Johnson", "John Doe", "Jane Smith");
            assertThat(reports.getGroupedTickets().get("Alice Johnson").size()).isEqualTo(7);
            assertThat(reports.getGroupedTickets().get("John Doe").size()).isEqualTo(6);
            assertThat(reports.getGroupedTickets().get("Jane Smith").size()).isEqualTo(7);
            assertThat(reports.getGroupedTickets().get("Jane Smith").getFirst())
                    .usingRecursiveComparison()
                    .ignoringExpectedNullFields()
                    .isEqualTo(
                            TicketAgingDTO.builder()
                                    .ticketId(34L)
                                    .ticketKey("TICKET-34")
                                    .title("Dummy Ticket - Bucket 6 - High")
                                    .priority(TicketPriority.High)
                                    .assignee("Jane Smith")
                                    .ageInDays(38L)
                                    .build());
        }
    }

    @Test
    public void testAllTicketsGroupedByStatusReport() {
        TicketQueryParams queryParams = new TicketQueryParams();
        queryParams.setProjectId("3");
        queryParams.setIncludeClosed(true);
        queryParams.setGroupBy("status");

        Instant fixed = Instant.parse("2025-11-15T23:59:59.846138634Z");
        try (MockedStatic<Instant> mocked =
                Mockito.mockStatic(Instant.class, Mockito.CALLS_REAL_METHODS)) {
            mocked.when(Instant::now).thenReturn(fixed);
            TicketAgingReportDTO reports =
                    ticketAgingReportService.getAgingTicketsReport(queryParams);

            assertThat(reports.getGroupedTickets().isEmpty()).isEqualTo(false);
            assertThat(reports.getGroupedTickets().size()).isEqualTo(3);
            assertThat(reports.getTotalTickets()).isEqualTo(24);
            assertThat(reports.getGroupedTickets().keySet())
                    .containsExactlyInAnyOrder("Backlog", "Ready", "In Progress");
            assertThat(reports.getGroupedTickets().get("Backlog").size()).isEqualTo(12);
            assertThat(reports.getGroupedTickets().get("Ready").size()).isEqualTo(6);
            assertThat(reports.getGroupedTickets().get("In Progress").size()).isEqualTo(6);
            assertThat(reports.getGroupedTickets().get("Ready").getFirst())
                    .usingRecursiveComparison()
                    .ignoringExpectedNullFields()
                    .isEqualTo(
                            TicketAgingDTO.builder()
                                    .ticketId(34L)
                                    .ticketKey("TICKET-34")
                                    .title("Dummy Ticket - Bucket 6 - High")
                                    .priority(TicketPriority.High)
                                    .assignee("Jane Smith")
                                    .ageInDays(38L)
                                    .build());
        }
    }

    @Test
    public void testAllTicketsGroupedByPriorityReport() {
        TicketQueryParams queryParams = new TicketQueryParams();
        queryParams.setProjectId("3");
        queryParams.setIncludeClosed(true);
        queryParams.setGroupBy("priority");

        Instant fixed = Instant.parse("2025-11-15T23:59:59.846138634Z");
        try (MockedStatic<Instant> mocked =
                Mockito.mockStatic(Instant.class, Mockito.CALLS_REAL_METHODS)) {
            mocked.when(Instant::now).thenReturn(fixed);
            TicketAgingReportDTO reports =
                    ticketAgingReportService.getAgingTicketsReport(queryParams);

            assertThat(reports.getGroupedTickets().isEmpty()).isEqualTo(false);
            assertThat(reports.getGroupedTickets().size()).isEqualTo(3);
            assertThat(reports.getTotalTickets()).isEqualTo(24);
            assertThat(reports.getGroupedTickets().keySet())
                    .containsExactlyInAnyOrder("High", "Medium", "Critical");
            assertThat(reports.getGroupedTickets().get("Medium").size()).isEqualTo(12);
            assertThat(reports.getGroupedTickets().get("High").size()).isEqualTo(6);
            assertThat(reports.getGroupedTickets().get("Critical").size()).isEqualTo(6);
            assertThat(reports.getGroupedTickets().get("Critical").getFirst())
                    .usingRecursiveComparison()
                    .ignoringExpectedNullFields()
                    .isEqualTo(
                            TicketAgingDTO.builder()
                                    .ticketId(35L)
                                    .ticketKey("TICKET-35")
                                    .title("Dummy Ticket - Bucket 6 - Critical")
                                    .priority(TicketPriority.Critical)
                                    .assignee("Alice Johnson")
                                    .ageInDays(41L)
                                    .build());
        }
    }

    @Test
    public void testAllTicketsFilterByAssignId() {
        TicketQueryParams queryParams = new TicketQueryParams();
        queryParams.setProjectId("3");
        queryParams.setIncludeClosed(true);
        queryParams.setAssignUserId(List.of("1", "2"));

        Instant fixed = Instant.parse("2025-11-15T23:59:59.846138634Z");
        try (MockedStatic<Instant> mocked =
                Mockito.mockStatic(Instant.class, Mockito.CALLS_REAL_METHODS)) {
            mocked.when(Instant::now).thenReturn(fixed);
            TicketAgingReportDTO reports =
                    ticketAgingReportService.getAgingTicketsReport(queryParams);

            assertThat(reports.getGroupedTickets().isEmpty()).isEqualTo(false);
            assertThat(reports.getGroupedTickets().size()).isEqualTo(2);
            assertThat(reports.getTotalTickets()).isEqualTo(16);
            assertThat(reports.getGroupedTickets().keySet())
                    .containsExactlyInAnyOrder("John Doe", "Jane Smith");
        }
    }

    @Test
    public void testAllTicketsFilterByPriority() {
        TicketQueryParams queryParams = new TicketQueryParams();
        queryParams.setProjectId("3");
        queryParams.setPriority(List.of("High", "Critical"));

        Instant fixed = Instant.parse("2025-11-15T23:59:59.846138634Z");
        try (MockedStatic<Instant> mocked =
                Mockito.mockStatic(Instant.class, Mockito.CALLS_REAL_METHODS)) {
            mocked.when(Instant::now).thenReturn(fixed);

            TicketAgingReportDTO reports =
                    ticketAgingReportService.getAgingTicketsReport(queryParams);

            assertThat(reports.getGroupedTickets().isEmpty()).isEqualTo(false);
            assertThat(reports.getGroupedTickets().size()).isEqualTo(2);
            assertThat(reports.getTotalTickets()).isEqualTo(12);
            reports.getGroupedTickets().values().stream()
                    .flatMap(List::stream)
                    .toList()
                    .forEach(
                            item ->
                                    assertThat(item.getPriority())
                                            .isIn(TicketPriority.High, TicketPriority.Critical));
        }
    }

    @Test
    public void testAllTicketsFilterByStatus() {
        TicketQueryParams queryParams = new TicketQueryParams();
        queryParams.setProjectId("3");
        queryParams.setStatus(List.of("Backlog", "Ready"));

        Instant fixed = Instant.parse("2025-11-15T23:59:59.846138634Z");
        try (MockedStatic<Instant> mocked =
                Mockito.mockStatic(Instant.class, Mockito.CALLS_REAL_METHODS)) {
            mocked.when(Instant::now).thenReturn(fixed);
            TicketAgingReportDTO reports =
                    ticketAgingReportService.getAgingTicketsReport(queryParams);

            assertThat(reports.getGroupedTickets().isEmpty()).isEqualTo(false);
            assertThat(reports.getGroupedTickets().size()).isEqualTo(2);
            assertThat(reports.getTotalTickets()).isEqualTo(12);
            reports.getGroupedTickets().values().stream()
                    .flatMap(List::stream)
                    .toList()
                    .forEach(item -> assertThat(item.getStatus()).isIn("Backlog", "Ready"));
        }
    }

    @Test
    void testGetThroughputReport() {
        TicketThroughputQueryParams queryParams = new TicketThroughputQueryParams();
        queryParams.setProjectId(3L);
        queryParams.setFrom(LocalDate.of(2025, 10, 1));
        queryParams.setTo(LocalDate.of(2025, 11, 30));
        queryParams.setGranularity(Granularity.MONTH);

        ThroughputReportDTO report = ticketAgingReportService.getThroughputReport(queryParams);

        // Verify the results
        assertThat(report).isNotNull();
        assertThat(report.getFromDate()).isEqualTo(LocalDate.of(2025, 10, 1));
        assertThat(report.getToDate()).isEqualTo(LocalDate.of(2025, 11, 30));
        assertThat(report.getGranularity()).isEqualTo(Granularity.MONTH);

        // Verify the data
        assertThat(report.getData()).isNotEmpty();

        // There should be 2 periods (October and November 2025)
        assertThat(report.getData().size()).isEqualTo(2);

        // Get the periods
        List<Period> periods = new ArrayList<>(report.getData().keySet());

        // Sort periods by start date
        periods.sort(Comparator.comparing(Period::getStart));

        // Verify October period
        Period octPeriod = periods.get(0);
        assertThat(octPeriod.getStart()).isEqualTo(LocalDate.of(2025, 10, 1));
        assertThat(octPeriod.getEnd()).isEqualTo(LocalDate.of(2025, 10, 31));

        // Verify November period
        Period novPeriod = periods.get(1);
        assertThat(novPeriod.getStart()).isEqualTo(LocalDate.of(2025, 11, 1));
        assertThat(novPeriod.getEnd()).isEqualTo(LocalDate.of(2025, 11, 30));

        // Verify throughput counts
        // In November, there should be 6 completed tickets (all with completion date 2025-11-15)
        assertThat(report.getData().get(novPeriod).getThroughput()).isEqualTo(6);
    }
}
