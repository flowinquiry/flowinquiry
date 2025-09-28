package io.flowinquiry.modules.teams.repository;

import io.flowinquiry.modules.teams.domain.Ticket;
import io.flowinquiry.modules.teams.domain.WorkflowTransitionHistoryStatus;
import io.flowinquiry.modules.teams.service.dto.PriorityDistributionDTO;
import io.flowinquiry.modules.teams.service.dto.TeamTicketPriorityDistributionDTO;
import io.flowinquiry.modules.teams.service.dto.TicketActionCountByDateDTO;
import io.flowinquiry.modules.teams.service.dto.TicketDistributionDTO;
import io.flowinquiry.modules.usermanagement.service.dto.TicketStatisticsDTO;
import jakarta.persistence.QueryHint;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketRepository
        extends JpaRepository<Ticket, Long>, JpaSpecificationExecutor<Ticket> {

    @EntityGraph(attributePaths = {"team", "requestUser", "assignUser", "workflow", "currentState"})
    Page<Ticket> findAll(Specification<Ticket> spec, Pageable pageable);

    @EntityGraph(
            attributePaths = {
                "team",
                "project",
                "requestUser",
                "assignUser",
                "modifiedByUser",
                "workflow",
                "currentState",
                "iteration",
                "epic",
                "conversationHealth"
            })
    Optional<Ticket> findById(@Param("id") Long id);

    @EntityGraph(
            attributePaths = {
                "team",
                "requestUser",
                "assignUser",
                "workflow",
                "conversationHealth"
            })
    @QueryHints({
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "org.hibernate.cacheRegion", value = "queryTickets")
    })
    @Query(
            value =
                    """
                SELECT tr
                FROM Ticket tr
                WHERE tr.team.id = (
                    SELECT r.team.id
                    FROM Ticket r
                    WHERE r.id = :ticketId
                )
                AND tr.id < :ticketId
                AND tr.isDeleted = false
                AND (:projectId IS NOT NULL AND tr.project.id = :projectId OR :projectId IS NULL AND tr.project IS NULL)
                ORDER BY tr.id DESC
                    LIMIT 1
            """)
    Optional<Ticket> findPreviousTicket(
            @Param("ticketId") Long ticketId, @Param("projectId") Long projectId);

    @EntityGraph(
            attributePaths = {
                "team",
                "requestUser",
                "assignUser",
                "workflow",
                "iteration",
                "epic",
                "conversationHealth"
            })
    @QueryHints({
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "org.hibernate.cacheRegion", value = "queryTickets")
    })
    @Query(
            value =
                    """
                SELECT tr
                FROM Ticket tr
                WHERE tr.team.id = (
                    SELECT r.team.id
                    FROM Ticket r
                    WHERE r.id = :ticketId
                )
                AND tr.id > :ticketId
                AND tr.isDeleted = false
                AND (:projectId IS NOT NULL AND tr.project.id = :projectId OR :projectId IS NULL AND tr.project IS NULL)
                ORDER BY tr.id ASC
                LIMIT 1
            """)
    Optional<Ticket> findNextTicket(
            @Param("ticketId") Long ticketId, @Param("projectId") Long projectId);

    // Query to count tickets assigned to each team member for a specific team
    @Query(
            "SELECT new io.flowinquiry.modules.teams.service.dto.TicketDistributionDTO("
                    + "u.id, CONCAT(u.firstName, ' ', u.lastName), COUNT(r.id)) "
                    + "FROM Ticket r "
                    + "LEFT JOIN User u ON r.assignUser.id = u.id "
                    + "WHERE r.team.id = :teamId "
                    + "AND r.isCompleted = false "
                    + "AND r.isDeleted = false "
                    + "AND r.createdAt >= COALESCE(:fromDate, r.createdAt) "
                    + "AND r.createdAt <= COALESCE(:toDate, r.createdAt) "
                    + "GROUP BY u.id, u.firstName, u.lastName")
    List<TicketDistributionDTO> findTicketDistributionByTeamId(
            @Param("teamId") Long teamId,
            @Param("fromDate") Instant fromDate,
            @Param("toDate") Instant toDate);

    @QueryHints({
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "org.hibernate.cacheRegion", value = "queryTickets")
    })
    @Query(
            "SELECT r FROM Ticket r "
                    + "WHERE r.team.id = :teamId AND r.isCompleted = false AND r.isDeleted = false "
                    + "AND r.assignUser IS NULL")
    Page<Ticket> findUnassignedTicketsByTeamId(@Param("teamId") Long teamId, Pageable pageable);

    // Query to count tickets by priority for a specific team
    @Query(
            "SELECT new io.flowinquiry.modules.teams.service.dto.PriorityDistributionDTO("
                    + "r.priority, COUNT(r.id)) "
                    + "FROM Ticket r "
                    + "WHERE r.team.id = :teamId "
                    + "AND r.isCompleted = false "
                    + "AND r.isDeleted = false "
                    + "AND r.createdAt >= COALESCE(:fromDate, r.createdAt) "
                    + "AND r.createdAt <= COALESCE(:toDate, r.createdAt) "
                    + "GROUP BY r.priority")
    List<PriorityDistributionDTO> findTicketPriorityDistributionByTeamId(
            @Param("teamId") Long teamId,
            @Param("fromDate") Instant fromDate,
            @Param("toDate") Instant toDate);

    @Query(
            "SELECT new io.flowinquiry.modules.usermanagement.service.dto.TicketStatisticsDTO("
                    + "COUNT(tr), "
                    + "SUM(CASE WHEN tr.isCompleted = false THEN 1 ELSE 0 END), "
                    + "SUM(CASE WHEN tr.isCompleted = true THEN 1 ELSE 0 END)) "
                    + "FROM Ticket tr "
                    + "WHERE tr.isDeleted = false "
                    + "AND tr.team.id = :teamId "
                    + "AND tr.createdAt >= COALESCE(:fromDate, tr.createdAt) "
                    + "AND tr.createdAt <= COALESCE(:toDate, tr.createdAt)")
    TicketStatisticsDTO getTicketStatisticsByTeamId(
            @Param("teamId") Long teamId,
            @Param("fromDate") Instant fromDate,
            @Param("toDate") Instant toDate);

    @Query(
            "SELECT r "
                    + "FROM Ticket r "
                    + "JOIN WorkflowTransitionHistory h ON h.ticket.id = r.id "
                    + "WHERE r.isDeleted = false "
                    + "AND r.isCompleted = false "
                    + "AND h.status <> :status "
                    + "AND r.team.id = :teamId "
                    + "AND ("
                    + "  (h.slaDueDate IS NOT NULL AND h.slaDueDate < CURRENT_TIMESTAMP) "
                    + "  OR (r.estimatedCompletionDate IS NOT NULL AND r.estimatedCompletionDate < CURRENT_TIMESTAMP)"
                    + ")")
    Page<Ticket> findOverdueTicketsByTeamId(
            @Param("teamId") Long teamId,
            @Param("status") WorkflowTransitionHistoryStatus completedStatus,
            Pageable pageable);

    @Query(
            "SELECT r "
                    + "FROM Ticket r "
                    + "JOIN WorkflowTransitionHistory h ON h.ticket.id = r.id "
                    + "JOIN UserTeam ut ON ut.team.id = r.team.id "
                    + "WHERE r.isDeleted = false "
                    + "AND r.isCompleted = false "
                    + "AND h.status <> :status "
                    + "AND ut.user.id = :userId "
                    + "AND ("
                    + "  (h.slaDueDate IS NOT NULL AND h.slaDueDate < CURRENT_TIMESTAMP) "
                    + "  OR (r.estimatedCompletionDate IS NOT NULL AND r.estimatedCompletionDate < CURRENT_TIMESTAMP)"
                    + ")")
    Page<Ticket> findOverdueTicketsByUserId(
            @Param("userId") Long userId,
            @Param("status") WorkflowTransitionHistoryStatus completedStatus,
            Pageable pageable);

    @Query(
            """
    SELECT DISTINCT r
    FROM Ticket r
    JOIN WorkflowTransitionHistory h ON h.ticket.id = r.id
    WHERE r.isDeleted = false
      AND r.isCompleted = false
      AND (
        (r.estimatedCompletionDate IS NOT NULL AND r.estimatedCompletionDate < CURRENT_TIMESTAMP)
        OR (h.slaDueDate IS NOT NULL AND h.slaDueDate < CURRENT_TIMESTAMP AND h.status <> :completedStatus)
      )
""")
    Page<Ticket> findAllOverdueTickets(
            @Param("completedStatus") WorkflowTransitionHistoryStatus completedStatus,
            Pageable pageable);

    @Query(
            """
            SELECT COUNT(r.id)
            FROM Ticket r
            JOIN WorkflowTransitionHistory h ON h.ticket.id = r.id
            WHERE r.isDeleted = false
            AND r.isCompleted = false
            AND h.id = (
                SELECT h2.id
                FROM WorkflowTransitionHistory h2
                WHERE h2.ticket.id = r.id
                ORDER BY h2.transitionDate DESC
                LIMIT 1
            )
            AND h.status <> :status
            AND r.team.id = :teamId
            AND (
                (h.slaDueDate IS NOT NULL AND h.slaDueDate < CURRENT_TIMESTAMP)
                OR (r.estimatedCompletionDate IS NOT NULL AND r.estimatedCompletionDate < CURRENT_TIMESTAMP)
            )
            AND (
                (h.slaDueDate >= COALESCE(:fromDate, h.slaDueDate) OR r.estimatedCompletionDate >= COALESCE(:fromDate, r.estimatedCompletionDate))
            )
            AND (
                (h.slaDueDate <= COALESCE(:toDate, h.slaDueDate) OR r.estimatedCompletionDate <= COALESCE(:toDate, r.estimatedCompletionDate))
            )
            """)
    Long countOverdueTicketsByTeamId(
            @Param("teamId") Long teamId,
            @Param("status") WorkflowTransitionHistoryStatus completedStatus,
            @Param("fromDate") Instant fromDate,
            @Param("toDate") Instant toDate);

    @Query(
            "SELECT new io.flowinquiry.modules.teams.service.dto.TicketActionCountByDateDTO("
                    + "CAST(r.createdAt AS date), "
                    + "COUNT(r.id), "
                    + "COALESCE(closedTicketCounts.closedCount, 0)) "
                    + "FROM Ticket r "
                    + "LEFT JOIN ("
                    + "    SELECT CAST(c.actualCompletionDate AS date) AS completionDate, COUNT(c.id) AS closedCount "
                    + "    FROM Ticket c "
                    + "    WHERE c.isDeleted = false "
                    + "    AND c.team.id = :teamId "
                    + "    AND c.isCompleted = true "
                    + "    AND c.actualCompletionDate IS NOT NULL "
                    + "    GROUP BY CAST(c.actualCompletionDate AS date)"
                    + ") closedTicketCounts ON CAST(r.createdAt AS date) = closedTicketCounts.completionDate "
                    + "WHERE r.isDeleted = false "
                    + "AND r.team.id = :teamId "
                    + "AND r.createdAt >= :startDate "
                    + "GROUP BY CAST(r.createdAt AS date), closedTicketCounts.closedCount "
                    + "ORDER BY CAST(r.createdAt AS date) ASC")
    List<TicketActionCountByDateDTO> findTicketActionByDaySeries(
            @Param("teamId") Long teamId, @Param("startDate") Instant startDate);

    @Query(
            """
            SELECT new io.flowinquiry.modules.teams.service.dto.TeamTicketPriorityDistributionDTO(
                r.team.id,
                r.team.name,
                r.priority,
                COUNT(r.id)
            )
            FROM Ticket r
            JOIN UserTeam ut ON ut.team.id = r.team.id
            WHERE ut.user.id = :userId
            AND r.isDeleted = false
            AND r.isCompleted = false
            AND r.createdAt >= COALESCE(:fromDate, r.createdAt)
            AND r.createdAt <= COALESCE(:toDate, r.createdAt)
            GROUP BY r.team.id, r.team.name, r.priority
            """)
    List<TeamTicketPriorityDistributionDTO> findPriorityDistributionByUserId(
            @Param("userId") Long userId,
            @Param("fromDate") Instant fromDate,
            @Param("toDate") Instant toDate);

    boolean existsByWorkflowIdAndIsDeletedFalse(Long workflowId);

    @Query("SELECT SUM(t.estimate) FROM Ticket t WHERE t.epic.id = :epicId")
    Long getTotalStoryPointsByEpicId(@Param("epicId") Long epicId);

    @Query("SELECT SUM(t.estimate) FROM Ticket t WHERE t.iteration.id = :iterationId")
    Long getTotalStoryPointsByIterationId(@Param("iterationId") Long iterationId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
            "UPDATE Ticket t SET t.isCompleted=true,t.actualCompletionDate= current_date WHERE t.iteration.id = :iterationId and t.isCompleted = false and t.isDeleted = false")
    int findTicketsByIterationIdAndClose(@Param("iterationId") Long iterationId);
}
