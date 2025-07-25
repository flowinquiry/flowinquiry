package io.flowinquiry.modules.usermanagement.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.flowinquiry.modules.audit.domain.AbstractAuditingEntity;
import io.flowinquiry.modules.collab.domain.EntityWatcher;
import io.flowinquiry.modules.teams.domain.Team;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.io.Serial;
import java.io.Serializable;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/** A user. */
@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Table(name = "fw_user")
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User extends AbstractAuditingEntity<Long> implements Serializable {

    @Serial private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Size(max = 50) @Column(name = "first_name", length = 50)
    private String firstName;

    @Size(max = 50) @Column(name = "last_name", length = 50)
    private String lastName;

    @Email @Size(min = 5, max = 254) @Column(length = 254, unique = true)
    private String email;

    @NotNull @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private UserStatus status = UserStatus.PENDING;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Size(min = 2, max = 10) @Column(name = "lang_key", length = 10)
    private String langKey;

    @Size(max = 256) @Column(name = "image_url", length = 256)
    private String imageUrl;

    @Size(max = 50) @Column(name = "role", length = 50)
    private String role;

    @Size(max = 100) @Column(name = "title", length = 100)
    private String title;

    @ManyToOne
    @JoinColumn(name = "manager_id")
    private User manager;

    @Size(max = 20) @Column(name = "activation_key", length = 20)
    @JsonIgnore
    private String activationKey;

    @Size(max = 20) @Column(name = "reset_key", length = 20)
    @JsonIgnore
    private String resetKey;

    @Column(name = "reset_date")
    private Instant resetDate = null;

    @Column(name = "timezone", nullable = false)
    private String timezone;

    @Column(name = "about", columnDefinition = "TEXT")
    private String about;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "last_login_time")
    private Instant lastLoginTime;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserAuth> userAuths = new HashSet<>();

    @JsonIgnore
    @ManyToMany
    @BatchSize(size = 20)
    @JoinTable(
            name = "fw_user_team",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "team_id"))
    private Set<Team> teams;

    @OneToMany(mappedBy = "createdBy", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<EntityWatcher> createdWatchers;

    @JsonIgnore
    @ManyToMany
    @BatchSize(size = 20)
    @JoinTable(
            name = "fw_user_authority",
            joinColumns = {@JoinColumn(name = "user_id", referencedColumnName = "id")},
            inverseJoinColumns = {
                @JoinColumn(name = "authority_name", referencedColumnName = "name")
            })
    private Set<Authority> authorities = new HashSet<>();

    @BatchSize(size = 20)
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserTeam> userTeams = new HashSet<>();

    public Instant getLastLoginTime() {
        return lastLoginTime;
    }

    @PrePersist
    public void prePersist() {
        if (isDeleted == null) {
            isDeleted = Boolean.FALSE;
        }
    }

    public String getPasswordHash(String authProvider) {
        return this.userAuths.stream()
                .filter(auth -> authProvider.equalsIgnoreCase(auth.getAuthProvider()))
                .findFirst()
                .map(UserAuth::getPasswordHash)
                .orElseThrow(
                        () ->
                                new IllegalStateException(
                                        authProvider + " authentication not found"));
    }
}
