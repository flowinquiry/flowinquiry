package io.flowinquiry.modules.teams.domain;

import io.flowinquiry.modules.audit.AbstractAuditingEntity;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "fw_project")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Project extends AbstractAuditingEntity<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "team_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_project_team"))
    private Team team;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private ProjectStatus status = ProjectStatus.Active;

    @Column(name = "start_date")
    private Instant startDate;

    @Column(name = "end_date")
    private Instant endDate;
}
