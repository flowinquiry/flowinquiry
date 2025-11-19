package io.flowinquiry.modules.teams.service.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class TicketAgeingBucketDTO {
    private String bucketLabel;
    private List<TicketGroupDTO> groupedTickets;
}
