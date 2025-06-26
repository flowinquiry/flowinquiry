package io.flowinquiry.modules.usermanagement.controller;

import static io.flowinquiry.modules.usermanagement.domain.UserAuth.UP_AUTH_PROVIDER;
import static org.hamcrest.Matchers.emptyString;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.flowinquiry.IntegrationTest;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.domain.UserAuth;
import io.flowinquiry.modules.usermanagement.domain.UserStatus;
import io.flowinquiry.modules.usermanagement.repository.UserAuthRepository;
import io.flowinquiry.modules.usermanagement.repository.UserRepository;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** Integration tests for the {@link AuthenticateController} REST controller. */
@AutoConfigureMockMvc
@IntegrationTest
class AuthenticateControllerIT {

    @Autowired private ObjectMapper om;

    @Autowired private UserRepository userRepository;

    @Autowired private UserAuthRepository userAuthRepository;

    @Autowired private PasswordEncoder passwordEncoder;

    @Autowired private MockMvc mockMvc;

    private void savedUser(User user, String password) {
        UserAuth userAuth = new UserAuth();
        userAuth.setUser(user);
        userAuth.setAuthProvider(UP_AUTH_PROVIDER);
        userAuth.setPasswordHash(passwordEncoder.encode(password));

        user.setUserAuths(Set.of(userAuth));
        userRepository.save(user);
    }

    @Transactional
    @ParameterizedTest
    @CsvSource({"admin@flowinquiry.io, admin", "bob.brown@flowinquiry.io, user1234"})
    void shouldAuthorizeUserSuccessfully(String email, String password) throws Exception {
        LoginVM login = new LoginVM();
        login.setEmail(email);
        login.setPassword(password);

        mockMvc.perform(
                        post("/api/authenticate")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id_token").isString())
                .andExpect(jsonPath("$.id_token").isNotEmpty())
                .andExpect(header().string("Authorization", not(nullValue())))
                .andExpect(header().string("Authorization", not(is(emptyString()))));
    }

    @Transactional
    @Test
    void testAuthorizeWithRememberMe() throws Exception {
        User user = new User();
        user.setEmail("user-jwt-controller-remember-me@example.com");
        user.setStatus(UserStatus.ACTIVE);

        savedUser(user, "test");

        LoginVM login = new LoginVM();
        login.setEmail("user-jwt-controller-remember-me@example.com");
        login.setPassword("test");
        login.setRememberMe(true);
        mockMvc.perform(
                        post("/api/authenticate")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id_token").isString())
                .andExpect(jsonPath("$.id_token").isNotEmpty())
                .andExpect(header().string("Authorization", not(nullValue())))
                .andExpect(header().string("Authorization", not(is(emptyString()))));
    }

    @Test
    void testAuthorizeFails() throws Exception {
        LoginVM login = new LoginVM();
        login.setEmail("wrong-user@example.com");
        login.setPassword("wrong password");
        mockMvc.perform(
                        post("/api/authenticate")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(login)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.id_token").doesNotExist())
                .andExpect(header().doesNotExist("Authorization"));
    }
}
