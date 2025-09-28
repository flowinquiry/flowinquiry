package io.flowinquiry.modules.teams.service.mapper;

import io.flowinquiry.modules.teams.domain.ProjectIteration;
import io.flowinquiry.modules.teams.service.dto.ProjectIterationDTO;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface ProjectIterationMapper {

    @Mapping(source = "project.id", target = "projectId")
    ProjectIterationDTO toDto(ProjectIteration entity);

    @Mapping(source = "projectId", target = "project.id")
    ProjectIteration toEntity(ProjectIterationDTO dto);

    @Mapping(source = "projectId", target = "project.id")
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromDto(ProjectIterationDTO dto, @MappingTarget ProjectIteration entity);
}
