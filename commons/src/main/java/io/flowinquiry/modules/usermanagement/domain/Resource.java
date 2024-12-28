package io.flowinquiry.modules.usermanagement.domain;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;
import lombok.*;

@Entity
@Table(name = "fw_resource")
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Resource {

    @EqualsAndHashCode.Include
    @Id
    @Column(name = "name", nullable = false, unique = true, length = 50)
    private String name;

    @Column(name = "description", length = 256)
    private String description;

    @EqualsAndHashCode.Exclude
    @OneToMany(mappedBy = "resource", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<AuthorityResourcePermission> authorityResourcePermissions = new HashSet<>();
}
