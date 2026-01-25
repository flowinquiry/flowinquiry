package io.flowinquiry.modules.teams.domain;

import io.flowinquiry.tenant.domain.TenantScopedAuditingEntity;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import java.util.HashMap;
import java.util.Map;
import lombok.*;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.Type;
import org.hibernate.type.SqlTypes;

@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Table(name = "fw_project_integration")
@EqualsAndHashCode(callSuper = false)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Integration extends TenantScopedAuditingEntity<Long> {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", foreignKey = @ForeignKey(name = "fk_project_integration"))
    private Project project;

    @Column(name = "integration_type")
    private IntegrationType integrationType;

    private boolean enabled;

    @Column(name = "config", columnDefinition = "jsonb")
    @Type(JsonBinaryType.class)
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> config = new HashMap<>();

    @Column(name = "webhook_secret", nullable = false)
    private String webhookSecret;

    @Column(name = "repo_name", nullable = false)
    private String repoName;
}
