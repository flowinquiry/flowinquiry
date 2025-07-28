package io.flowinquiry.modules.usermanagement.controller;

import static io.flowinquiry.modules.usermanagement.domain.UserAuth.UP_AUTH_PROVIDER;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.flowinquiry.it.IntegrationTest;
import io.flowinquiry.it.WithMockFwUser;
import io.flowinquiry.it.WithTestTenant;
import io.flowinquiry.modules.shared.Constants;
import io.flowinquiry.modules.usermanagement.AuthoritiesConstants;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.domain.UserAuth;
import io.flowinquiry.modules.usermanagement.domain.UserStatus;
import io.flowinquiry.modules.usermanagement.repository.AuthorityRepository;
import io.flowinquiry.modules.usermanagement.repository.UserRepository;
import io.flowinquiry.modules.usermanagement.service.UserService;
import io.flowinquiry.modules.usermanagement.service.dto.PasswordChangeDTO;
import io.flowinquiry.modules.usermanagement.service.dto.UserDTO;
import io.flowinquiry.modules.usermanagement.service.mapper.UserMapper;
import java.time.Instant;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;
import org.apache.commons.lang3.RandomStringUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** Integration tests for the {@link UserAccountController} REST controller. */
@AutoConfigureMockMvc
@IntegrationTest
@WithTestTenant
class UserAccountControllerIT {

    static final String TEST_USER_LOGIN_EMAIL = "test@localhost.io";

    @Autowired private ObjectMapper om;

    @Autowired private UserRepository userRepository;

    @Autowired private AuthorityRepository authorityRepository;

    @Autowired private UserService userService;

    @Autowired private UserMapper userMapper;

    @Autowired private PasswordEncoder passwordEncoder;

    @Autowired private MockMvc restAccountMockMvc;

    private Long numberOfUsers;

    @BeforeEach
    public void countUsers() {
        numberOfUsers = userRepository.count();
    }

    @AfterEach
    public void cleanupAndCheck() {
        assertThat(userRepository.count()).isEqualTo(numberOfUsers);
        numberOfUsers = null;
    }

    @Test
    @WithUnauthenticatedMockUser
    void testNonAuthenticatedUser() throws Exception {
        restAccountMockMvc
                .perform(get("/api/authenticate").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().string(""));
    }

    @Test
    @WithMockFwUser(username = TEST_USER_LOGIN_EMAIL)
    void testAuthenticatedUser() throws Exception {
        restAccountMockMvc
                .perform(
                        get("/api/authenticate")
                                .with(request -> request)
                                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().string(TEST_USER_LOGIN_EMAIL));
    }

