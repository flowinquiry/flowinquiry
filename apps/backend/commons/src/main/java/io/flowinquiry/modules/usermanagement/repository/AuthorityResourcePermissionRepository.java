package io.flowinquiry.modules.usermanagement.repository;

import io.flowinquiry.modules.usermanagement.domain.AuthorityResourcePermission;
import io.flowinquiry.modules.usermanagement.domain.AuthorityResourcePermissionId;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuthorityResourcePermissionRepository
        extends JpaRepository<AuthorityResourcePermission, AuthorityResourcePermissionId> {

    @Query(
            "SELECT new io.flowinquiry.modules.usermanagement.domain.AuthorityResourcePermission( "
                    + "    :authorityName, "
                    + "    r.name, "
                    + "    COALESCE(CAST(arp.permission AS integer), 0), arp.tenantId "
                    + ") "
                    + "FROM Resource r "
                    + "LEFT JOIN AuthorityResourcePermission arp "
                    + "ON r.name = arp.resourceName "
                    + "AND arp.authorityName = :authorityName")
    List<AuthorityResourcePermission> findAllByAuthorityName(
            @Param("authorityName") String authorityName);
}
