package io.flowinquiry.modules.teams.service.mapper;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;

import io.flowinquiry.modules.teams.domain.*;
import io.flowinquiry.modules.teams.service.dto.TicketDTO;
import io.flowinquiry.modules.usermanagement.domain.User;
import java.lang.reflect.Field;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

public class TicketMapperTest {

    private TicketMapper ticketMapper;
    private TicketConversationHealthMapper ticketConversationHealthMapper;

    @BeforeEach
    public void setup() throws Exception {
        // Create instances of the mappers
        ticketMapper = Mappers.getMapper(TicketMapper.class);
        ticketConversationHealthMapper = Mappers.getMapper(TicketConversationHealthMapper.class);

        // Use reflection to set the ticketConversationHealthMapper on the ticketMapper
        Field field = ticketMapper.getClass().getDeclaredField("ticketConversationHealthMapper");
        field.setAccessible(true);
        field.set(ticketMapper, ticketConversationHealthMapper);
    }

    @Test
    public void testToDto() {
        // Given
        Team team = Team.builder().id(1L).name("Team Name").build();
        Workflow workflow =
                Workflow.builder().id(2L).name("Workflow Name").requestName("Request Name").build();
        Project project = Project.builder().id(3L).name("Project Name").shortName("PRJ").build();
        User requestUser =
                User.builder()
                        .id(4L)
                        .firstName("Request")
                        .lastName("User")
                        .imageUrl("request-image.jpg")
                        .build();
        User assignUser =
                User.builder()
                        .id(5L)
                        .firstName("Assign")
                        .lastName("User")
                        .imageUrl("assign-image.jpg")
                        .build();
        WorkflowState currentState =
                WorkflowState.builder().id(6L).stateName("Current State").build();

        // Create ProjectIteration using constructor and setters
        ProjectIteration iteration = new ProjectIteration();
        iteration.setId(7L);
        iteration.setName("Iteration Name");

        // Create ProjectEpic using constructor and setters
        ProjectEpic epic = new ProjectEpic();
        epic.setId(8L);
        epic.setName("Epic Name");

        TicketConversationHealth conversationHealth =
                TicketConversationHealth.builder().id(9L).build();

        Ticket parentTicket = Ticket.builder().id(10L).build();

        Ticket childTicket1 = Ticket.builder().id(11L).build();
        Ticket childTicket2 = Ticket.builder().id(12L).build();
        List<Ticket> childTickets = new ArrayList<>();
        childTickets.add(childTicket1);
        childTickets.add(childTicket2);

        Ticket ticket =
                Ticket.builder()
                        .id(1L)
                        .team(team)
                        .workflow(workflow)
                        .project(project)
                        .projectTicketNumber(123L)
                        .requestUser(requestUser)
                        .assignUser(assignUser)
                        .requestTitle("Request Title")
                        .requestDescription("Request Description")
                        .priority(TicketPriority.High)
                        .estimatedCompletionDate(LocalDate.now())
                        .actualCompletionDate(LocalDate.now().plusDays(1))
                        .currentState(currentState)
                        .channel(TicketChannel.WEB_PORTAL)
                        .isNew(true)
                        .isCompleted(false)
                        .numberAttachments(2)
                        .numberWatchers(3)
                        .conversationHealth(conversationHealth)
                        .iteration(iteration)
                        .epic(epic)
                        .size(TShirtSize.M)
                        .estimate(8)
                        .parentTicket(parentTicket)
                        .childTickets(childTickets)
                        .build();

        // When
        TicketDTO ticketDTO = ticketMapper.toDto(ticket);

        // Then
        assertAll(
                () -> assertEquals(ticket.getId(), ticketDTO.getId()),
                () -> assertEquals(ticket.getTeam().getId(), ticketDTO.getTeamId()),
                () -> assertEquals(ticket.getTeam().getName(), ticketDTO.getTeamName()),
                () -> assertEquals(ticket.getWorkflow().getId(), ticketDTO.getWorkflowId()),
                () -> assertEquals(ticket.getWorkflow().getName(), ticketDTO.getWorkflowName()),
                () ->
                        assertEquals(
                                ticket.getWorkflow().getRequestName(),
                                ticketDTO.getWorkflowRequestName()),
                () -> assertEquals(ticket.getProject().getId(), ticketDTO.getProjectId()),
                () -> assertEquals(ticket.getProject().getName(), ticketDTO.getProjectName()),
                () ->
                        assertEquals(
                                ticket.getProject().getShortName(),
                                ticketDTO.getProjectShortName()),
                () ->
                        assertEquals(
                                ticket.getProjectTicketNumber(),
                                ticketDTO.getProjectTicketNumber()),
                () -> assertEquals(ticket.getRequestUser().getId(), ticketDTO.getRequestUserId()),
                () -> assertEquals("Request User", ticketDTO.getRequestUserName()),
                () ->
                        assertEquals(
                                ticket.getRequestUser().getImageUrl(),
                                ticketDTO.getRequestUserImageUrl()),
                () -> assertEquals(ticket.getAssignUser().getId(), ticketDTO.getAssignUserId()),
                () -> assertEquals("Assign User", ticketDTO.getAssignUserName()),
                () ->
                        assertEquals(
                                ticket.getAssignUser().getImageUrl(),
                                ticketDTO.getAssignUserImageUrl()),
                () -> assertEquals(ticket.getRequestTitle(), ticketDTO.getRequestTitle()),
                () ->
                        assertEquals(
                                ticket.getRequestDescription(), ticketDTO.getRequestDescription()),
                () -> assertEquals(ticket.getPriority(), ticketDTO.getPriority()),
                () ->
                        assertEquals(
                                ticket.getEstimatedCompletionDate(),
                                ticketDTO.getEstimatedCompletionDate()),
                () ->
                        assertEquals(
                                ticket.getActualCompletionDate(),
                                ticketDTO.getActualCompletionDate()),
                () -> assertEquals(ticket.getCurrentState().getId(), ticketDTO.getCurrentStateId()),
                () ->
                        assertEquals(
                                ticket.getCurrentState().getStateName(),
                                ticketDTO.getCurrentStateName()),
                () -> assertEquals(ticket.getChannel(), ticketDTO.getChannel()),
                () -> assertEquals(ticket.getIsNew(), ticketDTO.getIsNew()),
                () -> assertEquals(ticket.getIsCompleted(), ticketDTO.getIsCompleted()),
                () -> assertEquals(ticket.getNumberAttachments(), ticketDTO.getNumberAttachments()),
                () -> assertEquals(ticket.getNumberWatchers(), ticketDTO.getNumberWatchers()),
                () -> assertEquals(ticket.getIteration().getId(), ticketDTO.getIterationId()),
                () -> assertEquals(ticket.getIteration().getName(), ticketDTO.getIterationName()),
                () -> assertEquals(ticket.getEpic().getId(), ticketDTO.getEpicId()),
                () -> assertEquals(ticket.getEpic().getName(), ticketDTO.getEpicName()),
                () -> assertEquals(ticket.getSize(), ticketDTO.getSize()),
                () -> assertEquals(ticket.getEstimate(), ticketDTO.getEstimate()),
                () -> assertEquals(ticket.getParentTicket().getId(), ticketDTO.getParentTicketId()),
                () -> assertEquals(2, ticketDTO.getChildTicketIds().size()),
                () -> assertEquals(childTicket1.getId(), ticketDTO.getChildTicketIds().get(0)),
                () -> assertEquals(childTicket2.getId(), ticketDTO.getChildTicketIds().get(1)));
    }

