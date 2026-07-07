package io.flowinquiry.modules.teams.service.dto;

import io.flowinquiry.modules.teams.domain.BurndownProjectedStatus;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BurndownReportDTO {
    private List<BurndownDayDTO> days;
    private Double plannedWork;
    private Double completedWork;
    private Double remainingWork;
    private BurndownProjectedStatus projectedStatus;
}
