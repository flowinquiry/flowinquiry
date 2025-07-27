package io.flowinquiry.security.service;

import io.flowinquiry.modules.usermanagement.UserNotActivatedException;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.domain.UserStatus;
import io.flowinquiry.modules.usermanagement.repository.UserRepository;
import io.flowinquiry.security.domain.FwUserDetails;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.validator.internal.constraintvalidators.hv.EmailValidator;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service class for loading user details from the database during authentication. This
 * implementation validates email format, retrieves user data including authorities, and ensures the
 * user is active before creating a security user object.
 */
@Component("appUserDetailService")
@Slf4j
public class DomainUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Creates a new instance of DomainUserDetailsService.
     *
     * @param userRepository the repository used to retrieve user information
     */
    public DomainUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Loads a user by email address for authentication.
     *
     * @param email the email address to search for
     * @return a UserDetails object containing the user's authentication information
     * @throws UsernameNotFoundException if the user is not found in the database
     * @throws IllegalArgumentException if the provided email is invalid
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(final String email) {
        log.debug("Authenticating {}", email);

        if (new EmailValidator().isValid(email, null)) {
            return userRepository
                    .findOneWithAuthoritiesAndUserAuthsByEmailIgnoreCase(email)
                    .map(user -> createSpringSecurityUser(email, user))
                    .orElseThrow(
                            () ->
                                    new UsernameNotFoundException(
                                            "User with email "
                                                    + email
                                                    + " was not found in the database"));
        } else {
            throw new IllegalArgumentException("Invalid email: " + email);
        }
    }

    /**
     * Creates a Spring Security user with the given user information.
     *
     * @param lowercaseLogin the email of the user being authenticated
     * @param user the user entity retrieved from the database
     * @return a FwUserDetails object containing the user's security details
     * @throws UserNotActivatedException if the user account is not active
     */
    private FwUserDetails createSpringSecurityUser(String lowercaseLogin, User user) {
        if (!user.getStatus().equals(UserStatus.ACTIVE)) {
            throw new UserNotActivatedException("User " + lowercaseLogin + " was not activated");
        }
        return new FwUserDetails(user);
    }
}
