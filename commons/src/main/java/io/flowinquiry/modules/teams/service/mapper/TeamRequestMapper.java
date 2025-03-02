package io.flowinquiry.modules.teams.service.mapper;

import io.flowinquiry.modules.teams.domain.Project;
import io.flowinquiry.modules.teams.domain.Team;
import io.flowinquiry.modules.teams.domain.TeamRequest;
import io.flowinquiry.modules.teams.domain.Workflow;
import io.flowinquiry.modules.teams.domain.WorkflowState;
import io.flowinquiry.modules.teams.service.dto.TeamRequestDTO;
import io.flowinquiry.modules.usermanagement.domain.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;

@Mapper(
        componentModel = "spring",
        uses = {TeamRequestConversationHealthMapper.class})
public interface TeamRequestMapper {

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
    @Mapping(target = "currentStateId", source = "currentState.id")
    @Mapping(target = "currentStateName", source = "currentState.stateName")
    @Mapping(target = "conversationHealth", source = "conversationHealth")
    TeamRequestDTO toDto(TeamRequest teamRequest);

    @Mapping(target = "team", source = "teamId", qualifiedByName = "toTeam")
    @Mapping(target = "workflow", source = "workflowId", qualifiedByName = "toWorkflow")
    @Mapping(target = "project", source = "projectId", qualifiedByName = "toProject")
    @Mapping(target = "requestUser", source = "requestUserId", qualifiedByName = "toUser")
    @Mapping(target = "assignUser", source = "assignUserId", qualifiedByName = "toUser")
    @Mapping(
            target = "currentState",
            source = "currentStateId",
            qualifiedByName = "toWorkflowState")
    @Mapping(target = "conversationHealth", source = "conversationHealth")
    TeamRequest toEntity(TeamRequestDTO teamRequestDTO);

    @Mapping(target = "team", source = "teamId", qualifiedByName = "toTeam")
    @Mapping(target = "workflow", source = "workflowId", qualifiedByName = "toWorkflow")
    @Mapping(target = "assignUser", source = "assignUserId", qualifiedByName = "toUser")
    @Mapping(target = "requestUser", source = "requestUserId", qualifiedByName = "toUser")
    @Mapping(
            target = "currentState",
            source = "currentStateId",
            qualifiedByName = "toWorkflowState")
    @Mapping(
            target = "conversationHealth",
            ignore = true) // ✅ Ignore to avoid detached entity issue
    void updateEntity(TeamRequestDTO dto, @MappingTarget TeamRequest entity);

    @Named("toTeam")
    default Team toTeam(Long teamId) {
        return (teamId == null) ? null : Team.builder().id(teamId).build();
    }

    @Named("toWorkflow")
    default Workflow toWorkflow(Long workflowId) {
        return (workflowId == null) ? null : Workflow.builder().id(workflowId).build();
    }

    @Named("toProject")
    default Project toProject(Long projectId) {
        return (projectId == null) ? null : Project.builder().id(projectId).build();
    }

    @Named("toWorkflowState")
    default WorkflowState toWorkflowState(Long workflowStateId) {
        return (workflowStateId == null)
                ? null
                : WorkflowState.builder().id(workflowStateId).build();
    }

    @Named("toUser")
    default User toUser(Long userId) {
        return (userId == null) ? null : User.builder().id(userId).build();
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
