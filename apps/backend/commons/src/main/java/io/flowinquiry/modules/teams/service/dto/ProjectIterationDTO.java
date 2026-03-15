package io.flowinquiry.modules.teams.service.dto;

import io.flowinquiry.modules.teams.domain.ProjectIterationStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ProjectIterationDTO {
    private Long id;
    private Long projectId;

    @NotBlank(message = "Iteration name is required") private String name;

    private String description;
    private ProjectIterationStatus status;

    @NotNull(message = "Start date is required") private Instant startDate;

    @NotNull(message = "End date is required") private Instant endDate;

    private Long totalTickets;
    private Long totalStoryPoints;
}
