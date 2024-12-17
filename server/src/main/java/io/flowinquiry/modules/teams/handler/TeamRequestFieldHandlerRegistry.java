package io.flowinquiry.modules.teams.handler;

import io.flowinquiry.modules.audit.AbstractEntityFieldHandlerRegistry;
import io.flowinquiry.modules.audit.EntityFieldHandler;
import io.flowinquiry.modules.collab.domain.EntityType;
import io.flowinquiry.modules.teams.domain.TicketChannel;
import io.flowinquiry.modules.teams.repository.WorkflowStateRepository;
import io.flowinquiry.modules.teams.service.dto.TeamRequestDTO;
import io.flowinquiry.modules.usermanagement.repository.UserRepository;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class TeamRequestFieldHandlerRegistry extends AbstractEntityFieldHandlerRegistry {

    private final UserRepository userRepository;

    private final WorkflowStateRepository workflowStateRepository;

    public TeamRequestFieldHandlerRegistry(
            UserRepository userRepository, WorkflowStateRepository workflowStateRepository) {
        this.userRepository = userRepository;
        this.workflowStateRepository = workflowStateRepository;
    }

    @Override
    protected void initializeFieldHandlers() {
        addFieldHandler("requestTitle", new EntityFieldHandler<TeamRequestDTO>("Title"));
        addFieldHandler(
                "requestDescription", new EntityFieldHandler<TeamRequestDTO>("Description"));
        addFieldHandler("priority", new EntityFieldHandler<TeamRequestDTO>("Priority"));
        addFieldHandler(
                "channel",
                new EntityFieldHandler<TeamRequestDTO>(
                        "Channel",
                        (objectVal, channel) ->
                                Optional.ofNullable((TicketChannel) channel)
                                        .map(TicketChannel::getDisplayName)
                                        .orElse("")));
        addFieldHandler(
                "estimatedCompletionDate",
                new EntityFieldHandler<TeamRequestDTO>("Target Completion Date"));
        addFieldHandler(
                "actualCompletionDate",
                new EntityFieldHandler<TeamRequestDTO>("Actual Completion Date"));
        addFieldHandler(
                "currentStateId",
                new EntityFieldHandler<TeamRequestDTO>(
                        "State",
                        (objectVal, fieldVal) ->
                                Optional.ofNullable(fieldVal)
                                        .flatMap(
                                                id ->
                                                        workflowStateRepository
                                                                .findById((Long) id)
                                                                .map(state -> state.getStateName()))
                                        .orElse("")));
        addFieldHandler(
                "assignUserId",
                new EntityFieldHandler<>(
                        "Assigned User",
                        (objectVal, fieldVal) ->
                                Optional.ofNullable(fieldVal)
                                        .flatMap(id -> userRepository.findById((Long) id))
                                        .map(user -> user.getFirstName() + " " + user.getLastName())
                                        .orElse("")));
    }

    @Override
    public Class<?> getEntityClass() {
        return TeamRequestDTO.class;
    }

    @Override
    public EntityType getEntityType() {
        return EntityType.Team_Request;
    }
}
