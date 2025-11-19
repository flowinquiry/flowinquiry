package io.flowinquiry.modules.teams.service;

import static org.assertj.core.api.Assertions.assertThat;

import io.flowinquiry.it.IntegrationTest;
import io.flowinquiry.modules.teams.domain.TicketChannel;
import io.flowinquiry.modules.teams.service.dto.TicketAgeingBucketDTO;
import io.flowinquiry.modules.teams.service.dto.TicketDTO;
import io.flowinquiry.modules.teams.service.dto.TicketGroupDTO;
import io.flowinquiry.modules.teams.service.dto.TicketQueryParams;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
public class ReportsServiceIT {

    @Autowired private ReportsService reportsService;

    @Test
    public void testAllTicketsReport() {
        TicketQueryParams queryParams = new TicketQueryParams();

        queryParams.setProjectId("3");
        queryParams.setIncludeClosed(true);

        Instant fixed = Instant.parse("2025-11-15T23:59:59.846138634Z");
        try (MockedStatic<Instant> mocked =
                Mockito.mockStatic(Instant.class, Mockito.CALLS_REAL_METHODS)) {
            mocked.when(Instant::now).thenReturn(fixed);

            List<TicketAgeingBucketDTO> reports =
                    reportsService.getAgeingTicketsReport(queryParams);

            assertThat(reports.isEmpty()).isEqualTo(false);

            assertThat(reports.size()).isEqualTo(6);
            assertThat(reports.stream().map(TicketAgeingBucketDTO::getBucketLabel).toList())
                    .containsExactlyInAnyOrder(
                            "0-2days",
                            "3-5days",
                            "6-10days",
                            "11-20days",
                            "21-30days",
                            "31moredays");
            reports.forEach(
                    item -> {
                        assertThat(item.getGroupedTickets().size()).isEqualTo(3);
                    });
            List<TicketGroupDTO> allTicketsGroups =
                    reports.stream().flatMap(item -> item.getGroupedTickets().stream()).toList();
            assertThat(
                            allTicketsGroups.stream()
                                    .flatMap(item -> item.getTickets().stream())
                                    .toList()
                                    .size())
                    .isEqualTo(24);

            assertThat(reports.getFirst().getGroupedTickets().getFirst().getTickets().size())
                    .isEqualTo(2);
            assertThat(reports.getFirst().getGroupedTickets().getFirst().getTickets().get(1))
                    .usingRecursiveComparison()
                    .ignoringExpectedNullFields()
                    .isEqualTo(
                            TicketDTO.builder()
                                    .id(16L)
                                    .assignUserId(1L)
                                    .projectId(3L)
                                    .isCompleted(true)
                                    .channel(TicketChannel.WEB_PORTAL)
                                    .iterationId(2L)
                                    .currentStateId(1L)
                                    .estimate(1)
                                    .actualCompletionDate(LocalDate.of(2025, 11, 15))
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
            List<TicketAgeingBucketDTO> reports =
                    reportsService.getAgeingTicketsReport(queryParams);

            assertThat(reports.isEmpty()).isEqualTo(false);
            assertThat(reports.size()).isEqualTo(6);
            assertThat(reports.stream().map(TicketAgeingBucketDTO::getBucketLabel).toList())
                    .containsExactlyInAnyOrder(
                            "0-2days",
                            "3-5days",
                            "6-10days",
                            "11-20days",
                            "21-30days",
                            "31moredays");
            reports.forEach(
                    item -> {
                        assertThat(item.getGroupedTickets().size()).isEqualTo(3);
                    });
            List<TicketGroupDTO> allTicketsGroups =
                    reports.stream().flatMap(item -> item.getGroupedTickets().stream()).toList();
            assertThat(
                            allTicketsGroups.stream()
                                    .flatMap(item -> item.getTickets().stream())
                                    .toList()
                                    .size())
                    .isEqualTo(18);
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
            List<TicketAgeingBucketDTO> reports =
                    reportsService.getAgeingTicketsReport(queryParams);

            assertThat(reports.isEmpty()).isEqualTo(false);
            assertThat(reports.size()).isEqualTo(6);
            assertThat(reports.stream().map(TicketAgeingBucketDTO::getBucketLabel).toList())
                    .containsExactlyInAnyOrder(
                            "0-2days",
                            "3-5days",
                            "6-10days",
                            "11-20days",
                            "21-30days",
                            "31moredays");
            assertThat(reports.getFirst().getBucketLabel()).isEqualTo("0-2days");
            assertThat(reports.getFirst().getGroupedTickets()).isNotEmpty();
            assertThat(reports.get(1).getBucketLabel()).isEqualTo("3-5days");
            assertThat(reports.get(1).getGroupedTickets()).isEmpty();
            assertThat(reports.get(2).getBucketLabel()).isEqualTo("6-10days");
            assertThat(reports.get(2).getGroupedTickets()).isEmpty();
            List<TicketGroupDTO> allTicketsGroups =
                    reports.stream().flatMap(item -> item.getGroupedTickets().stream()).toList();
            assertThat(
                            allTicketsGroups.stream()
                                    .flatMap(item -> item.getTickets().stream())
                                    .toList()
                                    .size())
                    .isEqualTo(4);
            assertThat(reports.getFirst().getGroupedTickets().getFirst().getTickets().getFirst())
                    .usingRecursiveComparison()
                    .ignoringExpectedNullFields()
                    .isEqualTo(
                            TicketDTO.builder()
                                    .id(13L)
                                    .assignUserId(1L)
                                    .projectId(3L)
                                    .isCompleted(false)
                                    .channel(TicketChannel.WEB_PORTAL)
                                    .iterationId(2L)
                                    .estimate(1)
                                    .currentStateId(1L)
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
            List<TicketAgeingBucketDTO> reports =
                    reportsService.getAgeingTicketsReport(queryParams);

            assertThat(reports.isEmpty()).isEqualTo(false);
            assertThat(reports.size()).isEqualTo(6);
            assertThat(reports.stream().map(TicketAgeingBucketDTO::getBucketLabel).toList())
                    .containsExactlyInAnyOrder(
                            "0-2days",
                            "3-5days",
                            "6-10days",
                            "11-20days",
                            "21-30days",
                            "31moredays");
            assertThat(reports.getFirst().getBucketLabel()).isEqualTo("0-2days");
            assertThat(reports.getFirst().getGroupedTickets()).isEmpty();
            assertThat(reports.get(1).getBucketLabel()).isEqualTo("3-5days");
            assertThat(reports.get(1).getGroupedTickets()).isNotEmpty();
            assertThat(reports.get(2).getBucketLabel()).isEqualTo("6-10days");
            assertThat(reports.get(2).getGroupedTickets()).isNotEmpty();
            List<TicketGroupDTO> allTicketsGroups =
                    reports.stream().flatMap(item -> item.getGroupedTickets().stream()).toList();
            assertThat(
                            allTicketsGroups.stream()
                                    .flatMap(item -> item.getTickets().stream())
                                    .toList()
                                    .size())
                    .isEqualTo(20);
            assertThat(reports.get(1).getGroupedTickets().getFirst().getTickets().getFirst())
                    .usingRecursiveComparison()
                    .ignoringExpectedNullFields()
                    .isEqualTo(
                            TicketDTO.builder()
                                    .id(17L)
                                    .assignUserId(1L)
                                    .projectId(3L)
                                    .isCompleted(false)
                                    .channel(TicketChannel.EMAIL)
                                    .iterationId(2L)
                                    .estimate(1)
                                    .currentStateId(1L)
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
            List<TicketAgeingBucketDTO> reports =
                    reportsService.getAgeingTicketsReport(queryParams);

            assertThat(reports.isEmpty()).isEqualTo(false);
            assertThat(reports.size()).isEqualTo(6);
            assertThat(reports.stream().map(TicketAgeingBucketDTO::getBucketLabel).toList())
                    .containsExactlyInAnyOrder(
                            "0-2days",
                            "3-5days",
                            "6-10days",
                            "11-20days",
                            "21-30days",
                            "31moredays");
            assertThat(reports.getFirst().getBucketLabel()).isEqualTo("0-2days");
            assertThat(reports.getFirst().getGroupedTickets()).isNotEmpty();
            assertThat(reports.get(1).getBucketLabel()).isEqualTo("3-5days");
            assertThat(reports.get(1).getGroupedTickets()).isNotEmpty();
            assertThat(reports.get(2).getBucketLabel()).isEqualTo("6-10days");
            assertThat(reports.get(2).getGroupedTickets()).isNotEmpty();

            List<TicketGroupDTO> allTicketsGroups =
                    reports.stream().flatMap(item -> item.getGroupedTickets().stream()).toList();
            assertThat(
                            allTicketsGroups.stream()
                                    .flatMap(item -> item.getTickets().stream())
                                    .toList()
                                    .size())
                    .isEqualTo(24);
            assertThat(allTicketsGroups.stream().map(TicketGroupDTO::getGroupByAttribute).toList())
                    .contains("Backlog", "Ready", "In Progress");
            assertThat(reports.getFirst().getGroupedTickets().getFirst().getGroupByAttribute())
                    .isEqualTo("Ready");
            assertThat(reports.getFirst().getGroupedTickets().get(1).getGroupByAttribute())
                    .isEqualTo("In Progress");
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
            List<TicketAgeingBucketDTO> reports =
                    reportsService.getAgeingTicketsReport(queryParams);

            assertThat(reports.isEmpty()).isEqualTo(false);
            assertThat(reports.size()).isEqualTo(6);
            assertThat(reports.stream().map(TicketAgeingBucketDTO::getBucketLabel).toList())
                    .containsExactlyInAnyOrder(
                            "0-2days",
                            "3-5days",
                            "6-10days",
                            "11-20days",
                            "21-30days",
                            "31moredays");
            assertThat(reports.getFirst().getBucketLabel()).isEqualTo("0-2days");
            assertThat(reports.getFirst().getGroupedTickets()).isNotEmpty();
            assertThat(reports.get(1).getBucketLabel()).isEqualTo("3-5days");
            assertThat(reports.get(1).getGroupedTickets()).isNotEmpty();
            assertThat(reports.get(2).getBucketLabel()).isEqualTo("6-10days");
            assertThat(reports.get(2).getGroupedTickets()).isNotEmpty();
            List<TicketGroupDTO> allTicketsGroups =
                    reports.stream().flatMap(item -> item.getGroupedTickets().stream()).toList();
            assertThat(
                            allTicketsGroups.stream()
                                    .flatMap(item -> item.getTickets().stream())
                                    .toList()
                                    .size())
                    .isEqualTo(24);
            assertThat(allTicketsGroups.stream().map(TicketGroupDTO::getGroupByAttribute).toList())
                    .contains("High", "Medium", "Critical");
            assertThat(reports.getFirst().getGroupedTickets().getFirst().getGroupByAttribute())
                    .isEqualTo("High");
            assertThat(reports.getFirst().getGroupedTickets().getFirst().getTickets().size())
                    .isEqualTo(1);
            assertThat(reports.getFirst().getGroupedTickets().get(1).getGroupByAttribute())
                    .isEqualTo("Medium");
            assertThat(reports.getFirst().getGroupedTickets().get(1).getTickets().size())
                    .isEqualTo(2);
            assertThat(reports.getFirst().getGroupedTickets().get(1).getTickets().getFirst())
                    .usingRecursiveComparison()
                    .ignoringExpectedNullFields()
                    .isEqualTo(
                            TicketDTO.builder()
                                    .id(13L)
                                    .assignUserId(1L)
                                    .projectId(3L)
                                    .isCompleted(false)
                                    .channel(TicketChannel.WEB_PORTAL)
                                    .iterationId(2L)
                                    .currentStateId(1L)
                                    .estimate(1)
                                    .build());
            assertThat(reports.getFirst().getGroupedTickets().get(1).getTickets().get(1))
                    .usingRecursiveComparison()
                    .ignoringExpectedNullFields()
                    .isEqualTo(
                            TicketDTO.builder()
                                    .id(16L)
                                    .assignUserId(1L)
                                    .projectId(3L)
                                    .isCompleted(true)
                                    .channel(TicketChannel.WEB_PORTAL)
                                    .iterationId(2L)
                                    .currentStateId(1L)
                                    .estimate(1)
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
            List<TicketAgeingBucketDTO> reports =
                    reportsService.getAgeingTicketsReport(queryParams);

            assertThat(reports.isEmpty()).isEqualTo(false);
            assertThat(reports.size()).isEqualTo(6);
            assertThat(reports.stream().map(TicketAgeingBucketDTO::getBucketLabel).toList())
                    .containsExactlyInAnyOrder(
                            "0-2days",
                            "3-5days",
                            "6-10days",
                            "11-20days",
                            "21-30days",
                            "31moredays");
            assertThat(reports.getFirst().getBucketLabel()).isEqualTo("0-2days");
            assertThat(reports.getFirst().getGroupedTickets()).isNotEmpty();
            assertThat(reports.get(1).getBucketLabel()).isEqualTo("3-5days");
            assertThat(reports.get(1).getGroupedTickets()).isNotEmpty();
            assertThat(reports.get(2).getBucketLabel()).isEqualTo("6-10days");
            assertThat(reports.get(2).getGroupedTickets()).isNotEmpty();
            List<TicketGroupDTO> allTicketsGroups =
                    reports.stream().flatMap(item -> item.getGroupedTickets().stream()).toList();
            assertThat(
                            allTicketsGroups.stream()
                                    .map(TicketGroupDTO::getGroupByAttribute)
                                    .collect(Collectors.toSet()))
                    .containsExactlyElementsOf(List.of("1", "2"));
            assertThat(
                            allTicketsGroups.stream()
                                    .flatMap(item -> item.getTickets().stream())
                                    .toList()
                                    .size())
                    .isEqualTo(16);
            assertThat(reports.getFirst().getGroupedTickets().size()).isEqualTo(2);
            assertThat(reports.getFirst().getGroupedTickets().getFirst().getTickets().size())
                    .isEqualTo(2);
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

            List<TicketAgeingBucketDTO> reports =
                    reportsService.getAgeingTicketsReport(queryParams);

            assertThat(reports.isEmpty()).isEqualTo(false);
            assertThat(reports.size()).isEqualTo(6);
            assertThat(reports.stream().map(TicketAgeingBucketDTO::getBucketLabel).toList())
                    .containsExactlyInAnyOrder(
                            "0-2days",
                            "3-5days",
                            "6-10days",
                            "11-20days",
                            "21-30days",
                            "31moredays");
            assertThat(reports.getFirst().getBucketLabel()).isEqualTo("0-2days");
            assertThat(reports.getFirst().getGroupedTickets()).isNotEmpty();
            assertThat(reports.get(1).getBucketLabel()).isEqualTo("3-5days");
            assertThat(reports.get(1).getGroupedTickets()).isNotEmpty();
            assertThat(reports.get(2).getBucketLabel()).isEqualTo("6-10days");
            assertThat(reports.get(2).getGroupedTickets()).isNotEmpty();
            assertThat(reports.getFirst().getGroupedTickets().size()).isEqualTo(2);
            assertThat(reports.getFirst().getGroupedTickets().getFirst().getTickets().size())
                    .isEqualTo(1);
            assertThat(reports.getFirst().getGroupedTickets().getFirst().getTickets().getFirst())
                    .usingRecursiveComparison()
                    .ignoringExpectedNullFields()
                    .isEqualTo(
                            TicketDTO.builder()
                                    .id(14L)
                                    .assignUserId(2L)
                                    .projectId(3L)
                                    .isCompleted(false)
                                    .channel(TicketChannel.WEB_PORTAL)
                                    .iterationId(2L)
                                    .currentStateId(2L)
                                    .estimate(2)
                                    .build());
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
            List<TicketAgeingBucketDTO> reports =
                    reportsService.getAgeingTicketsReport(queryParams);

            assertThat(reports.isEmpty()).isEqualTo(false);
            assertThat(reports.size()).isEqualTo(6);
            assertThat(reports.stream().map(TicketAgeingBucketDTO::getBucketLabel).toList())
                    .containsExactlyInAnyOrder(
                            "0-2days",
                            "3-5days",
                            "6-10days",
                            "11-20days",
                            "21-30days",
                            "31moredays");
            assertThat(reports.getFirst().getBucketLabel()).isEqualTo("0-2days");
            assertThat(reports.getFirst().getGroupedTickets()).isNotEmpty();
            assertThat(reports.get(1).getBucketLabel()).isEqualTo("3-5days");
            assertThat(reports.get(1).getGroupedTickets()).isNotEmpty();
            assertThat(reports.get(2).getBucketLabel()).isEqualTo("6-10days");
            assertThat(reports.get(2).getGroupedTickets()).isNotEmpty();
            assertThat(reports.getFirst().getGroupedTickets().size()).isEqualTo(2);
            assertThat(reports.getFirst().getGroupedTickets().getFirst().getTickets().size())
                    .isEqualTo(1);
            assertThat(reports.getFirst().getGroupedTickets().getFirst().getTickets().getFirst())
                    .usingRecursiveComparison()
                    .ignoringExpectedNullFields()
                    .isEqualTo(
                            TicketDTO.builder()
                                    .id(13L)
                                    .assignUserId(1L)
                                    .projectId(3L)
                                    .isCompleted(false)
                                    .channel(TicketChannel.WEB_PORTAL)
                                    .iterationId(2L)
                                    .currentStateId(1L)
                                    .estimate(1)
                                    .build());
        }
    }
}
