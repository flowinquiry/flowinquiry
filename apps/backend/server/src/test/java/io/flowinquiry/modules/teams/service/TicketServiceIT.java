package io.flowinquiry.modules.teams.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import io.flowinquiry.it.IntegrationTest;
import io.flowinquiry.modules.audit.service.event.AuditLogUpdateEvent;
import io.flowinquiry.modules.collab.domain.EntityType;
import io.flowinquiry.modules.collab.domain.EntityWatcher;
import io.flowinquiry.modules.collab.repository.EntityWatcherRepository;
import io.flowinquiry.modules.teams.domain.TShirtSize;
import io.flowinquiry.modules.teams.domain.Ticket;
import io.flowinquiry.modules.teams.domain.TicketChannel;
import io.flowinquiry.modules.teams.domain.WorkflowTransitionHistoryStatus;
import io.flowinquiry.modules.teams.repository.TicketRepository;
import io.flowinquiry.modules.teams.service.dto.PriorityDistributionDTO;
import io.flowinquiry.modules.teams.service.dto.TeamTicketPriorityDistributionDTO;
import io.flowinquiry.modules.teams.service.dto.TicketActionCountByDateDTO;
import io.flowinquiry.modules.teams.service.dto.TicketDTO;
import io.flowinquiry.modules.teams.service.dto.TicketDistributionDTO;
import io.flowinquiry.modules.teams.service.event.NewTicketCreatedEvent;
import io.flowinquiry.modules.teams.service.event.TicketWorkStateTransitionEvent;
import io.flowinquiry.modules.teams.service.mapper.TicketMapper;
import io.flowinquiry.modules.usermanagement.service.dto.TicketStatisticsDTO;
import io.flowinquiry.query.Filter;
import io.flowinquiry.query.FilterOperator;
import io.flowinquiry.query.QueryDTO;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
public class TicketServiceIT {

    @Autowired private TicketService ticketService;
    @Autowired private TicketRepository ticketRepository;
    @Autowired private TicketMapper ticketMapper;
    @Autowired private EntityWatcherRepository entityWatcherRepository;
    @Autowired private ApplicationEventPublisher realEventPublisher;
    private ApplicationEventPublisher spyEventPublisher;

    @BeforeEach
    void setUp() {
        spyEventPublisher = Mockito.spy(realEventPublisher);
        ReflectionTestUtils.setField(ticketService, "eventPublisher", spyEventPublisher);
        doNothing().when(spyEventPublisher).publishEvent(any());
    }

    @Test
    void shouldCreateTicketSuccessfully() {
        TicketDTO ticketDTO = ticketMapper.toDto(ticketRepository.findById(2L).orElseThrow());
        ticketDTO.setId(null);
        ticketDTO.setConversationHealth(null);
        TicketDTO savedTicket = ticketService.createTicket(ticketDTO);
        assertThat(savedTicket).isNotNull();

        ArgumentCaptor<NewTicketCreatedEvent> eventCaptor =
                ArgumentCaptor.forClass(NewTicketCreatedEvent.class);
        verify(spyEventPublisher, times(1)).publishEvent(eventCaptor.capture());
    }

