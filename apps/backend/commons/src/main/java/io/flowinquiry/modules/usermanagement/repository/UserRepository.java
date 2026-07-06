package io.flowinquiry.modules.usermanagement.repository;

import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.service.dto.UserHierarchyDTO;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/** Spring Data JPA repository for the {@link User} entity. */
@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    Optional<User> findOneByActivationKey(String activationKey);

    Optional<User> findOneByResetKey(String resetKey);

    Optional<User> findOneByEmailIgnoreCase(String email);

    Optional<User> findOneById(Long id);

    @EntityGraph(attributePaths = "authorities")
    Optional<User> findOneWithAuthoritiesByEmailIgnoreCase(String email);

    @EntityGraph(attributePaths = {"authorities", "userAuths"})
    Optional<User> findOneWithAuthoritiesAndUserAuthsByEmailIgnoreCase(String email);

    @EntityGraph(attributePaths = {"manager"})
    Optional<User> findOneWithManagerById(Long id);

    /**
     * Find users where the search term matches any part of firstName, lastName, or email
     *
     * @param userTerm The search term to match against user fields
     * @param pageable The pagination information
     * @return Page of users matching the search criteria
     */
    @Query(
            "SELECT u FROM User u WHERE "
                    + "(LOWER(u.firstName) LIKE LOWER(CONCAT('%', :userTerm, '%')) OR "
                    + "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :userTerm, '%')) OR "
                    + "LOWER(u.email) LIKE LOWER(CONCAT('%', :userTerm, '%'))) "
                    + "AND u.status = 'ACTIVE'")
    Page<User> findByUserTerm(@Param("userTerm") String userTerm, Pageable pageable);

    /**
     * Finds all direct reports of a specific user by their manager ID.
     *
     * @param managerId the ID of the manager.
     * @return a list of direct reports.
     */
    List<User> findByManagerId(Long managerId);

    Optional<User> findUserByEmailEqualsIgnoreCase(String email);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.lastLoginTime = :lastLoginTime WHERE u.email = :userEmail")
    void updateLastLoginTime(
            @Param("userEmail") String userEmail, @Param("lastLoginTime") Instant lastLoginTime);

    @Query(
            value =
                    """
            SELECT
                r.name AS resourceName,
                CASE
                    -- Check if the user has the ROLE_ADMIN authority globally
                    WHEN EXISTS (
                        SELECT 1
                        FROM fw_user_authority uaAdmin
                        WHERE uaAdmin.user_id = :userId
                        AND uaAdmin.authority_name = 'ROLE_ADMIN'
                    ) THEN 3
                    ELSE
                        -- Calculate the highest permission level for the user and resource
                        COALESCE(MAX(rp.permission), 0) -- Default to 0 (NONE) if no permissions are found
                END AS permission
            FROM fw_resource r
            LEFT JOIN fw_authority_resource_permission rp
                ON rp.resource_name = r.name
            LEFT JOIN fw_user_authority ua
                ON rp.authority_name = ua.authority_name
                AND ua.user_id = :userId
            -- Only include rows where permissions exist
            WHERE ua.authority_name IS NOT NULL OR EXISTS (
                SELECT 1
                FROM fw_user_authority uaAdmin
                WHERE uaAdmin.user_id = :userId
                AND uaAdmin.authority_name = 'ROLE_ADMIN'
            )
            GROUP BY r.name
    """,
            nativeQuery = true)
    List<Object[]> findResourcesWithHighestPermissionsByUserId(@Param("userId") Long userId);

    @Query(
"""
    SELECT new io.flowinquiry.modules.usermanagement.service.dto.UserHierarchyDTO(
        u.id,
        CONCAT(u.firstName, ' ', u.lastName),
        u.imageUrl,
        null,
        null,
        null
    )
    FROM User u
    WHERE u.manager IS NULL
""")
    List<UserHierarchyDTO> findAllTopLevelUsers();

    @Query(
            """
    SELECT new io.flowinquiry.modules.usermanagement.service.dto.UserHierarchyDTO(
        u.id,
        CONCAT(u.firstName, ' ', u.lastName),
        u.imageUrl,
        m.id,
        CONCAT(m.firstName, ' ', m.lastName),
        m.imageUrl
    )
    FROM User u
    LEFT JOIN u.manager m
    WHERE u.id = :userId
    """)
    Optional<UserHierarchyDTO> findUserHierarchyById(@Param("userId") Long userId);

    @Query(
            """
    SELECT new io.flowinquiry.modules.usermanagement.service.dto.UserHierarchyDTO(
        u.id,
        CONCAT(u.firstName, ' ', u.lastName),
        u.imageUrl,
        m.id,
        CONCAT(m.firstName, ' ', m.lastName),
        m.imageUrl
    )
    FROM User u
    LEFT JOIN u.manager m
    WHERE m.id = :userId
    """)
    List<UserHierarchyDTO> findAllSubordinates(@Param("userId") Long userId);
}
