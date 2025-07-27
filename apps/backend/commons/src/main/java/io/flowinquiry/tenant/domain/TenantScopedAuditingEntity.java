package io.flowinquiry.tenant.domain;

import io.flowinquiry.modules.audit.domain.AbstractAuditingEntity;
import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

@Getter
@Setter
@MappedSuperclass
@FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "tenantId", type = UUID.class))
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
@SuperBuilder
@NoArgsConstructor
public abstract class TenantScopedAuditingEntity<T> extends AbstractAuditingEntity<T> {

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;
}
