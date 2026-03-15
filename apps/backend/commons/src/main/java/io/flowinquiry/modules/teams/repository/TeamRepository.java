package io.flowinquiry.modules.teams.repository;

import io.flowinquiry.modules.teams.domain.Team;
import io.flowinquiry.modules.teams.service.dto.UserTeamDTO;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.service.dto.UserWithTeamRoleDTO;
import jakarta.persistence.QueryHint;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long>, JpaSpecificationExecutor<Team> {

    @EntityGraph(attributePaths = {"organization"})
    @QueryHints({
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "org.hibernate.cacheRegion", value = "queryWorkflows")
    })
    Page<Team> findAll(Specification<Team> spec, Pageable pageable);

    @QueryHints({
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "org.hibernate.cacheRegion", value = "queryWorkflows")
    })
    @Query("SELECT t FROM Team t JOIN t.users u WHERE u.id = :userId")
    List<Team> findTeamsByUserId(@Param("userId") Long userId);

    @Query(
            """
        SELECT u
        FROM User u
        WHERE (LOWER(u.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
           OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
           OR LOWER(u.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')))
          AND u.id NOT IN (
              SELECT ut.id
              FROM Team t
              JOIN t.users ut
              WHERE t.id = :teamId
          )
    """)
    List<User> findUsersNotInTeam(
            @Param("searchTerm") String searchTerm,
            @Param("teamId") Long teamId,
            Pageable pageable);

    @Query(
            "SELECT new io.flowinquiry.modules.usermanagement.service.dto.UserWithTeamRoleDTO(u.id, u.email, u.firstName, u.lastName, u.timezone, u.imageUrl, u.title, ut.team.id, ut.role.name) "
                    + "FROM User u JOIN u.userTeams ut WHERE ut.team.id = :teamId")
    List<UserWithTeamRoleDTO> findUsersByTeamId(@Param("teamId") Long teamId);

    /**
     * Return the team role of user, return default value is 'guest'
     *
     * @param userId
     * @param teamId
     * @return
     */
    @QueryHints({
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "org.hibernate.cacheRegion", value = "queryWorkflows")
    })
    @Query(
            """
           SELECT COALESCE(ut.role.name, 'guest')
           FROM UserTeam ut
           WHERE ut.user.id = :userId
             AND ut.team.id = :teamId
           """)
    String findUserRoleInTeam(@Param("userId") Long userId, @Param("teamId") Long teamId);

    @QueryHints({
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "org.hibernate.cacheRegion", value = "queryWorkflows")
    })
    @Query(
            "SELECT COUNT(ut) > 0 FROM UserTeam ut WHERE ut.team.id = :teamId AND ut.role.name = 'manager'")
    boolean existsManagerInTeam(@Param("teamId") Long teamId);

    /**
     * Finds all users who have the 'Manager' role in a given team.
     *
     * @param teamId the ID of the team.
     * @return a list of users who are managers of the given team.
     */
    @QueryHints({
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "org.hibernate.cacheRegion", value = "queryWorkflows")
    })
    @Query(
            """
        SELECT ut.user FROM UserTeam ut
        WHERE ut.team.id = :teamId AND ut.role.name = 'manager'
    """)
    List<User> findManagersByTeamId(@Param("teamId") Long teamId);

    /**
     * Fetches every team a user belongs to together with the user's role in that team in a single
     * query — avoids the N+1 problem.
     */
    @Query(
            """
        SELECT new io.flowinquiry.modules.teams.service.dto.UserTeamDTO(
            ut.team.id, ut.team.name, ut.role.name)
        FROM UserTeam ut
        WHERE ut.user.id = :userId
        ORDER BY ut.team.name ASC
    """)
    List<UserTeamDTO> findTeamsWithRoleByUserId(@Param("userId") Long userId);
}
