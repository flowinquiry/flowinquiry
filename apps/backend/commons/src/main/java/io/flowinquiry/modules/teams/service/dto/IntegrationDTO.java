package io.flowinquiry.modules.teams.service.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(Include.NON_NULL)
public class IntegrationDTO {
    private Long id;
    private Long projectId;
    private String integrationType;
    private boolean enabled;
    private String webhookSecret;
    private String integrationEndpoint;
    private String repoName;
    private Map<String, Object> config;
}
