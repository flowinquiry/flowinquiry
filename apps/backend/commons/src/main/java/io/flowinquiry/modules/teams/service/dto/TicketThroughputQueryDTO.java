package io.flowinquiry.modules.teams.service.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
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

    private List<String> labels;

    private List<String> priorities;
}
