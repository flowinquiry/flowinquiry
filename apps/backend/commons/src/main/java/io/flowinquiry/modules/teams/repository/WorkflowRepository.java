package io.flowinquiry.modules.teams.repository;

import io.flowinquiry.modules.teams.domain.Workflow;
import jakarta.persistence.QueryHint;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkflowRepository
        extends JpaRepository<Workflow, Long>, JpaSpecificationExecutor<Workflow> {

    @QueryHints({
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "org.hibernate.cacheRegion", value = "queryWorkflows")
    })
    @Query(
            """
            SELECT w
            FROM Workflow w
            LEFT JOIN TeamWorkflowSelection tws ON w.id = tws.workflow.id AND tws.team.id = :teamId
            WHERE (w.owner.id = :teamId OR (w.visibility = 'PUBLIC' AND tws.id IS NOT NULL))
              AND (:usedForProject IS NULL OR w.useForProject = :usedForProject)
            """)
    List<Workflow> findAllWorkflowsByTeam(
            @Param("teamId") Long teamId, @Param("usedForProject") Boolean usedForProject);

    @QueryHints({
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "org.hibernate.cacheRegion", value = "queryWorkflows")
    })
    @Query("SELECT w FROM Workflow w WHERE w.visibility = 'PUBLIC' AND w.useForProject = true")
    List<Workflow> findPublicWorkflowsUsedForProjects();

    @EntityGraph(attributePaths = {"states", "transitions", "owner"})
    @QueryHints({
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "org.hibernate.cacheRegion", value = "queryWorkflows")
    })
    @Query(
"""
    SELECT w
    FROM Workflow w
    LEFT JOIN TeamWorkflowSelection tws
      ON w.id = tws.workflow.id AND tws.team.id = :teamId
    WHERE w.useForProject = true
      AND (w.owner.id = :teamId OR tws.id IS NOT NULL)
""")
    Optional<Workflow> findProjectWorkflowByTeam(@Param("teamId") Long teamId);

    @EntityGraph(attributePaths = {"states", "transitions", "owner"})
    @QueryHints({
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "org.hibernate.cacheRegion", value = "queryWorkflows")
    })
    @Query("SELECT w FROM Workflow w WHERE w.id = :workflowId")
    Optional<Workflow> findWithDetailsById(@Param("workflowId") Long workflowId);

    @QueryHints({
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "org.hibernate.cacheRegion", value = "queryWorkflows")
    })
    @Query(
            """
        SELECT w
        FROM Workflow w
        WHERE w.visibility = 'PUBLIC'
            AND w.useForProject = false
        AND w.id NOT IN (
            SELECT tws.workflow.id
            FROM TeamWorkflowSelection tws
            WHERE tws.team.id = :teamId
        )
    """)
    List<Workflow> findGlobalWorkflowsNotLinkedToTeam(@Param("teamId") Long teamId);
}
