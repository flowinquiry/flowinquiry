package io.flowinquiry.modules.teams.service.dto.report;

import io.flowinquiry.modules.teams.domain.Ticket;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThroughputDTO {
    private Map<String, List<Ticket>> groupedTickets;
    private int throughput;

    public void incrementThroughput() {
        this.throughput++;
    }
}
