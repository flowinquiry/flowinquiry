package io.flowinquiry.modules.audit.domain;

import io.flowinquiry.modules.usermanagement.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MappedSuperclass;
import java.time.Instant;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * Base abstract class for entities which will hold definitions for created, last modified, created
 * by, last modified by attributes.
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@SuperBuilder
@NoArgsConstructor
@Data
public abstract class AbstractAuditingEntity<T> extends AbstractCreationAuditingEntity<T> {

    @LastModifiedBy
    @Column(name = "modified_by")
    private Long modifiedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modified_by", insertable = false, updatable = false)
    private User modifiedByUser;

    @LastModifiedDate
    @Column(name = "modified_at")
    private Instant modifiedAt;
}