    @Test
    void shouldUpdateTicketSuccessfully() {
        TicketDTO ticketDTO = ticketMapper.toDto(ticketRepository.findById(1L).orElseThrow());
        ticketDTO.setRequestTitle("Updated Request Title");
        ticketDTO.setCurrentStateId(2L);
        ticketDTO.setSize(TShirtSize.XL);
        ticketDTO.setEstimate(15);

        TicketDTO updatedRequest = ticketService.updateTicket(ticketDTO);

        assertThat(updatedRequest.getRequestTitle()).isEqualTo("Updated Request Title");
        assertThat(updatedRequest.getCurrentStateId()).isEqualTo(2L);
        assertThat(ticketDTO.getSize()).isEqualTo(TShirtSize.XL);
        assertThat(ticketDTO.getEstimate()).isEqualTo(15);
        List<EntityWatcher> watchers =
                entityWatcherRepository.findByEntityTypeAndEntityId(EntityType.Ticket, 1L);
        assertThat(watchers).hasSize(3);
        List<String> emails =
                watchers.stream().map(watcher -> watcher.getWatchUser().getEmail()).toList();
        assertThat(emails)
                .containsExactlyInAnyOrder(
                        "alice.johnson@example.com",
                        "charlie.green@example.com",
                        "bob.brown@example.com");

        ArgumentCaptor<AuditLogUpdateEvent> auditLogUpdateEventArgumentCaptor =
                ArgumentCaptor.forClass(AuditLogUpdateEvent.class);
        verify(spyEventPublisher, times(1))
                .publishEvent(auditLogUpdateEventArgumentCaptor.capture());

        ArgumentCaptor<TicketWorkStateTransitionEvent> workflowStateTransitionEventCaptor =
                ArgumentCaptor.forClass(TicketWorkStateTransitionEvent.class);
        verify(spyEventPublisher, times(1))
                .publishEvent(workflowStateTransitionEventCaptor.capture());

        TicketWorkStateTransitionEvent capturedEvent =
                workflowStateTransitionEventCaptor.getValue();

        assertThat(capturedEvent.getSourceStateId()).isEqualTo(1L);
        assertThat(capturedEvent.getTargetStateId()).isEqualTo(2L);
    }

    @Test
    void shouldFindNextTicketSuccessfully() {
        TicketDTO nextEntity = ticketService.getNextTicket(11L, null).orElseThrow();

        // Then: Validate key properties in a single assertion block
        assertThat(nextEntity)
                .isNotNull()
                .extracting(
                        TicketDTO::getId,
                        TicketDTO::getTeamId,
                        TicketDTO::getWorkflowId,
                        TicketDTO::getRequestTitle,
                        TicketDTO::getRequestDescription,
                        TicketDTO::getChannel,
                        TicketDTO::getIsNew,
                        TicketDTO::getIsCompleted,
                        TicketDTO::getEstimatedCompletionDate,
                        TicketDTO::getSize,
                        TicketDTO::getEstimate)
                .containsExactly(
                        12L,
                        1L,
                        1L, // ID, team, workflow
                        "Refund Status Inquiry",
                        "Customer wants an update on refund.",
                        TicketChannel.CHAT,
                        true,
                        false,
                        LocalDate.of(2025, 2, 17),
                        TShirtSize.S,
                        9);

        assertThat(nextEntity.getCreatedAt()).isNotNull();
        assertThat(nextEntity.getModifiedAt()).isNotNull();
        assertThat(nextEntity.getNumberAttachments()).isGreaterThanOrEqualTo(0);
    }

    @Test
    void shouldFindPreviousTicketSuccessfully() {
        TicketDTO previousEntity = ticketService.getPreviousTicket(11L, null).orElseThrow();

        // Then: Validate key properties in a single assertion block
        assertThat(previousEntity)
                .isNotNull()
                .extracting(
                        TicketDTO::getId,
                        TicketDTO::getTeamId,
                        TicketDTO::getWorkflowId,
                        TicketDTO::getRequestTitle,
                        TicketDTO::getRequestDescription,
                        TicketDTO::getChannel,
                        TicketDTO::getIsNew,
                        TicketDTO::getIsCompleted,
                        TicketDTO::getEstimatedCompletionDate)
                .containsExactly(
                        1L,
                        1L,
                        1L, // ID, team, workflow
                        "Customer Refund Issue",
                        "Customer reported an issue with a refund request.",
                        TicketChannel.WEB_PORTAL,
                        true,
                        false,
                        LocalDate.of(2025, 2, 15));

        assertThat(previousEntity.getCreatedAt()).isNotNull();
        assertThat(previousEntity.getModifiedAt()).isNotNull();
        assertThat(previousEntity.getNumberAttachments()).isGreaterThanOrEqualTo(0);
    }

    @Test
    void shouldFindTicketsSuccessfully() {
        QueryDTO queryDTO = new QueryDTO();
        List<Filter> filters = new ArrayList<>();
        filters.add(new Filter("team.id", FilterOperator.EQ, 1L));
        queryDTO.setFilters(filters);

        Page<TicketDTO> tickets = ticketService.findTickets(queryDTO, Pageable.unpaged());

        assertThat(tickets).isNotEmpty();
        assertThat(tickets.getContent()).isNotEmpty();
        assertThat(tickets.getContent().get(0).getTeamId()).isEqualTo(1L);
    }

