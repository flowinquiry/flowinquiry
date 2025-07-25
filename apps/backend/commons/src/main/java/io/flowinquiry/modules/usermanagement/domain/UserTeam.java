package io.flowinquiry.modules.usermanagement.domain;

import io.flowinquiry.modules.teams.domain.Team;
import io.flowinquiry.modules.teams.domain.TeamRole;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Table(name = "fw_user_team")
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserTeam {
    @EqualsAndHashCode.Include @EmbeddedId private UserTeamId id;

    @ManyToOne
    @MapsId("userId")
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @MapsId("teamId")
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne
    @JoinColumn(
            name = "role_name",
            referencedColumnName = "name",
            nullable = false,
            insertable = false,
            updatable = false)
    private TeamRole role;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;
}
