package io.flowinquiry.modules.collab.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Table(name = "fw_app_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AppSetting {
    @Id
    @Column(name = "setting_key", length = 100, nullable = false)
    private String key;

    @Column(name = "setting_value", length = 1000, nullable = false)
    private String value;

    @Column(name = "setting_type", length = 50, nullable = false)
    private String type;

    @Column(name = "setting_group", length = 50)
    private String group;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @PrePersist
    @PreUpdate
    public void preSave() {
        this.updatedAt = Instant.now();
    }
}
