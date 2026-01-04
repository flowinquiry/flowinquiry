package io.flowinquiry.modules.teams.service.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@AllArgsConstructor
@Getter
@Setter
@Builder
@EqualsAndHashCode(callSuper = false)
public class Period {
    private final LocalDate start;
    private final LocalDate end;
    private final String label;

    public static Period today() {
        LocalDate today = LocalDate.now();
        return new Period(today, today, null);
    }
}
