package io.flexwork.modules.usermanagement.service;

import io.flexwork.modules.usermanagement.UserNotActivatedException;
import io.flexwork.modules.usermanagement.domain.Authority;
import io.flexwork.modules.usermanagement.domain.User;
import io.flexwork.modules.usermanagement.repository.UserRepository;
import io.flexwork.modules.usermanagement.service.dto.FwUserDetails;
import java.util.List;
import org.hibernate.validator.internal.constraintvalidators.hv.EmailValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Authenticate a user from the database. */
@Component("userDetailsService")
public class DomainUserDetailsService implements UserDetailsService {

    private static final Logger log = LoggerFactory.getLogger(DomainUserDetailsService.class);

    private final UserRepository userRepository;

    public DomainUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(final String email) {
        log.debug("Authenticating {}", email);

        if (new EmailValidator().isValid(email, null)) {
            return userRepository
                    .findOneWithAuthoritiesByEmailIgnoreCase(email)
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

    private FwUserDetails createSpringSecurityUser(String lowercaseLogin, User user) {
        if (!user.isActivated()) {
            throw new UserNotActivatedException("User " + lowercaseLogin + " was not activated");
        }
        List<SimpleGrantedAuthority> grantedAuthorities =
                user.getAuthorities().stream()
                        .map(Authority::getName)
                        .map(SimpleGrantedAuthority::new)
                        .toList();
        return new FwUserDetails(user);
    }
}