    @Test
    public void testToEntity() {
        // Given
        TicketDTO ticketDTO =
                TicketDTO.builder()
                        .id(1L)
                        .teamId(1L)
                        .teamName("Team Name")
                        .workflowId(2L)
                        .workflowName("Workflow Name")
                        .workflowRequestName("Request Name")
                        .projectId(3L)
                        .projectName("Project Name")
                        .projectShortName("PRJ")
                        .projectTicketNumber(123L)
                        .requestUserId(4L)
                        .requestUserName("Request User")
                        .requestUserImageUrl("request-image.jpg")
                        .assignUserId(5L)
                        .assignUserName("Assign User")
                        .assignUserImageUrl("assign-image.jpg")
                        .requestTitle("Request Title")
                        .requestDescription("Request Description")
                        .priority(TicketPriority.High)
                        .estimatedCompletionDate(LocalDate.now())
                        .actualCompletionDate(LocalDate.now().plusDays(1))
                        .currentStateId(6L)
                        .currentStateName("Current State")
                        .channel(TicketChannel.WEB_PORTAL)
                        .isNew(true)
                        .isCompleted(false)
                        .numberAttachments(2)
                        .numberWatchers(3)
                        .iterationId(7L)
                        .iterationName("Iteration Name")
                        .epicId(8L)
                        .epicName("Epic Name")
                        .size(TShirtSize.M)
                        .estimate(8)
                        .parentTicketId(10L)
                        .build();

        // When
        Ticket ticket = ticketMapper.toEntity(ticketDTO);

        // Then
        assertAll(
                () -> assertEquals(ticketDTO.getId(), ticket.getId()),
                () -> assertEquals(ticketDTO.getTeamId(), ticket.getTeam().getId()),
                () -> assertEquals(ticketDTO.getWorkflowId(), ticket.getWorkflow().getId()),
                () -> assertEquals(ticketDTO.getProjectId(), ticket.getProject().getId()),
                () -> assertEquals(ticketDTO.getRequestUserId(), ticket.getRequestUser().getId()),
                () -> assertEquals(ticketDTO.getAssignUserId(), ticket.getAssignUser().getId()),
                () -> assertEquals(ticketDTO.getRequestTitle(), ticket.getRequestTitle()),
                () ->
                        assertEquals(
                                ticketDTO.getRequestDescription(), ticket.getRequestDescription()),
                () ->
                        assertEquals(
                                ticketDTO.getEstimatedCompletionDate(),
                                ticket.getEstimatedCompletionDate()),
                () ->
                        assertEquals(
                                ticketDTO.getActualCompletionDate(),
                                ticket.getActualCompletionDate()),
                () -> assertEquals(ticketDTO.getCurrentStateId(), ticket.getCurrentState().getId()),
                () -> assertEquals(ticketDTO.getChannel(), ticket.getChannel()),
                () -> assertEquals(ticketDTO.getIsNew(), ticket.getIsNew()),
                () -> assertEquals(ticketDTO.getIsCompleted(), ticket.getIsCompleted()),
                () -> assertEquals(ticketDTO.getIterationId(), ticket.getIteration().getId()),
                () -> assertEquals(ticketDTO.getEpicId(), ticket.getEpic().getId()),
                () -> assertEquals(ticketDTO.getSize(), ticket.getSize()),
                () -> assertEquals(ticketDTO.getEstimate(), ticket.getEstimate()),
                () ->
                        assertEquals(
                                ticketDTO.getParentTicketId(), ticket.getParentTicket().getId()));
    }