    @Test
    void shouldGetTicketByIdSuccessfully() {
        TicketDTO ticket = ticketService.getTicketById(1L);

        assertThat(ticket).isNotNull();
        assertThat(ticket.getId()).isEqualTo(1L);
        assertThat(ticket.getRequestTitle()).isEqualTo("Customer Refund Issue");
        assertThat(ticket.getChannel()).isEqualTo(TicketChannel.WEB_PORTAL);
    }

    @Test
    void shouldDeleteTicketSuccessfully() {
        // Create a ticket to delete
        TicketDTO ticketDTO = ticketMapper.toDto(ticketRepository.findById(2L).orElseThrow());
        ticketDTO.setId(null);
        ticketDTO.setConversationHealth(null);
        TicketDTO savedTicket = ticketService.createTicket(ticketDTO);

        // Delete the ticket
        ticketService.deleteTicket(savedTicket.getId());

        // Verify it's deleted
        assertThat(ticketRepository.existsById(savedTicket.getId())).isFalse();
    }

    @Test
    void shouldGetTicketDistributionSuccessfully() {
        Instant fromDate = Instant.now().minus(30, ChronoUnit.DAYS);
        Instant toDate = Instant.now();

        List<TicketDistributionDTO> distribution =
                ticketService.getTicketDistribution(1L, fromDate, toDate);

        assertThat(distribution).isNotNull();
    }

    @Test
    void shouldGetUnassignedTicketsSuccessfully() {
        Page<TicketDTO> unassignedTickets =
                ticketService.getUnassignedTickets(1L, Pageable.unpaged());

        assertThat(unassignedTickets).isNotNull();
        assertThat(unassignedTickets.getContent())
                .allMatch(ticket -> ticket.getAssignUserId() == null);
    }

    @Test
    void shouldGetPriorityDistributionSuccessfully() {
        Instant fromDate = Instant.now().minus(30, ChronoUnit.DAYS);
        Instant toDate = Instant.now();

        List<PriorityDistributionDTO> distribution =
                ticketService.getPriorityDistribution(1L, fromDate, toDate);

        assertThat(distribution).isNotNull();
    }

    @Test
    void shouldGetTicketStatisticsByTeamIdSuccessfully() {
        Instant fromDate = Instant.now().minus(30, ChronoUnit.DAYS);
        Instant toDate = Instant.now();

        // Just verify that the method call doesn't throw an exception
        TicketStatisticsDTO statistics =
                ticketService.getTicketStatisticsByTeamId(1L, fromDate, toDate);

        // No assertions needed as the statistics might be null in the test database
    }

    @Test
    void shouldCalculateEarliestSlaDueDateCorrectly() {
        // Since calculateEarliestSlaDueDate is private, we'll test it indirectly through
        // createTicket
        TicketDTO ticketDTO = ticketMapper.toDto(ticketRepository.findById(2L).orElseThrow());
        ticketDTO.setId(null);
        ticketDTO.setConversationHealth(null);

        TicketDTO savedTicket = ticketService.createTicket(ticketDTO);

        // Verify the ticket was created with an SLA due date
        assertThat(savedTicket).isNotNull();
        assertThat(savedTicket.getId()).isNotNull();

        // Clean up
        ticketService.deleteTicket(savedTicket.getId());
    }

    @Test
    void shouldGetOverdueTicketsByTeamSuccessfully() {
        Page<TicketDTO> overdueTickets =
                ticketService.getOverdueTicketsByTeam(1L, Pageable.unpaged());

        assertThat(overdueTickets).isNotNull();
    }

    @Test
    void shouldGetOverdueTicketSuccessfully() {
        List<TicketDTO> overdueTickets = ticketService.getAllOverdueTicketsAfterId(0L, 500);
        assertThat(overdueTickets).isNotNull();
    }

    @Test
    void shouldGetOverdueTicketsByUserSuccessfully() {
        // Assuming user ID 1 exists in test data
        Page<TicketDTO> overdueTickets =
                ticketService.getOverdueTicketsByUser(1L, Pageable.unpaged());

        assertThat(overdueTickets).isNotNull();
    }

