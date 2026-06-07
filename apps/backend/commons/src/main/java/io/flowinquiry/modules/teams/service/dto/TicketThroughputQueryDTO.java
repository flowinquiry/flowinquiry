package io.flowinquiry.modules.teams.service.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

@Data
public class TicketThroughputQueryDTO {

    @NotNull private Long projectId;

    private Long iterationId;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant from = Instant.now().minus(90, ChronoUnit.DAYS);

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant to = Instant.now();

    private TicketThroughputGranularity granularity = TicketThroughputGranularity.week;

    private TicketThroughputGroupBy groupBy = TicketThroughputGroupBy.none;

    private List<String> status = List.of("RESOLVED", "CLOSED");

    private List<Long> assigneeId;

    private List<String> label;

    private List<String> priority;

    @Min(1)
    @Max(500)
    private int limit = 50;

    @Min(0)
    private int offset = 0;
}
