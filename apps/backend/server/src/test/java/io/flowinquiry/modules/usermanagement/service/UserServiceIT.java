package io.flowinquiry.modules.usermanagement.service;

import static io.flowinquiry.modules.usermanagement.domain.UserAuth.UP_AUTH_PROVIDER;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import io.flowinquiry.it.IntegrationTest;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.domain.UserAuth;
import io.flowinquiry.modules.usermanagement.domain.UserStatus;
import io.flowinquiry.modules.usermanagement.repository.UserAuthRepository;
import io.flowinquiry.modules.usermanagement.repository.UserRepository;
import io.flowinquiry.modules.usermanagement.service.dto.ResourcePermissionDTO;
import io.flowinquiry.modules.usermanagement.service.dto.UserDTO;
import io.flowinquiry.utils.Random;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.apache.commons.lang3.RandomStringUtils;
import org.assertj.core.groups.Tuple;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.auditing.AuditingHandler;
import org.springframework.data.auditing.DateTimeProvider;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

/** Integration tests for {@link UserService}. */
@IntegrationTest
@Transactional
class UserServiceIT {

    private static final String DEFAULT_EMAIL = "johndoe_service@localhost";

    private static final String DEFAULT_FIRSTNAME = "john";

    private static final String DEFAULT_LASTNAME = "doe";

    private static final String DEFAULT_IMAGEURL = "http://placehold.it/50x50";

    private static final String DEFAULT_LANGKEY = "dummy";

    @Autowired private UserRepository userRepository;

    @Autowired private UserAuthRepository userAuthRepository;

    @Autowired private UserService userService;

    @Autowired private AuditingHandler auditingHandler;

    @MockitoBean private DateTimeProvider dateTimeProvider;

    private User user;

    private Long numberOfUsers;

    @BeforeEach
    public void countUsers() {
        numberOfUsers = userRepository.count();
    }

    @BeforeEach
    public void init() {
        user = new User();
        user.setStatus(UserStatus.ACTIVE);
        user.setEmail(DEFAULT_EMAIL);
        user.setFirstName(DEFAULT_FIRSTNAME);
        user.setLastName(DEFAULT_LASTNAME);
        user.setImageUrl(DEFAULT_IMAGEURL);
        user.setLangKey(DEFAULT_LANGKEY);

        when(dateTimeProvider.getNow()).thenReturn(Optional.of(Instant.now()));
        auditingHandler.setDateTimeProvider(dateTimeProvider);
    }

    @AfterEach
    public void cleanupAndCheck() {
        userService.deleteUserByEmail(DEFAULT_EMAIL);
        assertThat(userRepository.count()).isEqualTo(numberOfUsers);
        numberOfUsers = null;
    }

    private void savedUser(User user) {
        UserAuth userAuth = new UserAuth();
        userAuth.setUser(user);
        userAuth.setAuthProvider(UP_AUTH_PROVIDER);

        userAuth.setPasswordHash(RandomStringUtils.secure().nextAlphanumeric(60));
        Set<UserAuth> set = new HashSet<>();
        set.add(userAuth);
        user.setUserAuths(set);
        userRepository.save(user);
    }

    @Test
    @Transactional
    void assertThatUserMustExistToResetPassword() {
        savedUser(user);
        Optional<UserDTO> maybeUser = userService.requestPasswordReset("invalid.login@localhost");
        assertThat(maybeUser).isNotPresent();

        maybeUser = userService.requestPasswordReset(user.getEmail());
        assertThat(maybeUser).isPresent();
        assertThat(maybeUser.orElse(null).getEmail()).isEqualTo(user.getEmail());
        assertThat(maybeUser.orElse(null).getResetDate()).isNotNull();
        assertThat(maybeUser.orElse(null).getResetKey()).isNotNull();
    }

    @Test
    @Transactional
    void assertThatOnlyActivatedUserCanRequestPasswordReset() {
        user.setStatus(UserStatus.PENDING);
        savedUser(user);

        Optional<UserDTO> maybeUser = userService.requestPasswordReset(user.getEmail());
        assertThat(maybeUser).isNotPresent();
        userRepository.delete(user);
    }

    @Test
    @Transactional
    void assertThatResetKeyMustNotBeOlderThan24Hours() {
        Instant daysAgo = Instant.now().minus(25, ChronoUnit.HOURS);
        String resetKey = Random.generateResetKey();
        user.setStatus(UserStatus.ACTIVE);
        user.setResetDate(daysAgo);
        user.setResetKey(resetKey);
        savedUser(user);

        Optional<User> maybeUser =
                userService.completePasswordReset("johndoe2", user.getResetKey());
        assertThat(maybeUser).isNotPresent();
        userRepository.delete(user);
    }

    @Test
    @Transactional
    void assertThatResetKeyMustBeValid() {
        Instant daysAgo = Instant.now().minus(25, ChronoUnit.HOURS);
        user.setStatus(UserStatus.ACTIVE);
        user.setResetDate(daysAgo);
        user.setResetKey("1234");
        savedUser(user);

        Optional<User> maybeUser =
                userService.completePasswordReset("johndoe2", user.getResetKey());
        assertThat(maybeUser).isNotPresent();
        userRepository.delete(user);
    }

    @Test
    @Transactional
    void assertThatUserCanResetPassword() {
        Instant daysAgo = Instant.now().minus(2, ChronoUnit.HOURS);
        String resetKey = Random.generateResetKey();
        user.setStatus(UserStatus.ACTIVE);
        user.setResetDate(daysAgo);
        user.setResetKey(resetKey);
        savedUser(user);

        String oldPassword = user.getPasswordHash(UP_AUTH_PROVIDER);

        Optional<User> maybeUser =
                userService.completePasswordReset("johndoe2", user.getResetKey());
        assertThat(maybeUser).isPresent();
        assertThat(maybeUser.orElse(null).getResetDate()).isNull();
        assertThat(maybeUser.orElse(null).getResetKey()).isNull();
        assertThat(maybeUser.orElse(null).getPasswordHash(UP_AUTH_PROVIDER))
                .isNotEqualTo(oldPassword);

        userRepository.delete(user);
    }

    @Test
    @Transactional
    void testFindResourcesWithHighestPermissionsByUserId() {
        User user = userRepository.findOneByEmailIgnoreCase("admin@example.com").orElseThrow();
        // Act - call the method to test
        List<ResourcePermissionDTO> result =
                userService.getResourcesWithPermissionsByUserId(user.getId());

        // Assert - verify results
        assertThat(result).hasSize(6);

        // Check specific permissions
        assertThat(result)
                .extracting("resourceName", "permission")
                .containsExactlyInAnyOrder(
                        Tuple.tuple("teams", "ACCESS"),
                        Tuple.tuple("authorities", "ACCESS"),
                        Tuple.tuple("organizations", "ACCESS"),
                        Tuple.tuple("users", "ACCESS"),
                        Tuple.tuple("workflows", "ACCESS"),
                        Tuple.tuple("mail", "ACCESS"));
    }
}
