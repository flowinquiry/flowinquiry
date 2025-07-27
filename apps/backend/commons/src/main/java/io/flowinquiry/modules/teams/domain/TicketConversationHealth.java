package io.flowinquiry.modules.teams.domain;

import io.flowinquiry.tenant.domain.TenantScopedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Table(name = "fw_ticket_conversation_health")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketConversationHealth extends TenantScopedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "summary")
    private String summary;

    @Column(name = "conversation_health")
    private Float conversationHealth;

    @Column(name = "cumulative_sentiment", nullable = false)
    private Float cumulativeSentiment = 0.0f;

    @Column(name = "total_messages", nullable = false)
    private Integer totalMessages = 0;

    @Column(name = "total_questions", nullable = false)
    private Integer totalQuestions = 0;

    @Column(name = "resolved_questions", nullable = false)
    private Integer resolvedQuestions = 0;

    @OneToOne
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;
}
