package io.flowinquiry.modules.teams.service.dto;

import java.time.LocalDate;
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
public class BurndownDayDTO {
    private LocalDate date;
    private Double remainingValue;
    private Double idealValue;
    private Double completedValue;
}
