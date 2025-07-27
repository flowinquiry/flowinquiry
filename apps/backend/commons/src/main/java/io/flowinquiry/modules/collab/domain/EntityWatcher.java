package io.flowinquiry.modules.collab.domain;

import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.tenant.domain.TenantScopedEntity;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Table(
        name = "fw_entity_watchers",
        indexes =
                @Index(name = "idx_entity_watchers_entity", columnList = "entity_type, entity_id"))
public class EntityWatcher extends TenantScopedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 50)
    private EntityType entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "watch_user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_entity_watchers_user_id"))
    private User watchUser;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "created_by", nullable = false, updatable = false)
    private Long createdBy;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }
}
