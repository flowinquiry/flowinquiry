package io.flowinquiry.modules.usermanagement.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.io.Serializable;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Formula;

@Entity
@Table(name = "fw_authority")
@JsonIgnoreProperties(value = {"new", "id"})
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Authority implements Serializable {

    private static final long serialVersionUID = 1L;

    @EqualsAndHashCode.Include
    @NotNull @Size(max = 50)
    @Id
    @Column(name = "name", length = 50, nullable = false)
    private String name;

    @NotNull @Size(max = 50)
    @Column(name = "descriptive_name", length = 50, nullable = false, unique = true)
    private String descriptiveName;

    @Column(name = "system_role")
    private Boolean systemRole;

    @Column(name = "description")
    private String description;

    @EqualsAndHashCode.Exclude
    @ManyToMany(mappedBy = "authorities")
    private Set<User> users;

    @EqualsAndHashCode.Exclude
    @OneToMany(mappedBy = "authority")
    private Set<AuthorityResourcePermission> authorityResourcePermissions;

    @Formula("(SELECT COUNT(ua.user_id) FROM fw_user_authority ua WHERE ua.authority_name = name)")
    private Long usersCount;
}
