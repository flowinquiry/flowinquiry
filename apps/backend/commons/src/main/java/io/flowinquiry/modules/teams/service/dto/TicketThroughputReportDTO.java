package io.flowinquiry.modules.teams.service.dto;

import java.util.List;
import lombok.Data;

@Data
public class TicketThroughputReportDTO {
    private long totalTicketsCompleted;
    private double averageWeeklyThroughput;
    private long peakWeekThroughput;
    private long currentIterationThroughput;
    private List<TicketThroughputBucketDTO> trend;
    private List<TicketThroughputBucketDTO> table;
    private long totalTableRows;
}
