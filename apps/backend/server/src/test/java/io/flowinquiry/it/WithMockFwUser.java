package io.flowinquiry.it;

import static java.util.stream.Collectors.*;

import io.flowinquiry.modules.usermanagement.AuthoritiesConstants;
import io.flowinquiry.modules.usermanagement.domain.Authority;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.domain.UserAuth;
import io.flowinquiry.modules.usermanagement.domain.UserStatus;
import io.flowinquiry.security.SecurityUtils;
import io.flowinquiry.security.domain.FwUserDetails;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.test.context.support.WithSecurityContext;
import org.springframework.security.test.context.support.WithSecurityContextFactory;

/**
 * Custom annotation for tests that need an authenticated user with a valid ID. This is useful for
 * tests that interact with services that require a valid user ID for auditing or other purposes.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@WithSecurityContext(factory = WithMockFwUser.Factory.class)
public @interface WithMockFwUser {

    /**
     * The user ID to use for the authenticated user. Defaults to 1L, which should be a valid user
     * ID in the test database.
     */
    long userId() default 1L;

    /** The username to use for the authenticated user. Defaults to "admin". */
    String username() default "admin@flowinquiry.io";

    String tenantIdAsString() default "00000000-0000-0000-0000-000000000001";

    /** The authorities to grant to the authenticated user. Defaults to ROLE_ADMIN. */
    String[] authorities() default {AuthoritiesConstants.ADMIN};

    class Factory implements WithSecurityContextFactory<WithMockFwUser> {
        @Override
        public SecurityContext createSecurityContext(WithMockFwUser annotation) {
            SecurityContext context = SecurityContextHolder.createEmptyContext();

            // Create a User object with the specified ID and username
            User user = new User();
            user.setId(annotation.userId());
            user.setEmail(annotation.username());
            user.setStatus(UserStatus.ACTIVE);
            user.setTenantId(UUID.fromString(annotation.tenantIdAsString()));

            // Set up authorities
            Set<Authority> authorities = new HashSet<>();
            for (String auth : annotation.authorities()) {
                Authority authority = new Authority();
                authority.setName(auth);
                authorities.add(authority);
            }
            user.setAuthorities(authorities);

            // Set up user auth with password
            Set<UserAuth> userAuths = new HashSet<>();
            UserAuth userAuth = new UserAuth();
            userAuth.setAuthProvider("UP");
            userAuth.setPasswordHash("password");
            userAuths.add(userAuth);
            user.setUserAuths(userAuths);

            // Create FwUserDetails from the User object
            FwUserDetails principal = new FwUserDetails(user);

            // Create a JWT token with claims
            Jwt jwt =
                    Jwt.withTokenValue("mock-token")
                            .header("alg", "HS512")
                            .subject(principal.getUsername())
                            .claim(SecurityUtils.TENANT_ID, user.getTenantId())
                            .claim(SecurityUtils.USER_ID, user.getId())
                            .claim(
                                    SecurityUtils.AUTHORITIES_KEY,
                                    principal.getAuthorities().stream()
                                            .map(GrantedAuthority::getAuthority)
                                            .collect(joining(" ")))
                            .build();

            Authentication auth = new JwtAuthenticationToken(jwt, principal.getAuthorities());
            context.setAuthentication(auth);
            return context;
        }
    }
}
