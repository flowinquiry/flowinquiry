package io.flowinquiry.modules.collab.service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GithubIssueDTO extends GithubPayloadBase {
    private String action;
    private GitHubIssue issue;
}

@Data
class GitHubIssue {
    private Long id;
    private Integer number;
    private String title;
    private String state;
    private String url;
}
