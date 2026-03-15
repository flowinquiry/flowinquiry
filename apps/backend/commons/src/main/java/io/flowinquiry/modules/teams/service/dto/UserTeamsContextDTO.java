package io.flowinquiry.modules.teams.service.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Context DTO returned to the frontend so it can decide which teams a user may create a project in.
 *
 * <p>If {@code isAdmin} is {@code true} the user has ROLE_ADMIN and is allowed to create a project
 * in ANY team regardless of membership / role.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserTeamsContextDTO {
    private Long userId;
    private boolean isAdmin;
    private List<UserTeamDTO> teams;
}
