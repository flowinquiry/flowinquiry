package io.flowinquiry.modules.teams.domain;

import io.flowinquiry.tenant.domain.TenantScopedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Table(name = "fw_workflow_transition")
public class WorkflowTransition extends TenantScopedEntity {

    @EqualsAndHashCode.Include
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "workflow_id", nullable = false)
    private Workflow workflow;

    @ManyToOne
    @JoinColumn(name = "source_state_id", nullable = false)
    private WorkflowState sourceState;

    @ManyToOne
    @JoinColumn(name = "target_state_id", nullable = false)
    private WorkflowState targetState;

    @Column(name = "event_name", nullable = false)
    private String eventName;

    @Column(name = "sla_duration")
    private Long slaDuration;

    @Column(name = "escalate_on_violation", nullable = false)
    private boolean escalateOnViolation;
}
