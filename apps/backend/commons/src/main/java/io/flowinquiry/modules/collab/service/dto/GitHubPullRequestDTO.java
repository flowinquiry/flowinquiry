package io.flowinquiry.modules.collab.service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GitHubPullRequestDTO extends GithubPayloadBase {
    private String action;
    private GitHubPullRequest gitHubPullRequest;
}

class GitHubPullRequest {

    private Long id;
    private Integer number;
    private String title;
    private String state;
    private Boolean merged;

    @JsonProperty("html_url")
    private String htmlUrl;
}
