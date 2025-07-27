package io.flowinquiry.tenant.repository;

import io.flowinquiry.tenant.domain.Tenant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantRepository extends JpaRepository<Tenant, UUID> {

    Optional<Tenant> findBySlug(String slug);

    Optional<Tenant> findByDomain(String domain);

    boolean existsBySlug(String slug);

    boolean existsByDomain(String domain);
}
