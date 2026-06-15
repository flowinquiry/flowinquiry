package io.flowinquiry.modules.teams.service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class TicketThroughputBucketDTO {
    private String period;
    private String group;
    private Long count;

    public TicketThroughputBucketDTO(String period, Long count) {
        this.period = period;
        this.count = count;
        this.group = "All";
    }

    public TicketThroughputBucketDTO(String period, String group, Long count) {
        this.period = period;
        this.group = group;
        this.count = count;
    }
}
