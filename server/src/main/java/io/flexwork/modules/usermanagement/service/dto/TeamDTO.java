package io.flexwork.modules.usermanagement.service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class TeamDTO {

    private Long id;
    private String name;
    private String logoUrl;
    private String slogan;
    private String description;
    private Long organizationId;
    private Long memberCount;
}
