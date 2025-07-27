package io.flowinquiry.modules.teams.domain;

import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.tenant.domain.TenantScopedAuditingEntity;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.hibernate.annotations.Formula;

@EqualsAndHashCode(callSuper = false)
@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Table(name = "fw_ticket")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ticket extends TenantScopedAuditingEntity<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne
    @JoinColumn(name = "workflow_id", nullable = false)
    private Workflow workflow;

    @ManyToOne
    @JoinColumn(name = "request_user_id", nullable = false)
    private User requestUser;

    @ManyToOne
    @JoinColumn(name = "assign_user_id")
    private User assignUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", foreignKey = @ForeignKey(name = "fk_team_request_project"))
    private Project project;

    @Column(name = "project_ticket_number", nullable = false)
    private Long projectTicketNumber;

    private String requestTitle;

    private String requestDescription;

    @Column(nullable = false)
    @Convert(converter = TicketPriorityConverter.class)
    private TicketPriority priority;

    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted = false;

    @Column(name = "is_recurring", nullable = false)
    private boolean isRecurring = false;

    @Column(name = "estimated_completion_date")
    private LocalDate estimatedCompletionDate;

    @Column(name = "actual_completion_date")
    private LocalDate actualCompletionDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_state_id")
    private WorkflowState currentState;

    @Column(name = "channel")
    @Convert(converter = TicketChannelConverter.class)
    private TicketChannel channel;

    @Column(name = "is_new", nullable = false)
    private Boolean isNew = true;

    @Column(name = "is_completed", nullable = false)
    private Boolean isCompleted = false;

    @Formula(
            "(SELECT COUNT(a.id) FROM fw_entity_attachment a WHERE a.entity_type = 'Ticket' AND a.entity_id = id)")
    private int numberAttachments;

    @Formula(
            "(SELECT COUNT(a.id) FROM fw_entity_watchers a WHERE a.entity_type = 'Ticket' AND a.entity_id = id)")
    private int numberWatchers;

    @OneToOne(
            mappedBy = "ticket",
            cascade = CascadeType.ALL,
            fetch = FetchType.LAZY,
            orphanRemoval = true)
    private TicketConversationHealth conversationHealth;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "iteration_id", foreignKey = @ForeignKey(name = "fk_team_request_iteration"))
    private ProjectIteration iteration;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "epic_id", foreignKey = @ForeignKey(name = "fk_team_request_epic"))
    private ProjectEpic epic;

    @Column
    @Enumerated(EnumType.STRING)
    private TShirtSize size;

    @Column private Integer estimate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_ticket_id", foreignKey = @ForeignKey(name = "fk_ticket_parent"))
    private Ticket parentTicket;

    @OneToMany(mappedBy = "parentTicket", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Ticket> childTickets = new ArrayList<>();
}
