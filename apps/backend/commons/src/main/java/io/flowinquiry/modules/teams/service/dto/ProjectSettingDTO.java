package io.flowinquiry.modules.teams.service.dto;

import io.flowinquiry.modules.teams.domain.EstimationUnit;
import java.time.Instant;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ProjectSettingDTO {

    private Long id;

    private Long projectId;

    private Integer sprintLengthDays;

    private Integer defaultPriority;

    private EstimationUnit estimationUnit;

    private boolean enableEstimation;

    private Map<String, Object> integrationSettings;

    private Long createdBy;

    private Instant createdAt;

    private Long modifiedBy;

    private Instant modifiedAt;
}
