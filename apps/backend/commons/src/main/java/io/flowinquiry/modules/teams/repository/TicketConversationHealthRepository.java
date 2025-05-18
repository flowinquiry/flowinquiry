package io.flowinquiry.modules.teams.repository;

import io.flowinquiry.modules.teams.domain.TicketConversationHealth;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketConversationHealthRepository
        extends JpaRepository<TicketConversationHealth, Long> {

    Optional<TicketConversationHealth> findByTicketId(Long ticketId);
}
