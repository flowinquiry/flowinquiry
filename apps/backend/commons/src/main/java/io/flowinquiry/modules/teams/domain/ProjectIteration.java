package io.flowinquiry.modules.teams.domain;

import io.flowinquiry.tenant.domain.TenantScopedAuditingEntity;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Formula;

@Entity
@Table(name = "fw_project_iteration")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class ProjectIteration extends TenantScopedAuditingEntity<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "project_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_iteration_project"))
    private Project project;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private ProjectIterationStatus status =
            ProjectIterationStatus.ACTIVE; // Possible values: ACTIVE, CLOSED

    @Column(nullable = false)
    private Instant startDate;

    @Column(nullable = false)
    private Instant endDate;

    @Formula("(SELECT COUNT(r.id) FROM fw_ticket r WHERE r.iteration_id = id)")
    private Long totalTickets;

    @Formula(
            "(SELECT COALESCE(SUM(r.estimate),0) FROM fw_ticket r WHERE r.iteration_id = id and r.is_deleted = FALSE)")
    private Long totalStoryPoints;
}
