package io.flowinquiry.modules.teams.service.mapper;

import io.flowinquiry.modules.teams.domain.WorkflowState;
import io.flowinquiry.modules.teams.service.dto.WorkflowStateDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface WorkflowStateMapper {

    @Mapping(source = "workflow.id", target = "workflowId")
    WorkflowStateDTO toDto(WorkflowState workflowState);

    @Mapping(source = "workflowId", target = "workflow.id")
    WorkflowState toEntity(WorkflowStateDTO workflowStateDTO);

    void updateEntity(
            WorkflowStateDTO workflowStateDTO, @MappingTarget WorkflowState workflowState);
}
