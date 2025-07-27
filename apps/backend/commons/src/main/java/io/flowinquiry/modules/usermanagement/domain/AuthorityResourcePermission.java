package io.flowinquiry.modules.usermanagement.domain;

import io.flowinquiry.tenant.domain.TenantScopedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Table(name = "fw_authority_resource_permission")
@IdClass(AuthorityResourcePermissionId.class) // Composite key class
public class AuthorityResourcePermission extends TenantScopedEntity {
    @EqualsAndHashCode.Include
    @Id
    @Column(name = "authority_name")
    private String authorityName;

    @EqualsAndHashCode.Include
    @Id
    @Column(name = "resource_name")
    private String resourceName;

    @Convert(converter = PermissionConverter.class)
    @Column(name = "permission", nullable = false)
    private Permission permission;

    @ManyToOne
    @JoinColumn(name = "authority_name", insertable = false, updatable = false)
    private Authority authority;

    @ManyToOne
    @JoinColumn(name = "resource_name", insertable = false, updatable = false)
    private Resource resource;

    public AuthorityResourcePermission(
            String authorityName, String resourceName, int permissionCode, UUID tenantId) {
        this.authorityName = authorityName;
        this.resourceName = resourceName;
        this.permission = Permission.fromCode(permissionCode);
        setTenantId(tenantId);
    }
}
