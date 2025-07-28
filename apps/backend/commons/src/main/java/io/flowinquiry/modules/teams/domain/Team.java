package io.flowinquiry.modules.teams.domain;

import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.tenant.domain.TenantScopedAuditingEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;
import java.util.HashSet;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.hibernate.annotations.Formula;

@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Table(name = "fw_team")
@EqualsAndHashCode(callSuper = false)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Team extends TenantScopedAuditingEntity<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Size(max = 255) @Column(name = "name")
    private String name;

    @Size(max = 500) @Column(name = "logo_url")
    private String logoUrl;

    @Size(max = 255) @Column(name = "slogan")
    private String slogan;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @ManyToOne
    @EqualsAndHashCode.Exclude
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @EqualsAndHashCode.Exclude
    @ManyToMany
    @JoinTable(
            name = "fw_user_team",
            joinColumns = @JoinColumn(name = "team_id", referencedColumnName = "id"),
            inverseJoinColumns = @JoinColumn(name = "user_id", referencedColumnName = "id"))
    private Set<User> users;

    @Formula("(SELECT COUNT(ut.user_id) FROM fw_user_team ut WHERE ut.team_id = id)")
    private Long usersCount;

    @EqualsAndHashCode.Exclude
    @Builder.Default
    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Workflow> workflows = new HashSet<>();

    @EqualsAndHashCode.Exclude
    @Builder.Default
    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<TeamWorkflowSelection> workflowUsages = new HashSet<>();
}
