package io.flowinquiry.modules.teams.service.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.flowinquiry.modules.teams.domain.TicketPriority;
import java.time.Instant;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TicketAgingDTO {
    private Long ticketId;
    private String ticketKey;
    private String title;
    private TicketPriority priority;
    private String status;
    private String assignee;
    private Long ageInDays;
    private Instant createdDate;

    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    private Instant completionDate;
}