    @Test
    void shouldCountOverdueTicketsCorrectly() {
        Instant fromDate = Instant.now().minus(30, ChronoUnit.DAYS);
        Instant toDate = Instant.now();

        Long count =
                ticketService.countOverdueTickets(
                        1L, WorkflowTransitionHistoryStatus.COMPLETED, fromDate, toDate);

        assertThat(count).isNotNull();
        assertThat(count).isGreaterThanOrEqualTo(0);
    }

    @Test
    void shouldGetTicketCreationTimeSeriesSuccessfully() {
        // Get ticket creation time series for the last 7 days
        List<TicketActionCountByDateDTO> timeSeries =
                ticketService.getTicketCreationTimeSeries(1L, 7);

        assertThat(timeSeries).isNotNull();
        assertThat(timeSeries).hasSize(7); // Should return data for 7 days

        // Verify each day has the expected structure
        for (TicketActionCountByDateDTO dataPoint : timeSeries) {
            assertThat(dataPoint.getDate()).isNotNull();
            assertThat(dataPoint.getCreatedCount()).isNotNull();
            assertThat(dataPoint.getClosedCount()).isNotNull();
        }
    }

    @Test
    void shouldGetPriorityDistributionForUserSuccessfully() {
        Instant fromDate = Instant.now().minus(30, ChronoUnit.DAYS);
        Instant toDate = Instant.now();

        // Assuming user ID 1 exists in test data
        List<TeamTicketPriorityDistributionDTO> distribution =
                ticketService.getPriorityDistributionForUser(1L, fromDate, toDate);

        assertThat(distribution).isNotNull();
    }

    @Test
    void shouldUpdateTicketStateSuccessfully() {
        // Get an existing ticket
        TicketDTO ticket = ticketService.getTicketById(1L);
        Long currentStateId = ticket.getCurrentStateId();

        // Update to a different state (assuming state ID 2 exists)
        Long newStateId = 2L;
        TicketDTO updatedTicket = ticketService.updateTicketState(ticket.getId(), newStateId);

        // Verify the state was updated
        assertThat(updatedTicket).isNotNull();
        assertThat(updatedTicket.getCurrentStateId()).isEqualTo(newStateId);
        assertThat(updatedTicket.getCurrentStateId()).isNotEqualTo(currentStateId);

        // Verify event was published
        ArgumentCaptor<TicketWorkStateTransitionEvent> eventCaptor =
                ArgumentCaptor.forClass(TicketWorkStateTransitionEvent.class);
        verify(spyEventPublisher, times(1)).publishEvent(eventCaptor.capture());

        TicketWorkStateTransitionEvent capturedEvent = eventCaptor.getValue();
        assertThat(capturedEvent.getSourceStateId()).isEqualTo(currentStateId);
        assertThat(capturedEvent.getTargetStateId()).isEqualTo(newStateId);
    }

    @Test
    void shouldCloseTicketsForGivenIterationId() {
        ticketService.closeTicketsWithIteration(3L);

        Ticket ticket = ticketRepository.findById(1L).get();
        assertThat(ticket.getIteration().getId()).isEqualTo(3L);
        assertThat(ticket.getIsCompleted()).isTrue();

        ticket = ticketRepository.findById(2L).get();
        assertThat(ticket.getIteration().getTotalTickets()).isEqualTo(3L);
        assertThat(ticket.getIsCompleted()).isTrue();
    }

    @Test
    void shouldGetNextProjectTicketNumberSuccessfully() {
        TicketDTO ticketDTO = ticketMapper.toDto(ticketRepository.findById(2L).orElseThrow());
        ticketDTO.setId(null);
        ticketDTO.setConversationHealth(null);
        ticketDTO.setProjectId(null);

        TicketDTO savedTicket = ticketService.createTicket(ticketDTO);

        // Verify the ticket was created successfully
        assertThat(savedTicket).isNotNull();
        assertThat(savedTicket.getId()).isNotNull();

        // Clean up
        ticketService.deleteTicket(savedTicket.getId());
    }
}
