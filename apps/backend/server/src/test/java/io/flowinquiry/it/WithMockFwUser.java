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
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.test.context.support.WithSecurityContext;
import org.springframework.security.test.context.support.WithSecurityContextFactory;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

/**
 * Custom annotation for tests that need an authenticated user with a valid ID. This is useful for
 * tests that interact with services that require a valid user ID for auditing or other purposes.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@WithSecurityContext(factory = WithMockFwUser.Factory.class)
public @interface WithMockFwUser {

    String DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";

    /**
     * The user ID to use for the authenticated user. Defaults to 1L, which should be a valid user
     * ID in the test database.
     */
    long userId() default 1L;

    /** The username to use for the authenticated user. Defaults to "admin". */
    String username() default "admin@example.com";

    String tenantIdAsString() default DEFAULT_TENANT_ID;

    /** The authorities to grant to the authenticated user. Defaults to ROLE_ADMIN. */
    String[] authorities() default {AuthoritiesConstants.ADMIN};

    class Factory implements WithSecurityContextFactory<WithMockFwUser> {
        @Override
        public SecurityContext createSecurityContext(WithMockFwUser annotation) {
            SecurityContext context = SecurityContextHolder.createEmptyContext();

            User user = new User();
            user.setId(annotation.userId());
            user.setEmail(annotation.username());
            user.setStatus(UserStatus.ACTIVE);
            user.setTenantId(UUID.fromString(annotation.tenantIdAsString()));

            Set<Authority> authorities = new HashSet<>();
            for (String auth : annotation.authorities()) {
                Authority authority = new Authority();
                authority.setName(auth);
                authorities.add(authority);
            }
            user.setAuthorities(authorities);

            Set<UserAuth> userAuths = new HashSet<>();
            UserAuth userAuth = new UserAuth();
            userAuth.setAuthProvider("UP");
            userAuth.setPasswordHash("password");
            userAuths.add(userAuth);
            user.setUserAuths(userAuths);

            FwUserDetails principal = new FwUserDetails(user);

            Jwt jwt =
                    Jwt.withTokenValue("mock-token")
                            .header("alg", "HS512")
                            .subject(principal.getUsername())
                            .claim(SecurityUtils.TENANT_ID, user.getTenantId().toString())
                            .claim(SecurityUtils.USER_ID, user.getId())
                            .claim(
                                    SecurityUtils.AUTHORITIES_KEY,
                                    principal.getAuthorities().stream()
                                            .map(GrantedAuthority::getAuthority)
                                            .collect(joining(" ")))
                            .build();

            Authentication auth =
                    new JwtAuthenticationToken(
                            jwt, principal.getAuthorities(), principal.getUsername());
            context.setAuthentication(auth);
            return context;
        }
    }

    /** MockMvc helper for Boot 4 stateless security tests. */
    final class MockMvcJwt {
        private MockMvcJwt() {}

        public static RequestPostProcessor jwt() {
            return jwt(1L, "admin@example.com", DEFAULT_TENANT_ID, AuthoritiesConstants.ADMIN);
        }

        public static RequestPostProcessor jwt(
                long userId, String username, String tenantIdAsString, String... authorities) {
            return org.springframework.security.test.web.servlet.request
                    .SecurityMockMvcRequestPostProcessors.jwt()
                    .jwt(
                            token ->
                                    token.subject(username)
                                            .claim(SecurityUtils.TENANT_ID, tenantIdAsString)
                                            .claim(SecurityUtils.USER_ID, userId)
                                            .claim(
                                                    SecurityUtils.AUTHORITIES_KEY,
                                                    String.join(" ", authorities)))
                    .authorities(
                            java.util.Arrays.stream(authorities)
                                    .map(
                                            auth ->
                                                    (GrantedAuthority)
                                                            new SimpleGrantedAuthority(auth))
                                    .toList());
        }
    }
}
