package io.flowinquiry.modules.collab.repository;

import io.flowinquiry.modules.collab.domain.EmailJob;
import io.flowinquiry.modules.collab.domain.EmailJobStatus;
import java.util.List;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailJobRepository extends JpaRepository<EmailJob, Long> {
    List<EmailJob> findByStatusOrderByCreatedAtAsc(EmailJobStatus status, Limit limit);
}
