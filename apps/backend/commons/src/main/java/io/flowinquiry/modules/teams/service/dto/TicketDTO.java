package io.flowinquiry.modules.teams.service.dto;

import io.flowinquiry.modules.teams.domain.TShirtSize;
import io.flowinquiry.modules.teams.domain.TicketChannel;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class TicketDTO {
    private Long id;

    @NotNull(message = "Team ID cannot be null") private Long teamId;

    private String teamName;

    @NotNull(message = "Workflow ID cannot be null") private Long workflowId;

    private String workflowName;
    private String workflowRequestName;

    private Long projectId;
    private String projectName;
    private String projectShortName;

    private Long projectTicketNumber;

    @NotNull(message = "Request User ID cannot be null") private Long requestUserId;

    private String requestUserName;
    private String requestUserImageUrl;
    private Long assignUserId;
    private String assignUserName;
    private String assignUserImageUrl;
    private String requestTitle;
    private String requestDescription;

    @NotNull(message = "Priority cannot be null") private String priority;

    private LocalDate estimatedCompletionDate;
    private LocalDate actualCompletionDate;

    @NotNull(message = "Current State ID cannot be null") private Long currentStateId;

    private Long iterationId;
    private String iterationName;

    private Long epicId;
    private String epicName;

    private String currentStateName;
    private TicketChannel channel;

    private Boolean isNew;

    private Boolean isCompleted;

    private Instant createdAt;
    private Instant modifiedAt;
    private int numberAttachments;
    private int numberWatchers;
    private TShirtSize size;
    private int estimate;
    private TicketConversationHealthDTO conversationHealth;

    private Long parentTicketId;
    private List<Long> childTicketIds;
}
