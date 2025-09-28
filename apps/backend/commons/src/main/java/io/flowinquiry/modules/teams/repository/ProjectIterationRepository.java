package io.flowinquiry.modules.teams.repository;

import io.flowinquiry.modules.teams.domain.ProjectIteration;
import io.flowinquiry.modules.teams.domain.ProjectIterationStatus;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectIterationRepository
        extends JpaRepository<ProjectIteration, Long>, JpaSpecificationExecutor<ProjectIteration> {

    List<ProjectIteration> findByProjectIdOrderByStartDateAsc(Long projectId);

    @Query(
            "Select (COUNT(p) > 0) from ProjectIteration p Where p.project.id = :projectId and p.status =:status and p.startDate >= :endDate")
    boolean existsByProjectIdAndStatusAndStartDateAfter(
            @Param("projectId") Long projectId,
            @Param("status") ProjectIterationStatus status,
            @Param("endDate") Instant endDate);
}
