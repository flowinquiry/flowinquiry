package io.flowinquiry.modules.teams.domain;

import io.flowinquiry.tenant.domain.TenantScopedAuditingEntity;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.Type;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "fw_project_setting")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectSetting extends TenantScopedAuditingEntity<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "project_id",
            nullable = false,
            unique = true,
            foreignKey = @ForeignKey(name = "fk_project_setting_project"))
    private Project project;

    @Column(name = "sprint_length_days", nullable = false)
    private Integer sprintLengthDays;

    @Column(name = "default_priority", nullable = false)
    @Convert(converter = TicketPriorityConverter.class)
    private TicketPriority defaultPriority;

    @Column(name = "estimation_unit")
    @Enumerated(EnumType.STRING)
    private EstimationUnit estimationUnit;

    @Column(name = "enable_estimation", nullable = false)
    private boolean enableEstimation = true;

    @Column(name = "integration_settings", columnDefinition = "jsonb")
    @Type(JsonBinaryType.class)
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> integrationSettings;
}
