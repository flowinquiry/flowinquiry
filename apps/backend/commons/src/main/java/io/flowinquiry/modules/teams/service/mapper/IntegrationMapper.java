package io.flowinquiry.modules.teams.service.mapper;

import io.flowinquiry.modules.teams.domain.Integration;
import io.flowinquiry.modules.teams.service.dto.IntegrationDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface IntegrationMapper {
    @Mapping(target = "projectId", source = "project.id")
    @Mapping(target = "webhookSecret", ignore = true) // never expose secrets in responses
    IntegrationDTO toDto(Integration entity);

    @Mapping(target = "project", ignore = true)
    Integration toEntity(IntegrationDTO dto);
}
