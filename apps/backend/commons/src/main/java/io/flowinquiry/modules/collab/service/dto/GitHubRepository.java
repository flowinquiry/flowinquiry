package io.flowinquiry.modules.collab.service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GitHubRepository {

    private Long id;
    private String name;

    @JsonProperty("full_name")
    private String fullName;
}
