package io.flowinquiry.modules.teams.service.dto;

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
    private String name;
    private String description;
    private Instant startDate;
    private Instant endDate;
    private Long totalTickets;
    private Long totalStoryPoints;
}
