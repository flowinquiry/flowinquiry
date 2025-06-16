package io.flowinquiry.modules.teams.service.mapper;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import io.flowinquiry.modules.teams.domain.Ticket;
import io.flowinquiry.modules.teams.domain.WorkflowState;
import io.flowinquiry.modules.teams.domain.WorkflowTransitionHistory;
import io.flowinquiry.modules.teams.domain.WorkflowTransitionHistoryStatus;
import io.flowinquiry.modules.teams.service.dto.TransitionItemCollectionDTO;
import io.flowinquiry.modules.teams.service.dto.TransitionItemDTO;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

public class WorkflowTransitionHistoryMapperTest {

    private WorkflowTransitionHistoryMapper workflowTransitionHistoryMapper;

    @BeforeEach
    public void setup() {
        workflowTransitionHistoryMapper = Mappers.getMapper(WorkflowTransitionHistoryMapper.class);
    }

    @Test
    public void testToTransitionItemDto() {
        // Given
        WorkflowState fromState = WorkflowState.builder().id(1L).stateName("From State").build();

        WorkflowState toState = WorkflowState.builder().id(2L).stateName("To State").build();

        Ticket ticket = Ticket.builder().id(3L).build();

        Instant now = Instant.now();
        Instant dueDate = now.plusSeconds(86400); // plus one day

        WorkflowTransitionHistory history =
                WorkflowTransitionHistory.builder()
                        .id(4L)
                        .ticket(ticket)
                        .fromState(fromState)
                        .toState(toState)
                        .eventName("Test Event")
                        .transitionDate(now)
                        .slaDueDate(dueDate)
                        .status(WorkflowTransitionHistoryStatus.COMPLETED)
                        .build();

        // When
        TransitionItemDTO transitionItemDTO =
                workflowTransitionHistoryMapper.toTransitionItemDto(history);

        // Then
        assertAll(
                () ->
                        assertEquals(
                                history.getFromState().getStateName(),
                                transitionItemDTO.getFromState()),
                () ->
                        assertEquals(
                                history.getToState().getStateName(),
                                transitionItemDTO.getToState()),
                () -> assertEquals(history.getEventName(), transitionItemDTO.getEventName()),
                () ->
                        assertEquals(
                                history.getTransitionDate(), transitionItemDTO.getTransitionDate()),
                () -> assertEquals(history.getSlaDueDate(), transitionItemDTO.getSlaDueDate()),
                () -> assertEquals(history.getStatus().name(), transitionItemDTO.getStatus()));
    }

    @Test
    public void testToTicketHistoryDto() {
        // Given
        Long ticketId = 3L;

        WorkflowState fromState1 = WorkflowState.builder().id(1L).stateName("From State 1").build();

        WorkflowState toState1 = WorkflowState.builder().id(2L).stateName("To State 1").build();

        Ticket ticket = Ticket.builder().id(ticketId).build();

        Instant now = Instant.now();

        WorkflowTransitionHistory history1 =
                WorkflowTransitionHistory.builder()
                        .id(4L)
                        .ticket(ticket)
                        .fromState(fromState1)
                        .toState(toState1)
                        .eventName("Event 1")
                        .transitionDate(now)
                        .status(WorkflowTransitionHistoryStatus.COMPLETED)
                        .build();

        WorkflowState fromState2 = WorkflowState.builder().id(2L).stateName("From State 2").build();

        WorkflowState toState2 = WorkflowState.builder().id(5L).stateName("To State 2").build();

        WorkflowTransitionHistory history2 =
                WorkflowTransitionHistory.builder()
                        .id(6L)
                        .ticket(ticket)
                        .fromState(fromState2)
                        .toState(toState2)
                        .eventName("Event 2")
                        .transitionDate(now.plusSeconds(3600)) // plus one hour
                        .status(WorkflowTransitionHistoryStatus.IN_PROGRESS)
                        .build();

        List<WorkflowTransitionHistory> histories = Arrays.asList(history1, history2);

        // When
        TransitionItemCollectionDTO collectionDTO =
                workflowTransitionHistoryMapper.toTicketHistoryDto(ticketId, histories);

        // Then
        assertAll(
                () -> assertEquals(ticketId, collectionDTO.getTicketId()),
                () -> assertEquals(2, collectionDTO.getTransitions().size()),
                () ->
                        assertEquals(
                                history1.getFromState().getStateName(),
                                collectionDTO.getTransitions().get(0).getFromState()),
                () ->
                        assertEquals(
                                history1.getToState().getStateName(),
                                collectionDTO.getTransitions().get(0).getToState()),
                () ->
                        assertEquals(
                                history1.getEventName(),
                                collectionDTO.getTransitions().get(0).getEventName()),
                () ->
                        assertEquals(
                                history1.getTransitionDate(),
                                collectionDTO.getTransitions().get(0).getTransitionDate()),
                () ->
                        assertEquals(
                                history1.getStatus().name(),
                                collectionDTO.getTransitions().get(0).getStatus()),
                () ->
                        assertEquals(
                                history2.getFromState().getStateName(),
                                collectionDTO.getTransitions().get(1).getFromState()),
                () ->
                        assertEquals(
                                history2.getToState().getStateName(),
                                collectionDTO.getTransitions().get(1).getToState()),
                () ->
                        assertEquals(
                                history2.getEventName(),
                                collectionDTO.getTransitions().get(1).getEventName()),
                () ->
                        assertEquals(
                                history2.getTransitionDate(),
                                collectionDTO.getTransitions().get(1).getTransitionDate()),
                () ->
                        assertEquals(
                                history2.getStatus().name(),
                                collectionDTO.getTransitions().get(1).getStatus()));
    }

    @Test
    public void testNullValues() {
        // Test null entity
        assertNull(workflowTransitionHistoryMapper.toTransitionItemDto(null));

        // Test empty list
        TransitionItemCollectionDTO collectionDTO =
                workflowTransitionHistoryMapper.toTicketHistoryDto(
                        1L, java.util.Collections.emptyList());
        assertEquals(0, collectionDTO.getTransitions().size());
    }
}
