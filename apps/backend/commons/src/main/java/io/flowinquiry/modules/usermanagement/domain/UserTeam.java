package io.flowinquiry.modules.usermanagement.domain;

import io.flowinquiry.modules.teams.domain.Team;
import io.flowinquiry.modules.teams.domain.TeamRole;
import io.flowinquiry.tenant.domain.TenantScopedEntity;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Table(name = "fw_user_team")
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class UserTeam extends TenantScopedEntity {
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
}
