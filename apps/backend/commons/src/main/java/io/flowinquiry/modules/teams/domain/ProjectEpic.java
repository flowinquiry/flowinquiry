package io.flowinquiry.modules.teams.domain;

import io.flowinquiry.tenant.domain.TenantScopedAuditingEntity;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Formula;

@Entity
@Table(name = "fw_project_epic")
@Getter
@Setter
@NoArgsConstructor
public class ProjectEpic extends TenantScopedAuditingEntity<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "project_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_epic_project"))
    private Project project;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 50)
    private String status = "ACTIVE"; // Possible values: ACTIVE, COMPLETED

    @Column private Integer priority; // Optional priority field

    @Column private Instant startDate;

    @Column private Instant endDate;

    @Formula("(SELECT COUNT(r.id) FROM fw_ticket r WHERE r.epic_id = id)")
    private Long totalTickets;
}
