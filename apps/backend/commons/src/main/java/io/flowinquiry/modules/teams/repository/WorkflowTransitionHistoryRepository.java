package io.flowinquiry.modules.teams.repository;

import io.flowinquiry.modules.teams.domain.WorkflowTransitionHistory;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkflowTransitionHistoryRepository
        extends JpaRepository<WorkflowTransitionHistory, Long> {

    /**
     * Finds and sorts the workflow transition history for a specific ticket.
     *
     * @param ticketId the ID of the ticket
     * @return a list of WorkflowTransitionHistory sorted by transitionDate
     */
    @Query(
            "SELECT wth FROM WorkflowTransitionHistory wth "
                    + "WHERE wth.ticket.id = :ticketId "
                    + "ORDER BY wth.transitionDate ASC")
    List<WorkflowTransitionHistory> findByTicketId(@Param("ticketId") Long ticketId);

    @Query(
            """
    SELECT wth FROM WorkflowTransitionHistory wth
    WHERE wth.status = io.flowinquiry.modules.teams.domain.WorkflowTransitionHistoryStatus.IN_PROGRESS
    AND wth.slaDueDate <= :checkTime
    """)
    List<WorkflowTransitionHistory> findViolatingTransitions(@Param("checkTime") Instant checkTime);
}
