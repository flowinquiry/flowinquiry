package io.flowinquiry.modules.teams.service.dto;

import java.util.List;
import java.util.Map;
import lombok.Data;

@Data
public class TicketAgingReportDTO {
    private Map<String, List<TicketAgingDTO>> groupedTickets;
    private Double averageAge;
    private Long maxAge;
    private Long minAge;
    private Integer totalTickets;
}
