package io.flowinquiry.modules.teams.repository;

import io.flowinquiry.modules.teams.domain.Integration;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface IntegrationSettingsRepository extends JpaRepository<Integration, Long> {

    @Query("SELECT pi From Integration pi WHERE pi.project.id = :projectId")
    List<Integration> getAllIntegrationsByProjectId(@Param("projectId") Long projectId);

    @Query(
            "SELECT pi From Integration pi WHERE pi.project.id = :projectId AND pi.enabled = true AND pi.repoName = :repoName")
    Optional<Integration> findByProjectIdAndRepoNameAndEnabled(
            @Param("projectId") Long projectId, @Param("repoName") String repoName);
}
