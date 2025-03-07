package io.flowinquiry.modules.teams.service.mapper;

import io.flowinquiry.modules.teams.domain.Project;
import io.flowinquiry.modules.teams.service.dto.ProjectDTO;
import io.flowinquiry.modules.usermanagement.domain.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProjectMapper {

    @Mapping(source = "team.id", target = "teamId")
    ProjectDTO toDto(Project project);

    @Mapping(source = "teamId", target = "team.id")
    @Mapping(target = "createdByUser", expression = "java(ofUser(projectDTO.getCreatedBy()))")
    Project toEntity(ProjectDTO projectDTO);

    default User ofUser(Long userId) {
        return (userId == null) ? null : User.builder().id(userId).build();
    }
}
