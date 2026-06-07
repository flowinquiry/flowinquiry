package io.flowinquiry.modules.teams.service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketThroughputBucketDTO {
    private String period;
    private Long count;
}
