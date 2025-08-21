package io.flowinquiry.modules.teams.domain;

import io.flowinquiry.tenant.domain.TenantScopedAuditingEntity;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Formula;

@Entity
@Table(name = "fw_project_iteration")
@Getter
@Setter
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
    private String status = "ACTIVE"; // Possible values: ACTIVE, COMPLETED

    @Column(nullable = false)
    private Instant startDate;

    @Column(nullable = false)
    private Instant endDate;

    @Formula("(SELECT COUNT(r.id) FROM fw_ticket r WHERE r.iteration_id = id)")
    private Long totalTickets;

    @Formula("(SELECT SUM(r.estimate) FROM fw_ticket r WHERE r.iteration_id = id)")
    private Long totalStoryPoints;
}
