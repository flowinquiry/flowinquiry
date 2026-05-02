package io.flowinquiry.modules.collab.service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Date;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GitHubCommitPushDTO extends GithubPayloadBase {
    private String ref;
    private Pusher pusher;
    private Commit[] commits;
}

@Data
class Commit {
    private String id;
    private String message;
    private String url;

    @JsonProperty("timestamp")
    private Date timeStamp;

    private Author author;
}

@Data
class Author {
    private String name;
    private String email;

    @JsonProperty("username")
    private String userName;
}

@Data
class Pusher {
    private String name;
    private String email;
}
