package io.flowinquiry.modules.teams.service.dto;

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
public class BurndownQueryParams {
    private Long projectId;
    private Long iterationId;
    private String measure; // "tickets" or "story_points"
}