    @Test
    @WithMockFwUser(username = TEST_USER_LOGIN_EMAIL)
    void testGetExistingAccount() throws Exception {

        UserDTO user = new UserDTO();
        user.setFirstName("john");
        user.setLastName("doe");
        user.setEmail(TEST_USER_LOGIN_EMAIL);
        user.setImageUrl("http://placehold.it/50x50");
        user.setLangKey("en");
        user.setAuthorities(Set.of(AuthoritiesConstants.ADMIN));
        userService.createUser(user);

        restAccountMockMvc
                .perform(get("/api/account").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.firstName").value("john"))
                .andExpect(jsonPath("$.lastName").value("doe"))
                .andExpect(jsonPath("$.email").value(TEST_USER_LOGIN_EMAIL))
                .andExpect(jsonPath("$.imageUrl").value("http://placehold.it/50x50"))
                .andExpect(jsonPath("$.langKey").value("en"))
                .andExpect(jsonPath("$.authorities").value(AuthoritiesConstants.ADMIN));
        userService.deleteUserByEmail(TEST_USER_LOGIN_EMAIL);
    }

    @Test
    void testGetUnknownAccount() throws Exception {
        restAccountMockMvc
                .perform(get("/api/account").accept(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Transactional
    void testRegisterValid() throws Exception {
        ManagedUserVM validUser = new ManagedUserVM();
        validUser.setPassword("password");
        validUser.setFirstName("Alice");
        validUser.setLastName("Test");
        validUser.setEmail("test-register-valid@example.com");
        validUser.setImageUrl("http://placehold.it/50x50");
        validUser.setLangKey(Constants.DEFAULT_LANGUAGE);
        validUser.setAuthorities(Set.of(AuthoritiesConstants.ADMIN));
        assertThat(userRepository.findOneByEmailIgnoreCase("test-register-valid@example.com"))
                .isEmpty();

        restAccountMockMvc
                .perform(
                        post("/api/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(validUser)))
                .andExpect(status().isCreated());

        assertThat(userRepository.findOneByEmailIgnoreCase("test-register-valid@example.com"))
                .isPresent();

        userService.deleteUserByEmail("test-register-valid@example.com");
    }

    @Test
    @Transactional
    void testRegisterValidLogin() throws Exception {
        ManagedUserVM invalidUser = new ManagedUserVM();
        invalidUser.setPassword("password");
        invalidUser.setFirstName("Funky");
        invalidUser.setLastName("One");
        invalidUser.setEmail("funky@example.com");
        invalidUser.setStatus(UserStatus.ACTIVE);
        invalidUser.setImageUrl("http://placehold.it/50x50");
        invalidUser.setLangKey(Constants.DEFAULT_LANGUAGE);
        invalidUser.setAuthorities(Set.of(AuthoritiesConstants.USER));

        restAccountMockMvc
                .perform(
                        post("/api/register")
                                .header(
                                        "X-Tenant-ID",
                                        UUID.fromString("00000000-0000-0000-0000-000000000001"))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(invalidUser)))
                .andExpect(status().isCreated());

        Optional<User> user = userRepository.findOneByEmailIgnoreCase("funky@example.com");
        assertThat(user).isNotEmpty();
        userService.deleteUserByEmail("funky@example.com");
    }

    static Stream<ManagedUserVM> invalidUsers() {
        return Stream.of(
                createInvalidUser(
                        "password", "Bob", "Green", "invalid", UserStatus.ACTIVE), // <-- invalid
                createInvalidUser(
                        "123",
                        "Bob",
                        "Green",
                        "bob@example.com",
                        UserStatus.ACTIVE), // password with only 3 digits
                createInvalidUser(
                        null,
                        "Bob",
                        "Green",
                        "bob@example.com",
                        UserStatus.ACTIVE) // invalid null password
                );
    }

    @ParameterizedTest
    @MethodSource("invalidUsers")
    @Transactional
    void testRegisterInvalidUsers(ManagedUserVM invalidUser) throws Exception {
        restAccountMockMvc
                .perform(
                        post("/api/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(invalidUser)))
                .andExpect(status().isBadRequest());

        Optional<User> user = userRepository.findOneByEmailIgnoreCase("bob");
        assertThat(user).isEmpty();
    }

    private static ManagedUserVM createInvalidUser(
            String password,
            String firstName,
            String lastName,
            String email,
            UserStatus userStatus) {
        ManagedUserVM invalidUser = new ManagedUserVM();
        invalidUser.setPassword(password);
        invalidUser.setFirstName(firstName);
        invalidUser.setLastName(lastName);
        invalidUser.setEmail(email);
        invalidUser.setStatus(userStatus);
        invalidUser.setImageUrl("http://placehold.it/50x50");
        invalidUser.setLangKey(Constants.DEFAULT_LANGUAGE);
        invalidUser.setAuthorities(Set.of(AuthoritiesConstants.USER));
        return invalidUser;
    }

    @Test
    @Transactional
    void testRegisterDuplicateEmail() throws Exception {
        // First user
        ManagedUserVM firstUser = new ManagedUserVM();
        firstUser.setPassword("password");
        firstUser.setFirstName("Alice");
        firstUser.setLastName("Test");
        firstUser.setEmail("test-register-duplicate-email@example.com");
        firstUser.setImageUrl("http://placehold.it/50x50");
        firstUser.setLangKey(Constants.DEFAULT_LANGUAGE);
        firstUser.setAuthorities(Set.of(AuthoritiesConstants.USER));

        // Register first user
        restAccountMockMvc
                .perform(
                        post("/api/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(firstUser)))
                .andExpect(status().isCreated());

        Optional<User> testUser1 =
                userRepository.findOneByEmailIgnoreCase(
                        "test-register-duplicate-email@example.com");
        assertThat(testUser1).isPresent();

        // Duplicate email - with uppercase email address
        ManagedUserVM userWithUpperCaseEmail = new ManagedUserVM();
        userWithUpperCaseEmail.setId(firstUser.getId());
        userWithUpperCaseEmail.setPassword(firstUser.getPassword());
        userWithUpperCaseEmail.setFirstName(firstUser.getFirstName());
        userWithUpperCaseEmail.setLastName(firstUser.getLastName());
        userWithUpperCaseEmail.setEmail("TEST-register-duplicate-email@example.com");
        userWithUpperCaseEmail.setImageUrl(firstUser.getImageUrl());
        userWithUpperCaseEmail.setLangKey(firstUser.getLangKey());
        userWithUpperCaseEmail.setAuthorities(new HashSet<>(firstUser.getAuthorities()));

        // Register third (not activated) user
        restAccountMockMvc
                .perform(
                        post("/api/register")
                                .header(
                                        "X-Tenant-ID",
                                        UUID.fromString("00000000-0000-0000-0000-000000000001"))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(userWithUpperCaseEmail)))
                .andExpect(status().isCreated());

        Optional<User> testUser4 =
                userRepository.findOneByEmailIgnoreCase(
                        "test-register-duplicate-email@example.com");
        assertThat(testUser4).isPresent();
        assertThat(testUser4.orElseThrow().getEmail())
                .isEqualTo("test-register-duplicate-email@example.com");

        testUser4.orElseThrow().setStatus(UserStatus.ACTIVE);
        userService.updateUser(userMapper.toDto(testUser4.orElseThrow()));

        userService.deleteUserByEmail("test-register-duplicate-email@example.com");
    }

    @Test
    @Transactional
    void testRegisterAdminIsIgnored() throws Exception {
        ManagedUserVM validUser = new ManagedUserVM();
        validUser.setPassword("password");
        validUser.setFirstName("Bad");
        validUser.setLastName("Guy");
        validUser.setEmail("badguy@example.com");
        validUser.setStatus(UserStatus.ACTIVE);
        validUser.setImageUrl("http://placehold.it/50x50");
        validUser.setLangKey(Constants.DEFAULT_LANGUAGE);
        validUser.setAuthorities(Set.of(AuthoritiesConstants.USER));

        restAccountMockMvc
                .perform(
                        post("/api/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(validUser)))
                .andExpect(status().isCreated());

        Optional<User> userDup =
                userRepository.findOneWithAuthoritiesByEmailIgnoreCase("badguy@example.com");
        assertThat(userDup).isPresent();
        assertThat(userDup.orElseThrow().getAuthorities())
                .hasSize(1)
                .containsExactly(
                        authorityRepository.findById(AuthoritiesConstants.USER).orElseThrow());

        userService.deleteUserByEmail("badguy@example.com");
    }

    private void savedUser(User user, String password) {
        UserAuth userAuth = new UserAuth();
        userAuth.setUser(user);
        userAuth.setAuthProvider(UP_AUTH_PROVIDER);
        userAuth.setPasswordHash(passwordEncoder.encode(password));
        user.getUserAuths().add(userAuth);
        userRepository.save(user);
    }

    private void savedUser(User user) {
        savedUser(user, RandomStringUtils.secure().nextAlphanumeric(60));
    }

    @Test
    @Transactional
    void testActivateAccount() throws Exception {
        final String activationKey = "some activation key";
        User user = new User();
        user.setEmail("activate-account@example.com");

        user.setStatus(UserStatus.ACTIVE);
        user.setActivationKey(activationKey);
        savedUser(user);

        restAccountMockMvc
                .perform(get("/api/activate?key={activationKey}", activationKey))
                .andExpect(status().isOk());

        user = userRepository.findOneByEmailIgnoreCase(user.getEmail()).orElse(null);
        assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);

        userService.deleteUserByEmail("activate-account@example.com");
    }

    @Test
    @Transactional
    void testActivateAccountWithWrongKey() throws Exception {
        restAccountMockMvc
                .perform(get("/api/activate?key=wrongActivationKey"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @Transactional
    @WithMockFwUser(username = "save-account@example.com")
    void testSaveAccountWithExistingEmail() throws Exception {
        User user = new User();
        user.setEmail("save-account@example.com");
        user.setStatus(UserStatus.ACTIVE);
        savedUser(user);

        UserDTO userDTO = new UserDTO();
        userDTO.setFirstName("firstname");
        userDTO.setLastName("lastname");
        userDTO.setEmail("save-account@example.com");
        userDTO.setStatus(UserStatus.PENDING);
        userDTO.setImageUrl("http://placehold.it/50x50");
        userDTO.setLangKey(Constants.DEFAULT_LANGUAGE);
        userDTO.setAuthorities(Set.of(AuthoritiesConstants.ADMIN));

        restAccountMockMvc
                .perform(
                        post("/api/account")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(userDTO)))
                .andExpect(status().is(200));

        User updatedUser =
                userRepository
                        .findOneWithAuthoritiesByEmailIgnoreCase(user.getEmail())
                        .orElse(null);
        assertThat(updatedUser.getFirstName()).isEqualTo(userDTO.getFirstName());
        assertThat(updatedUser.getLastName()).isEqualTo(userDTO.getLastName());
        assertThat(updatedUser.getEmail()).isEqualTo(userDTO.getEmail());
        assertThat(updatedUser.getLangKey()).isEqualTo(userDTO.getLangKey());
        assertThat(updatedUser.getPasswordHash(UP_AUTH_PROVIDER))
                .isEqualTo(user.getPasswordHash(UP_AUTH_PROVIDER));
        assertThat(updatedUser.getImageUrl()).isEqualTo(userDTO.getImageUrl());
        assertThat(updatedUser.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(updatedUser.getAuthorities()).isEmpty();

        userService.deleteUserByEmail("save-account@example.com");
    }

    @Test
    @Transactional
    @WithMockFwUser(username = "save-invalid-email@example.com")
    void testSaveInvalidEmail() throws Exception {
        User user = new User();
        user.setEmail("save-invalid-email@example.com");
        user.setStatus(UserStatus.ACTIVE);

        savedUser(user);

        UserDTO userDTO = new UserDTO();
        userDTO.setFirstName("firstname");
        userDTO.setLastName("lastname");
        userDTO.setEmail("invalid email");
        userDTO.setStatus(UserStatus.PENDING);
        userDTO.setImageUrl("http://placehold.it/50x50");
        userDTO.setLangKey(Constants.DEFAULT_LANGUAGE);
        userDTO.setAuthorities(Set.of(AuthoritiesConstants.ADMIN));

        restAccountMockMvc
                .perform(
                        post("/api/account")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(userDTO)))
                .andExpect(status().isBadRequest());

        assertThat(userRepository.findOneByEmailIgnoreCase("invalid email")).isNotPresent();

        userService.deleteUserByEmail("save-invalid-email@example.com");
    }

    @Test
    @Transactional
    @WithMockFwUser
    void testSaveExistingEmail() throws Exception {
        User user = new User();
        user.setEmail("save-existing-email@example.com");
        user.setStatus(UserStatus.ACTIVE);
        savedUser(user);

        User anotherUser = new User();
        anotherUser.setEmail("save-existing-email2@example.com");
        anotherUser.setStatus(UserStatus.ACTIVE);

        savedUser(anotherUser);

        UserDTO userDTO = new UserDTO();
        userDTO.setFirstName("firstname");
        userDTO.setLastName("lastname");
        userDTO.setEmail("save-existing-email2@example.com");
        userDTO.setStatus(UserStatus.PENDING);
        userDTO.setImageUrl("http://placehold.it/50x50");
        userDTO.setLangKey(Constants.DEFAULT_LANGUAGE);
        userDTO.setAuthorities(Set.of(AuthoritiesConstants.ADMIN));

        restAccountMockMvc
                .perform(
                        post("/api/account")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(userDTO)))
                .andExpect(status().is(500));

        userService.deleteUserByEmail("save-existing-email@example.com");
        userService.deleteUserByEmail("save-existing-email2@example.com");
    }

    @Test
    @Transactional
    @WithMockFwUser(username = "save-existing-email-and-login@example.com")
    void testSaveExistingEmailAndLogin() throws Exception {
        User user = new User();
        user.setEmail("save-existing-email-and-login@example.com");
        user.setStatus(UserStatus.ACTIVE);
        savedUser(user);

        UserDTO userDTO = new UserDTO();
        userDTO.setFirstName("firstname");
        userDTO.setLastName("lastname");
        userDTO.setEmail("save-existing-email-and-login@example.com");
        userDTO.setStatus(UserStatus.PENDING);
        userDTO.setImageUrl("http://placehold.it/50x50");
        userDTO.setLangKey(Constants.DEFAULT_LANGUAGE);
        userDTO.setAuthorities(Set.of(AuthoritiesConstants.ADMIN));

        restAccountMockMvc
                .perform(
                        post("/api/account")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(userDTO)))
                .andExpect(status().is(200));

        User updatedUser =
                userRepository
                        .findOneByEmailIgnoreCase("save-existing-email-and-login@example.com")
                        .orElse(null);
        assertThat(updatedUser.getEmail()).isEqualTo("save-existing-email-and-login@example.com");

        userService.deleteUserByEmail("save-existing-email-and-login@example.com");
    }

    @Test
    @Transactional
    @WithMockFwUser
    void testChangePasswordWrongExistingPassword() throws Exception {
        User user = new User();
        String currentPassword = RandomStringUtils.randomAlphanumeric(60);
        user.setEmail("change-password-wrong-existing-password@example.com");
        savedUser(user, currentPassword);

        restAccountMockMvc
                .perform(
                        post("/api/account/change-password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        om.writeValueAsBytes(
                                                new PasswordChangeDTO(
                                                        "1" + currentPassword, "new password"))))
                .andExpect(status().isBadRequest());

        User updatedUser =
                userRepository
                        .findOneByEmailIgnoreCase(
                                "change-password-wrong-existing-password@example.com")
                        .orElse(null);
        assertThat(
                        passwordEncoder.matches(
                                "new password", updatedUser.getPasswordHash(UP_AUTH_PROVIDER)))
                .isFalse();
        assertThat(
                        passwordEncoder.matches(
                                currentPassword, updatedUser.getPasswordHash(UP_AUTH_PROVIDER)))
                .isTrue();

        userService.deleteUserByEmail("change-password-wrong-existing-password@example.com");
    }

    @Test
    @Transactional
    @WithMockFwUser(username = "change-password@example.com")
    void testChangePassword() throws Exception {
        User user = new User();
        String currentPassword = RandomStringUtils.randomAlphanumeric(60);
        user.setEmail("change-password@example.com");
        savedUser(user, currentPassword);

        restAccountMockMvc
                .perform(
                        post("/api/account/change-password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        om.writeValueAsBytes(
                                                new PasswordChangeDTO(
                                                        currentPassword, "new password"))))
                .andExpect(status().isOk());

        User updatedUser =
                userRepository.findOneByEmailIgnoreCase("change-password@example.com").orElse(null);
        assertThat(
                        passwordEncoder.matches(
                                "new password", updatedUser.getPasswordHash(UP_AUTH_PROVIDER)))
                .isTrue();

        userService.deleteUserByEmail("change-password@example.com");
    }

    @Test
    @Transactional
    @WithMockFwUser
    void testChangePasswordTooSmall() throws Exception {
        User user = new User();
        String currentPassword = RandomStringUtils.randomAlphanumeric(60);
        user.setEmail("change-password-too-small@example.com");
        savedUser(user, currentPassword);

        String newPassword = RandomStringUtils.random(ManagedUserVM.PASSWORD_MIN_LENGTH - 1);

        restAccountMockMvc
                .perform(
                        post("/api/account/change-password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        om.writeValueAsBytes(
                                                new PasswordChangeDTO(
                                                        currentPassword, newPassword))))
                .andExpect(status().isBadRequest());

        User updatedUser =
                userRepository
                        .findOneByEmailIgnoreCase("change-password-too-small@example.com")
                        .orElse(null);
        assertThat(updatedUser.getPasswordHash(UP_AUTH_PROVIDER))
                .isEqualTo(user.getPasswordHash(UP_AUTH_PROVIDER));

        userService.deleteUserByEmail("change-password-too-small@example.com");
    }

    @Test
    @Transactional
    @WithMockFwUser
    void testChangePasswordTooLong() throws Exception {
        User user = new User();
        String currentPassword = RandomStringUtils.randomAlphanumeric(60);
        user.setEmail("change-password-too-long@example.com");
        savedUser(user, currentPassword);

        String newPassword = RandomStringUtils.random(ManagedUserVM.PASSWORD_MAX_LENGTH + 1);

        restAccountMockMvc
                .perform(
                        post("/api/account/change-password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        om.writeValueAsBytes(
                                                new PasswordChangeDTO(
                                                        currentPassword, newPassword))))
                .andExpect(status().isBadRequest());

        User updatedUser =
                userRepository
                        .findOneByEmailIgnoreCase("change-password-too-long@example.com")
                        .orElse(null);
        assertThat(updatedUser.getPasswordHash(UP_AUTH_PROVIDER))
                .isEqualTo(user.getPasswordHash(UP_AUTH_PROVIDER));

        userService.deleteUserByEmail("change-password-too-long@example.com");
    }

    @Test
    @Transactional
    @WithMockFwUser
    void testChangePasswordEmpty() throws Exception {
        User user = new User();
        String currentPassword = RandomStringUtils.randomAlphanumeric(60);
        user.setEmail("change-password-empty@example.com");
        savedUser(user, currentPassword);

        restAccountMockMvc
                .perform(
                        post("/api/account/change-password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        om.writeValueAsBytes(
                                                new PasswordChangeDTO(currentPassword, ""))))
                .andExpect(status().isBadRequest());

        User updatedUser =
                userRepository
                        .findOneByEmailIgnoreCase("change-password-empty@example.com")
                        .orElse(null);
        assertThat(updatedUser.getPasswordHash(UP_AUTH_PROVIDER))
                .isEqualTo(user.getPasswordHash(UP_AUTH_PROVIDER));

        userService.deleteUserByEmail("change-password-empty@example.com");
    }

    @Test
    @Transactional
    void testRequestPasswordReset() throws Exception {
        User user = new User();
        user.setStatus(UserStatus.ACTIVE);
        user.setEmail("password-reset@example.com");
        user.setLangKey("en");
        savedUser(user);

        restAccountMockMvc
                .perform(get("/api/account/reset-password/init?email=password-reset@example.com"))
                .andExpect(status().isOk());

        userService.deleteUserByEmail("password-reset@example.com");
    }

    @Test
    @Transactional
    void testRequestPasswordResetUpperCaseEmail() throws Exception {
        User user = new User();
        user.setStatus(UserStatus.ACTIVE);
        user.setEmail("password-reset-upper-case@example.com");
        user.setLangKey("en");
        savedUser(user);

        restAccountMockMvc
                .perform(
                        get(
                                "/api/account/reset-password/init?email=password-reset-upper-case@EXAMPLE.COM"))
                .andExpect(status().isOk());

        userService.deleteUserByEmail("password-reset-upper-case@example.com");
    }

    @Test
    void testRequestPasswordResetWrongEmail() throws Exception {
        restAccountMockMvc
                .perform(
                        get(
                                "/api/account/reset-password/init?email=password-reset-wrong-email@example.com"))
                .andExpect(status().isOk());
    }

    @Test
    @Transactional
    void testFinishPasswordReset() throws Exception {
        User user = new User();
        user.setEmail("finish-password-reset@example.com");
        user.setResetDate(Instant.now().plusSeconds(60));
        user.setResetKey("reset key");
        savedUser(user);

        KeyAndPasswordVM keyAndPassword = new KeyAndPasswordVM();
        keyAndPassword.setKey(user.getResetKey());
        keyAndPassword.setNewPassword("new password");

        restAccountMockMvc
                .perform(
                        post("/api/account/reset-password/finish")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(keyAndPassword)))
                .andExpect(status().isOk());

        User updatedUser = userRepository.findOneByEmailIgnoreCase(user.getEmail()).orElse(null);
        assertThat(
                        passwordEncoder.matches(
                                keyAndPassword.getNewPassword(),
                                updatedUser.getPasswordHash(UP_AUTH_PROVIDER)))
                .isTrue();

        userService.deleteUserByEmail("finish-password-reset@example.com");
    }

    @Test
    @Transactional
    void testFinishPasswordResetTooSmall() throws Exception {
        User user = new User();
        user.setEmail("finish-password-reset-too-small@example.com");
        user.setResetDate(Instant.now().plusSeconds(60));
        user.setResetKey("reset key too small");
        savedUser(user);

        KeyAndPasswordVM keyAndPassword = new KeyAndPasswordVM();
        keyAndPassword.setKey(user.getResetKey());
        keyAndPassword.setNewPassword("foo");

        restAccountMockMvc
                .perform(
                        post("/api/account/reset-password/finish")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(keyAndPassword)))
                .andExpect(status().isBadRequest());

        User updatedUser = userRepository.findOneByEmailIgnoreCase(user.getEmail()).orElse(null);
        assertThat(
                        passwordEncoder.matches(
                                keyAndPassword.getNewPassword(),
                                updatedUser.getPasswordHash(UP_AUTH_PROVIDER)))
                .isFalse();

        userService.deleteUserByEmail("finish-password-reset-too-small@example.com");
    }

    @Test
    @Transactional
    void testFinishPasswordResetWrongKey() throws Exception {
        KeyAndPasswordVM keyAndPassword = new KeyAndPasswordVM();
        keyAndPassword.setKey("wrong reset key");
        keyAndPassword.setNewPassword("new password");

        restAccountMockMvc
                .perform(
                        post("/api/account/reset-password/finish")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(keyAndPassword)))
                .andExpect(status().isInternalServerError());
    }
}
