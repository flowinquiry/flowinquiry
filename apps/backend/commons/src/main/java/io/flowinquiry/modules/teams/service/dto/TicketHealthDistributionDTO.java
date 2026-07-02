package io.flowinquiry.modules.teams.service.dto;

import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketHealthDistributionDTO {
    private Map<String, Long> distribution;
    private long totalTickets;
    private String dominantHealthLevel;
    private long criticalCount;
}
