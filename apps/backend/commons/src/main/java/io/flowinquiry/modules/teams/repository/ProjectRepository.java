package io.flowinquiry.modules.teams.repository;

import io.flowinquiry.modules.teams.domain.Project;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectRepository
        extends JpaRepository<Project, Long>, JpaSpecificationExecutor<Project> {

    @EntityGraph(attributePaths = {"projectSetting"})
    Optional<Project> findByShortName(String shortName);

    @Query(
            """
    SELECT p
    FROM Project p
    WHERE p.team IN (
        SELECT t FROM User u JOIN u.teams t
        WHERE u.id = :userId
    )
""")
    Page<Project> findAllByUserId(@Param("userId") Long userId, Pageable pageable);
}
