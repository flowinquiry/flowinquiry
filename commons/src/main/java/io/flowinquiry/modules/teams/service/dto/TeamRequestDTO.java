package io.flowinquiry.modules.teams.service.dto;

import io.flowinquiry.modules.teams.domain.TicketChannel;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class TeamRequestDTO {
    private Long id;
    private Long teamId;
    private String teamName;
    private Long workflowId;
    private String workflowName;
    private String workflowRequestName;
    private Long requestUserId;
    private String requestUserName;
    private String requestUserImageUrl;
    private Long assignUserId;
    private String assignUserName;
    private String assignUserImageUrl;
    private String requestTitle;
    private String requestDescription;
    private String priority;
    private LocalDate estimatedCompletionDate;
    private LocalDate actualCompletionDate;
    private Long currentStateId;
    private String currentStateName;
    private TicketChannel channel;
    private Boolean isNew;
    private Boolean isCompleted;
    private Instant createdAt;
    private Instant modifiedAt;
    private Set<WatcherDTO> watchers;
}
