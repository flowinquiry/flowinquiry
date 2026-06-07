package io.flowinquiry.modules.teams.service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketThroughputTableRowDTO {
    private String period;
    private String group;
    private Long count;
}
