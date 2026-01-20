package io.flowinquiry.security;

import io.flowinquiry.modules.usermanagement.AuthoritiesConstants;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.service.dto.UserKey;
import io.flowinquiry.security.domain.FwUserDetails;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;

/** Utility class for Spring Security. */
public final class SecurityUtils {

    public static final MacAlgorithm JWT_ALGORITHM = MacAlgorithm.HS512;

    public static final String AUTHORITIES_KEY = "auth";

    public static final String TENANT_ID = "tenantId";

    public static final String USER_ID = "userId";

    private SecurityUtils() {}

    /**
     * Get the login of the current user.
     *
     * @return the login of the current user.
     */
    public static Optional<UserKey> getCurrentUserLogin() {
        SecurityContext securityContext = SecurityContextHolder.getContext();
        return Optional.ofNullable(extractPrincipal(securityContext.getAuthentication()));
    }

    public static User getCurrentUserAuditorLogin() {
        return SecurityUtils.getCurrentUserLogin()
                .map(userKey -> User.builder().id(userKey.getId()).build())
                .orElse(null);
    }

    private static UserKey extractPrincipal(Authentication authentication) {
        if (authentication == null) {
            return null;
        } else if (authentication.getPrincipal() instanceof FwUserDetails springSecurityUser) {
            return new UserKey(
                    springSecurityUser.getUserId(),
                    springSecurityUser.getUsername(),
                    springSecurityUser.getTenantId());
        } else if (authentication.getPrincipal() instanceof Jwt jwt) {
            Object claim = jwt.getClaim(TENANT_ID);
            UUID tenantId =
                    switch (claim) {
                        case String s -> UUID.fromString(s);
                        case UUID uuid -> uuid;
                        case null -> throw new IllegalArgumentException("Missing tenantId in JWT");
                        default ->
                                throw new IllegalArgumentException(
                                        "Invalid tenantId claim type: " + claim.getClass());
                    };

            return new UserKey(jwt.getClaim(USER_ID), jwt.getSubject(), tenantId);
        } else if (authentication.getPrincipal() instanceof UserDetails) {
            return null;
        } else if (authentication.getPrincipal() instanceof String) {
            return null;
        } else {
            throw new IllegalArgumentException(
                    "Can not extract principal from "
                            + authentication
                            + " because type "
                            + authentication.getClass()
                            + " is not supported");
        }
    }

    /**
     * Get the JWT of the current user.
     *
     * @return the JWT of the current user.
     */
    public static Optional<String> getCurrentUserJWT() {
        SecurityContext securityContext = SecurityContextHolder.getContext();
        return Optional.ofNullable(securityContext.getAuthentication())
                .filter(authentication -> authentication.getCredentials() instanceof String)
                .map(authentication -> (String) authentication.getCredentials());
    }

    /**
     * Check if a user is authenticated.
     *
     * @return true if the user is authenticated, false otherwise.
     */
    public static boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null
                && getAuthorities(authentication).noneMatch(AuthoritiesConstants.ANONYMOUS::equals);
    }

    /**
     * Checks if the current user has any of the authorities.
     *
     * @param authorities the authorities to check.
     * @return true if the current user has any of the authorities, false otherwise.
     */
    public static boolean hasCurrentUserAnyOfAuthorities(String... authorities) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (authentication != null
                && getAuthorities(authentication)
                        .anyMatch(authority -> Arrays.asList(authorities).contains(authority)));
    }

    /**
     * Checks if the current user has none of the authorities.
     *
     * @param authorities the authorities to check.
     * @return true if the current user has none of the authorities, false otherwise.
     */
    public static boolean hasCurrentUserNoneOfAuthorities(String... authorities) {
        return !hasCurrentUserAnyOfAuthorities(authorities);
    }

    /**
     * Checks if the current user has a specific authority.
     *
     * @param authority the authority to check.
     * @return true if the current user has the authority, false otherwise.
     */
    public static boolean hasCurrentUserThisAuthority(String authority) {
        return hasCurrentUserAnyOfAuthorities(authority);
    }

    private static Stream<String> getAuthorities(Authentication authentication) {
        return authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority);
    }

    /**
     * Get the user ID from the authentication object.
     *
     * @param authentication the authentication object
     * @return the user ID if present
     */
    public static Optional<Long> getUserId(Authentication authentication) {
        if (authentication == null) {
            return Optional.empty();
        }

        UserKey userKey = extractPrincipal(authentication);
        return Optional.ofNullable(userKey).map(UserKey::getId);
    }
}
