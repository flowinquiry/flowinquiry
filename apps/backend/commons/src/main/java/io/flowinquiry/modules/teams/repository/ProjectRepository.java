package io.flowinquiry.modules.teams.repository;

import io.flowinquiry.modules.teams.domain.Project;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ProjectRepository
        extends JpaRepository<Project, Long>, JpaSpecificationExecutor<Project> {

    Optional<Project> findByShortName(String shortName);
}
