package io.flowinquiry.modules.collab.service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GithubPayloadBase {
    @JsonProperty("repository")
    private GitHubRepository gitHubRepository;

    private EventSender sender;
}
