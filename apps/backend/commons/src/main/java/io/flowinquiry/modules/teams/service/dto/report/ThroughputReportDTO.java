package io.flowinquiry.modules.teams.service.dto.report;

import java.time.LocalDate;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThroughputReportDTO {
    private LocalDate fromDate;
    private LocalDate toDate;
    private Granularity granularity;
    private GroupBy groupBy;
    private Map<Period, ThroughputDTO> data;
}
