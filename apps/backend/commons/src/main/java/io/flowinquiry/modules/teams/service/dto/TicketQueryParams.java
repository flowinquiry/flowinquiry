package io.flowinquiry.modules.teams.service.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

@Valid @Data
public class TicketQueryParams {
    @NotNull private String projectId;
    private String iterationId;
    private List<String> status;
    private List<String> priority;
    private List<String> assignUserId;

    @DateTimeFormat(pattern = "yyyy-MM-dd")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate createdFrom;

    @DateTimeFormat(pattern = "yyyy-MM-dd")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate createdTo;

    private String groupBy = "assignee";
    private boolean includeClosed = false;
    private int limit = 50;
    private int offSet = 0;
}