    @Test
    public void testUpdateEntity() {
        // Given
        Team team = Team.builder().id(1L).name("Team Name").build();
        Workflow workflow =
                Workflow.builder().id(2L).name("Workflow Name").requestName("Request Name").build();
        Project project = Project.builder().id(3L).name("Project Name").shortName("PRJ").build();
        User requestUser =
                User.builder()
                        .id(4L)
                        .firstName("Request")
                        .lastName("User")
                        .imageUrl("request-image.jpg")
                        .build();
        User assignUser =
                User.builder()
                        .id(5L)
                        .firstName("Assign")
                        .lastName("User")
                        .imageUrl("assign-image.jpg")
                        .build();
        WorkflowState currentState =
                WorkflowState.builder().id(6L).stateName("Current State").build();

        ProjectIteration iteration = new ProjectIteration();
        iteration.setId(7L);
        iteration.setName("Iteration Name");

        ProjectEpic epic = new ProjectEpic();
        epic.setId(8L);
        epic.setName("Epic Name");

        TicketConversationHealth conversationHealth =
                TicketConversationHealth.builder().id(9L).build();

        Ticket parentTicket = Ticket.builder().id(10L).build();

        Ticket existingTicket =
                Ticket.builder()
                        .id(1L)
                        .team(team)
                        .workflow(workflow)
                        .project(project)
                        .projectTicketNumber(123L)
                        .requestUser(requestUser)
                        .assignUser(assignUser)
                        .requestTitle("Original Request Title")
                        .requestDescription("Original Request Description")
                        .priority(TicketPriority.Medium)
                        .estimatedCompletionDate(LocalDate.now().minusDays(1))
                        .actualCompletionDate(LocalDate.now())
                        .currentState(currentState)
                        .channel(TicketChannel.EMAIL)
                        .isNew(false)
                        .isCompleted(true)
                        .conversationHealth(conversationHealth)
                        .iteration(iteration)
                        .epic(epic)
                        .size(TShirtSize.S)
                        .estimate(4)
                        .parentTicket(parentTicket)
                        .build();

        TicketDTO updateDTO =
                TicketDTO.builder()
                        .id(1L)
                        .teamId(1L)
                        .workflowId(2L)
                        .projectId(3L)
                        .requestUserId(4L)
                        .assignUserId(5L)
                        .requestTitle("Updated Request Title")
                        .requestDescription("Updated Request Description")
                        .priority(TicketPriority.High)
                        .estimatedCompletionDate(LocalDate.now().plusDays(2))
                        .actualCompletionDate(LocalDate.now().plusDays(3))
                        .currentStateId(6L)
                        .channel(TicketChannel.WEB_PORTAL)
                        .isNew(true)
                        .isCompleted(false)
                        .iterationId(7L)
                        .epicId(8L)
                        .size(TShirtSize.L)
                        .estimate(16)
                        .parentTicketId(10L)
                        .build();

        // When
        ticketMapper.updateEntity(updateDTO, existingTicket);

        // Then
        assertAll(
                () -> assertEquals(updateDTO.getId(), existingTicket.getId()),
                () -> assertEquals(updateDTO.getTeamId(), existingTicket.getTeam().getId()),
                () -> assertEquals(updateDTO.getWorkflowId(), existingTicket.getWorkflow().getId()),
                () -> assertEquals(updateDTO.getProjectId(), existingTicket.getProject().getId()),
                () ->
                        assertEquals(
                                updateDTO.getRequestUserId(),
                                existingTicket.getRequestUser().getId()),
                () ->
                        assertEquals(
                                updateDTO.getAssignUserId(),
                                existingTicket.getAssignUser().getId()),
                () -> assertEquals(updateDTO.getRequestTitle(), existingTicket.getRequestTitle()),
                () ->
                        assertEquals(
                                updateDTO.getRequestDescription(),
                                existingTicket.getRequestDescription()),
                () ->
                        assertEquals(
                                updateDTO.getEstimatedCompletionDate(),
                                existingTicket.getEstimatedCompletionDate()),
                () ->
                        assertEquals(
                                updateDTO.getActualCompletionDate(),
                                existingTicket.getActualCompletionDate()),
                () ->
                        assertEquals(
                                updateDTO.getCurrentStateId(),
                                existingTicket.getCurrentState().getId()),
                () -> assertEquals(updateDTO.getChannel(), existingTicket.getChannel()),
                () -> assertEquals(updateDTO.getIsNew(), existingTicket.getIsNew()),
                () -> assertEquals(updateDTO.getIsCompleted(), existingTicket.getIsCompleted()),
                () ->
                        assertEquals(
                                updateDTO.getIterationId(), existingTicket.getIteration().getId()),
                () -> assertEquals(updateDTO.getEpicId(), existingTicket.getEpic().getId()),
                () -> assertEquals(updateDTO.getSize(), existingTicket.getSize()),
                () -> assertEquals(updateDTO.getEstimate(), existingTicket.getEstimate()),
                () ->
                        assertEquals(
                                updateDTO.getParentTicketId(),
                                existingTicket.getParentTicket().getId()));
    }
}
