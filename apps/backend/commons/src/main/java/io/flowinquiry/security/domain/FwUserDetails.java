package io.flowinquiry.security.domain;

import static io.flowinquiry.modules.usermanagement.domain.UserAuth.UP_AUTH_PROVIDER;
import static java.util.Comparator.comparing;

import io.flowinquiry.modules.usermanagement.domain.Authority;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.domain.UserAuth;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.SortedSet;
import java.util.TreeSet;
import java.util.UUID;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.Assert;

/**
 * FlowInquiry user details implementation that enhances Spring Security's UserDetails with
 * additional information. This class provides user authentication and authorization details for the
 * FlowInquiry application. It stores user-specific information such as user ID, username (email),
 * password, tenant ID, and authorities. The class implements the Spring Security UserDetails
 * interface to integrate with Spring Security's authentication system.
 */
public class FwUserDetails implements UserDetails {

    /** The unique identifier of the user. */
    @Getter private final Long userId;

    /** The username of the user, which is their email address. */
    private final String username;

    /** The password hash of the user, retrieved from UserAuth with UP_AUTH_PROVIDER. */
    private final String password;

    /** The tenant ID associated with the user. */
    @Getter private final UUID tenantId;

    /**
     * The set of authorities (permissions) granted to the user. This is an unmodifiable sorted set
     * of GrantedAuthority objects.
     */
    private final Set<GrantedAuthority> authorities;

    /**
     * Constructs a new FwUserDetails instance from a User entity.
     *
     * @param user The User entity from which to extract details
     */
    public FwUserDetails(User user) {
        this.userId = user.getId();
        this.username = user.getEmail();
        this.password =
                user.getUserAuths().stream()
                        .filter(auth -> UP_AUTH_PROVIDER.equalsIgnoreCase(auth.getAuthProvider()))
                        .map(UserAuth::getPasswordHash)
                        .findFirst()
                        .orElse("");

        SortedSet<GrantedAuthority> sortedAuthorities =
                new TreeSet<>(comparing(GrantedAuthority::getAuthority));

        List<SimpleGrantedAuthority> grantedAuthorities =
                user.getAuthorities().stream()
                        .map(Authority::getName)
                        .map(SimpleGrantedAuthority::new)
                        .toList();

        for (GrantedAuthority grantedAuthority : grantedAuthorities) {
            Assert.notNull(
                    grantedAuthority, "GrantedAuthority list cannot contain any null elements");
            sortedAuthorities.add(grantedAuthority);
        }

        this.tenantId = user.getTenantId();
        this.authorities = Collections.unmodifiableSet(sortedAuthorities);
    }

    /**
     * Returns the authorities granted to the user.
     *
     * @return An unmodifiable sorted set of GrantedAuthority objects
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    /**
     * Returns the password used to authenticate the user.
     *
     * @return The password hash
     */
    @Override
    public String getPassword() {
        return password;
    }

    /**
     * Returns the username used to authenticate the user. In this implementation, the username is
     * the user's email address.
     *
     * @return The username (email)
     */
    @Override
    public String getUsername() {
        return username;
    }

    /**
     * Indicates whether the user's account has expired. In this implementation, accounts never
     * expire.
     *
     * @return true (always, as accounts never expire)
     */
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    /**
     * Indicates whether the user is locked or unlocked. In this implementation, accounts are never
     * locked.
     *
     * @return true (always, as accounts are never locked)
     */
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    /**
     * Indicates whether the user's credentials (password) has expired. In this implementation,
     * credentials never expire.
     *
     * @return true (always, as credentials never expire)
     */
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    /**
     * Indicates whether the user is enabled or disabled. In this implementation, users are always
     * enabled.
     *
     * @return true (always, as users are always enabled)
     */
    @Override
    public boolean isEnabled() {
        return true;
    }
}
