package io.flowinquiry.modules.usermanagement.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Table(name = "fw_user_authority")
@IdClass(UserAuthorityId.class) // Use a composite key
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAuthority implements Serializable {

    @EqualsAndHashCode.Include
    @Id
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @EqualsAndHashCode.Include
    @Id
    @ManyToOne
    @JoinColumn(name = "authority_name", nullable = false)
    private Authority authority;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;
}
