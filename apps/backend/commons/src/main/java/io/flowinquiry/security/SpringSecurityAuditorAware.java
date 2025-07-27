package io.flowinquiry.security;

import io.flowinquiry.modules.usermanagement.service.dto.UserKey;
import java.util.Optional;
import org.springframework.data.domain.AuditorAware;
import org.springframework.stereotype.Component;

/**
 * Implementation of {@link AuditorAware} based on Spring Security.
 *
 * <p>This class provides the current user's ID for auditing purposes in Spring Data JPA entities.
 * It retrieves the current authenticated user from the security context and extracts their ID.
 */
@Component
public class SpringSecurityAuditorAware implements AuditorAware<Long> {

    /**
     * Gets the ID of the current authenticated user for auditing purposes.
     *
     * @return an {@link Optional} containing the current user's ID if a user is authenticated, or
     *     an empty {@link Optional} if no user is authenticated
     */
    @Override
    public Optional<Long> getCurrentAuditor() {
        return SecurityUtils.getCurrentUserLogin().map(UserKey::getId).or(Optional::empty);
    }
}
