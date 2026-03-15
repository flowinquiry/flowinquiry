package io.flowinquiry.modules.teams.service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Lightweight projection of a team + the user's role in that team. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserTeamDTO {
    private Long teamId;
    private String teamName;
    private String roleName;
}
