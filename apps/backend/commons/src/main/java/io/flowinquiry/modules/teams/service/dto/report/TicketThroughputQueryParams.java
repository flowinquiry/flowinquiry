package io.flowinquiry.modules.teams.service.dto.report;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

@Data
public class TicketThroughputQueryParams {
  @NotNull
  private Long projectId;
  private Long iterationId;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")
  private LocalDate from;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")
  private LocalDate to;

  private Granularity granularity;

  private GroupBy groupBy;

  private List<String> statuses;

  private List<Long> assigneeIds;

  private List<String> priorities;

  private int limit = 50;
}
