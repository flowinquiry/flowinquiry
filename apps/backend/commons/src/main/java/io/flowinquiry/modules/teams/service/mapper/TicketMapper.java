package io.flowinquiry.modules.teams.service.mapper;

import io.flowinquiry.modules.teams.domain.Team;
import io.flowinquiry.modules.teams.domain.Ticket;
import io.flowinquiry.modules.teams.service.dto.TicketDTO;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.utils.BaseMapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;

@Mapper(
        componentModel = "spring",
        uses = {TicketConversationHealthMapper.class})
public interface TicketMapper extends BaseMapper {

    @Mapping(target = "teamId", source = "team.id")
    @Mapping(target = "requestUserId", source = "requestUser.id")
    @Mapping(
            target = "requestUserName",
            source = "requestUser",
            qualifiedByName = "mapUserFullName")
    @Mapping(target = "requestUserImageUrl", source = "requestUser.imageUrl")
    @Mapping(target = "assignUserId", source = "assignUser.id")
    @Mapping(target = "assignUserName", source = "assignUser", qualifiedByName = "mapUserFullName")
    @Mapping(target = "assignUserImageUrl", source = "assignUser.imageUrl")
    @Mapping(target = "teamName", source = "team.name")
    @Mapping(target = "workflowId", source = "workflow.id")
    @Mapping(target = "workflowName", source = "workflow.name")
    @Mapping(target = "workflowRequestName", source = "workflow.requestName")
    @Mapping(target = "projectId", source = "project.id")
    @Mapping(target = "projectName", source = "project.name")
    @Mapping(target = "projectShortName", source = "project.shortName")
    @Mapping(target = "currentStateId", source = "currentState.id")
    @Mapping(target = "currentStateName", source = "currentState.stateName")
    @Mapping(target = "iterationId", source = "iteration.id")
    @Mapping(target = "iterationName", source = "iteration.name")
    @Mapping(target = "epicId", source = "epic.id")
    @Mapping(target = "epicName", source = "epic.name")
    @Mapping(target = "conversationHealth", source = "conversationHealth")
    @Mapping(target = "parentTicketId", source = "parentTicket.id")
    @Mapping(
            target = "childTicketIds",
            expression =
                    "java(ticket.getChildTickets() == null ? null : ticket.getChildTickets().stream().map(Ticket::getId).toList())")
    TicketDTO toDto(Ticket ticket);

    @Mapping(target = "team", source = "teamId", qualifiedByName = "toTeam")
    @Mapping(
            target = "workflow",
            expression = "java(toStub(ticketDTO.getWorkflowId(), Workflow.class))")
    @Mapping(
            target = "project",
            expression = "java(toStub(ticketDTO.getProjectId(), Project.class))")
    @Mapping(
            target = "requestUser",
            expression = "java(toStub(ticketDTO.getRequestUserId(), User.class))")
    @Mapping(
            target = "assignUser",
            expression = "java(toStub(ticketDTO.getAssignUserId(), User.class))")
    @Mapping(
            target = "iteration",
            expression = "java(toStub(ticketDTO.getIterationId(), ProjectIteration.class))")
    @Mapping(target = "epic", expression = "java(toStub(ticketDTO.getEpicId(), ProjectEpic.class))")
    @Mapping(
            target = "currentState",
            expression = "java(toStub(ticketDTO.getCurrentStateId(), WorkflowState.class))")
    @Mapping(target = "conversationHealth", source = "conversationHealth")
    @Mapping(
            target = "parentTicket",
            expression = "java(toStub(ticketDTO.getParentTicketId(), Ticket.class))")
    @Mapping(target = "childTickets", ignore = true)
    Ticket toEntity(TicketDTO ticketDTO);

    @Mapping(target = "team", source = "teamId", qualifiedByName = "toTeam")
    @Mapping(target = "workflow", expression = "java(toStub(dto.getWorkflowId(), Workflow.class))")
    @Mapping(
            target = "requestUser",
            expression = "java(toStub(dto.getRequestUserId(), User.class))")
    @Mapping(target = "assignUser", expression = "java(toStub(dto.getAssignUserId(), User.class))")
    @Mapping(
            target = "iteration",
            expression = "java(toStub(dto.getIterationId(), ProjectIteration.class))")
    @Mapping(target = "epic", expression = "java(toStub(dto.getEpicId(), ProjectEpic.class))")
    @Mapping(
            target = "currentState",
            expression = "java(toStub(dto.getCurrentStateId(), WorkflowState.class))")
    @Mapping(target = "project", expression = "java(toStub(dto.getProjectId(), Project.class))")
    @Mapping(
            target = "conversationHealth",
            ignore = true) // ✅ Ignore to avoid detached entity issue
    @Mapping(
            target = "parentTicket",
            expression = "java(toStub(dto.getParentTicketId(), Ticket.class))")
    @Mapping(target = "childTickets", ignore = true)
    void updateEntity(TicketDTO dto, @MappingTarget Ticket entity);

    @Named("toTeam")
    default Team toTeam(Long teamId) {
        return (teamId == null) ? null : Team.builder().id(teamId).build();
    }

    @Named("mapUserFullName")
    default String mapUserFullName(User user) {
        if (user == null) {
            return null;
        }
        String firstName = user.getFirstName() != null ? user.getFirstName() : "";
        String lastName = user.getLastName() != null ? user.getLastName() : "";
        return (firstName + " " + lastName).trim();
    }
}
