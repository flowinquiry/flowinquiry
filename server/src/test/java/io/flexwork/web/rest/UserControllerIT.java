package io.flexwork.web.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.flexwork.DefaultTenantContext;
import io.flexwork.IntegrationTest;
import io.flexwork.modules.usermanagement.AuthoritiesConstants;
import io.flexwork.modules.usermanagement.domain.User;
import io.flexwork.modules.usermanagement.repository.UserRepository;
import io.flexwork.modules.usermanagement.service.UserService;
import io.flexwork.modules.usermanagement.service.dto.AuthorityDTO;
import io.flexwork.modules.usermanagement.service.dto.UserDTO;
import io.flexwork.modules.usermanagement.service.mapper.UserMapper;
import io.flexwork.modules.usermanagement.web.rest.UserController;
import jakarta.persistence.EntityManager;
import java.util.Collections;
import java.util.List;
import java.util.function.Consumer;
import org.apache.commons.lang3.RandomStringUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** Integration tests for the {@link UserController} REST controller. */
@AutoConfigureMockMvc
@WithMockUser(authorities = AuthoritiesConstants.ADMIN)
@IntegrationTest
@DefaultTenantContext
class UserControllerIT {

    private static final Long DEFAULT_ID = 1L;

    private static final String DEFAULT_PASSWORD = "passjohndoe";
    private static final String UPDATED_PASSWORD = "passflexwork";

    private static final String DEFAULT_EMAIL = "johndoe@localhost.io";
    private static final String UPDATED_EMAIL = "flexwork@localhost.io";

    private static final String DEFAULT_FIRSTNAME = "john";
    private static final String UPDATED_FIRSTNAME = "flexworkFirstName";

    private static final String DEFAULT_LASTNAME = "doe";
    private static final String UPDATED_LASTNAME = "flexworkLastName";

    private static final String DEFAULT_IMAGEURL = "http://placehold.it/50x50";
    private static final String UPDATED_IMAGEURL = "http://placehold.it/40x40";

    private static final String DEFAULT_LANGKEY = "en";
    private static final String UPDATED_LANGKEY = "fr";

    @Autowired private ObjectMapper om;

    @Autowired private UserRepository userRepository;

    @Autowired private UserService userService;

    @Autowired private UserMapper userMapper;

    @Autowired private EntityManager em;

    @Autowired private MockMvc restUserMockMvc;

    private User user;

    private Long numberOfUsers;

    @BeforeEach
    public void countUsers() {
        numberOfUsers = userRepository.count();
    }

    @BeforeEach
    public void initTest() {
        user = initTestUser(em);
    }

    /**
     * Create a User.
     *
     * <p>This is a static method, as tests for other entities might also need it, if they test an
     * entity which has a required relationship to the User entity.
     */
    public static User createEntity(EntityManager em) {
        User persistUser = new User();
        persistUser.setPassword(RandomStringUtils.randomAlphanumeric(60));
        persistUser.setActivated(true);
        persistUser.setEmail(RandomStringUtils.randomAlphabetic(5) + DEFAULT_EMAIL);
        persistUser.setFirstName(DEFAULT_FIRSTNAME);
        persistUser.setLastName(DEFAULT_LASTNAME);
        persistUser.setImageUrl(DEFAULT_IMAGEURL);
        persistUser.setLangKey(DEFAULT_LANGKEY);
        return persistUser;
    }

    /** Setups the database with one user. */
    public static User initTestUser(EntityManager em) {
        User persistUser = createEntity(em);
        persistUser.setEmail(DEFAULT_EMAIL);
        return persistUser;
    }

    @AfterEach
    public void cleanupAndCheck() {
        userService.deleteUserByEmail(DEFAULT_EMAIL);
        userService.deleteUserByEmail(UPDATED_EMAIL);
        userService.deleteUserByEmail("anotherlogin@localhost.io");
        assertThat(userRepository.count()).isEqualTo(numberOfUsers);
        numberOfUsers = null;
    }

    @Test
    @Transactional
    void createUser() throws Exception {
        // Create the User
        UserDTO userDTO = new UserDTO();
        userDTO.setFirstName(DEFAULT_FIRSTNAME);
        userDTO.setLastName(DEFAULT_LASTNAME);
        userDTO.setEmail(DEFAULT_EMAIL);
        userDTO.setActivated(true);
        userDTO.setImageUrl(DEFAULT_IMAGEURL);
        userDTO.setLangKey(DEFAULT_LANGKEY);
        userDTO.setAuthorities(
                Collections.singleton(new AuthorityDTO(AuthoritiesConstants.USER, "User")));

        var returnedUserDTO =
                om.readValue(
                        restUserMockMvc
                                .perform(
                                        post("/api/admin/users")
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(om.writeValueAsBytes(userDTO)))
                                .andExpect(status().isCreated())
                                .andReturn()
                                .getResponse()
                                .getContentAsString(),
                        UserDTO.class);

        User convertedUser = userMapper.toEntity(returnedUserDTO);
        // Validate the returned User
        assertThat(convertedUser.getFirstName()).isEqualTo(DEFAULT_FIRSTNAME);
        assertThat(convertedUser.getLastName()).isEqualTo(DEFAULT_LASTNAME);
        assertThat(convertedUser.getEmail()).isEqualTo(DEFAULT_EMAIL);
        assertThat(convertedUser.getImageUrl()).isEqualTo(DEFAULT_IMAGEURL);
        assertThat(convertedUser.getLangKey()).isEqualTo(DEFAULT_LANGKEY);
    }

    @Test
    @Transactional
    void createUserWithExistingId() throws Exception {
        int databaseSizeBeforeCreate = userRepository.findAll().size();

        UserDTO userDTO = new UserDTO();
        userDTO.setId(DEFAULT_ID);
        userDTO.setFirstName(DEFAULT_FIRSTNAME);
        userDTO.setLastName(DEFAULT_LASTNAME);
        userDTO.setEmail(DEFAULT_EMAIL);
        userDTO.setActivated(true);
        userDTO.setImageUrl(DEFAULT_IMAGEURL);
        userDTO.setLangKey(DEFAULT_LANGKEY);
        userDTO.setAuthorities(
                Collections.singleton(new AuthorityDTO(AuthoritiesConstants.USER, "User")));

        // An entity with an existing ID cannot be created, so this API call must fail
        restUserMockMvc
                .perform(
                        post("/api/admin/users")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(userDTO)))
                .andExpect(status().isBadRequest());

        // Validate the User in the database
        assertPersistedUsers(users -> assertThat(users).hasSize(databaseSizeBeforeCreate));
    }

    @Test
    @Transactional
    void createUserWithExistingLogin() throws Exception {
        // Initialize the database
        userRepository.saveAndFlush(user);
        int databaseSizeBeforeCreate = userRepository.findAll().size();

        UserDTO userDTO = new UserDTO();
        userDTO.setFirstName(DEFAULT_FIRSTNAME);
        userDTO.setLastName(DEFAULT_LASTNAME);
        userDTO.setEmail(DEFAULT_EMAIL);
        userDTO.setActivated(true);
        userDTO.setImageUrl(DEFAULT_IMAGEURL);
        userDTO.setLangKey(DEFAULT_LANGKEY);
        userDTO.setAuthorities(
                Collections.singleton(new AuthorityDTO(AuthoritiesConstants.USER, "User")));

        // Create the User
        restUserMockMvc
                .perform(
                        post("/api/admin/users")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(userDTO)))
                .andExpect(status().isBadRequest());

        // Validate the User in the database
        assertPersistedUsers(users -> assertThat(users).hasSize(databaseSizeBeforeCreate));
    }

    @Test
    @Transactional
    void createUserWithExistingEmail() throws Exception {
        // Initialize the database
        userRepository.saveAndFlush(user);
        int databaseSizeBeforeCreate = userRepository.findAll().size();

        UserDTO userDTO = new UserDTO();
        userDTO.setFirstName(DEFAULT_FIRSTNAME);
        userDTO.setLastName(DEFAULT_LASTNAME);
        userDTO.setEmail(DEFAULT_EMAIL); // this email should already be used
        userDTO.setActivated(true);
        userDTO.setImageUrl(DEFAULT_IMAGEURL);
        userDTO.setLangKey(DEFAULT_LANGKEY);
        userDTO.setAuthorities(
                Collections.singleton(new AuthorityDTO(AuthoritiesConstants.USER, "User")));

        // Create the User
        restUserMockMvc
                .perform(
                        post("/api/admin/users")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(userDTO)))
                .andExpect(status().isBadRequest());

        // Validate the User in the database
        assertPersistedUsers(users -> assertThat(users).hasSize(databaseSizeBeforeCreate));
    }

    @Test
    @Transactional
    void searchAllUsers() throws Exception {
        // Initialize the database
        userRepository.saveAndFlush(user);

        // Get all the users
        restUserMockMvc
                .perform(
                        post("/api/admin/users/search?sort=id,desc")
                                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.[*].firstName").value(hasItem(DEFAULT_FIRSTNAME)))
                .andExpect(jsonPath("$.[*].lastName").value(hasItem(DEFAULT_LASTNAME)))
                .andExpect(jsonPath("$.[*].email").value(hasItem(DEFAULT_EMAIL)))
                .andExpect(jsonPath("$.[*].imageUrl").value(hasItem(DEFAULT_IMAGEURL)))
                .andExpect(jsonPath("$.[*].langKey").value(hasItem(DEFAULT_LANGKEY)));
    }

    @Test
    @Transactional
    void getUser() throws Exception {
        // Initialize the database
        userRepository.saveAndFlush(user);

        // Get the user
        restUserMockMvc
                .perform(get("/api/users/{userId}", user.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.firstName").value(DEFAULT_FIRSTNAME))
                .andExpect(jsonPath("$.lastName").value(DEFAULT_LASTNAME))
                .andExpect(jsonPath("$.email").value(DEFAULT_EMAIL))
                .andExpect(jsonPath("$.imageUrl").value(DEFAULT_IMAGEURL))
                .andExpect(jsonPath("$.langKey").value(DEFAULT_LANGKEY));
    }

    @Test
    @Transactional
    void updateUser() throws Exception {
        // Initialize the database
        userRepository.saveAndFlush(user);
        int databaseSizeBeforeUpdate = userRepository.findAll().size();

        User updatedUser = userRepository.findById(user.getId()).orElseThrow();

        UserDTO userDTO = getAdminUserDTO(updatedUser);

        MockMultipartFile userDTOFile =
                new MockMultipartFile(
                        "userDTO",
                        "userDTO.json",
                        MediaType.APPLICATION_JSON_VALUE,
                        om.writeValueAsBytes(userDTO));

        restUserMockMvc
                .perform(
                        multipart("/api/admin/users")
                                .file(userDTOFile)
                                .contentType(MediaType.MULTIPART_FORM_DATA_VALUE)
                                .with(
                                        request -> {
                                            request.setMethod("PUT");
                                            return request;
                                        }))
                .andExpect(status().isOk());

        // Validate the User in the database
        assertPersistedUsers(
                users -> {
                    assertThat(users).hasSize(databaseSizeBeforeUpdate);
                    User testUser =
                            users.stream()
                                    .filter(usr -> usr.getId().equals(updatedUser.getId()))
                                    .findFirst()
                                    .orElseThrow();
                    assertThat(testUser.getFirstName()).isEqualTo(UPDATED_FIRSTNAME);
                    assertThat(testUser.getLastName()).isEqualTo(UPDATED_LASTNAME);
                    assertThat(testUser.getEmail()).isEqualTo(UPDATED_EMAIL);
                    assertThat(testUser.getImageUrl()).isEqualTo(UPDATED_IMAGEURL);
                    assertThat(testUser.getLangKey()).isEqualTo(UPDATED_LANGKEY);
                });
    }

    private static UserDTO getAdminUserDTO(User updatedUser) {
        UserDTO userDTO = new UserDTO();
        userDTO.setId(updatedUser.getId());
        userDTO.setFirstName(UPDATED_FIRSTNAME);
        userDTO.setLastName(UPDATED_LASTNAME);
        userDTO.setEmail(UPDATED_EMAIL);
        userDTO.setActivated(updatedUser.isActivated());
        userDTO.setImageUrl(UPDATED_IMAGEURL);
        userDTO.setLangKey(UPDATED_LANGKEY);
        userDTO.setCreatedBy(updatedUser.getCreatedBy());
        userDTO.setCreatedAt(updatedUser.getCreatedAt());
        userDTO.setLastModifiedBy(updatedUser.getModifiedBy());
        userDTO.setModifiedAt(updatedUser.getModifiedAt());
        userDTO.setAuthorities(
                Collections.singleton(new AuthorityDTO(AuthoritiesConstants.USER, "User")));
        return userDTO;
    }

    @Test
    @Transactional
    void updateUserLogin() throws Exception {
        // Initialize the database
        userRepository.saveAndFlush(user);
        int databaseSizeBeforeUpdate = userRepository.findAll().size();

        // Update the user
        User updatedUser = userRepository.findById(user.getId()).orElseThrow();

        UserDTO userDTO = new UserDTO();
        userDTO.setId(updatedUser.getId());
        userDTO.setFirstName(UPDATED_FIRSTNAME);
        userDTO.setLastName(UPDATED_LASTNAME);
        userDTO.setEmail(UPDATED_EMAIL);
        userDTO.setActivated(updatedUser.isActivated());
        userDTO.setImageUrl(UPDATED_IMAGEURL);
        userDTO.setLangKey(UPDATED_LANGKEY);
        userDTO.setCreatedBy(updatedUser.getCreatedBy());
        userDTO.setCreatedAt(updatedUser.getCreatedAt());
        userDTO.setLastModifiedBy(updatedUser.getModifiedBy());
        userDTO.setModifiedAt(updatedUser.getModifiedAt());
        userDTO.setAuthorities(
                Collections.singleton(new AuthorityDTO(AuthoritiesConstants.USER, "User")));

        MockMultipartFile userDTOFile =
                new MockMultipartFile(
                        "userDTO",
                        "userDTO.json",
                        MediaType.APPLICATION_JSON_VALUE,
                        om.writeValueAsBytes(userDTO));

        restUserMockMvc
                .perform(
                        multipart("/api/admin/users")
                                .file(userDTOFile)
                                .contentType(MediaType.MULTIPART_FORM_DATA_VALUE)
                                .with(
                                        request -> {
                                            request.setMethod("PUT"); // Force PUT instead of POST
                                            return request;
                                        }))
                .andExpect(status().isOk());

        // Validate the User in the database
        assertPersistedUsers(
                users -> {
                    assertThat(users).hasSize(databaseSizeBeforeUpdate);
                    User testUser =
                            users.stream()
                                    .filter(usr -> usr.getId().equals(updatedUser.getId()))
                                    .findFirst()
                                    .orElseThrow();
                    assertThat(testUser.getFirstName()).isEqualTo(UPDATED_FIRSTNAME);
                    assertThat(testUser.getLastName()).isEqualTo(UPDATED_LASTNAME);
                    assertThat(testUser.getEmail()).isEqualTo(UPDATED_EMAIL);
                    assertThat(testUser.getImageUrl()).isEqualTo(UPDATED_IMAGEURL);
                    assertThat(testUser.getLangKey()).isEqualTo(UPDATED_LANGKEY);
                });
    }

    @Test
    @Transactional
    void updateUserExistingEmail() throws Exception {
        // Initialize the database with 2 users
        userRepository.saveAndFlush(user);

        User anotherUser = new User();
        anotherUser.setPassword(RandomStringUtils.randomAlphanumeric(60));
        anotherUser.setActivated(true);
        anotherUser.setEmail(UPDATED_EMAIL);
        anotherUser.setFirstName("java");
        anotherUser.setLastName("hipster");
        anotherUser.setImageUrl("");
        anotherUser.setLangKey("en");
        userRepository.saveAndFlush(anotherUser);

        // Update the user
        User updatedUser = userRepository.findById(user.getId()).orElseThrow();

        UserDTO userDTO = new UserDTO();
        userDTO.setId(updatedUser.getId());
        userDTO.setFirstName(updatedUser.getFirstName());
        userDTO.setLastName(updatedUser.getLastName());
        userDTO.setEmail(UPDATED_EMAIL); // this email should already be used by anotherUser
        userDTO.setActivated(updatedUser.isActivated());
        userDTO.setImageUrl(updatedUser.getImageUrl());
        userDTO.setLangKey(updatedUser.getLangKey());
        userDTO.setCreatedBy(updatedUser.getCreatedBy());
        userDTO.setCreatedAt(updatedUser.getCreatedAt());
        userDTO.setLastModifiedBy(updatedUser.getModifiedBy());
        userDTO.setModifiedAt(updatedUser.getModifiedAt());
        userDTO.setAuthorities(
                Collections.singleton(new AuthorityDTO(AuthoritiesConstants.USER, "User")));

        MockMultipartFile userDTOFile =
                new MockMultipartFile(
                        "userDTO",
                        "userDTO.json",
                        MediaType.APPLICATION_JSON_VALUE,
                        om.writeValueAsBytes(userDTO));

        restUserMockMvc
                .perform(
                        multipart("/api/admin/users")
                                .file(userDTOFile)
                                .contentType(MediaType.MULTIPART_FORM_DATA_VALUE)
                                .with(
                                        request -> {
                                            request.setMethod("PUT");
                                            return request;
                                        }))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Transactional
    void deleteUser() throws Exception {
        // Initialize the database
        userRepository.saveAndFlush(user);
        int databaseSizeBeforeDelete = userRepository.findAll().size();

        // Delete the user
        restUserMockMvc
                .perform(
                        delete("/api/admin/users/{login}", user.getEmail())
                                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());

        // Validate the database is empty
        assertPersistedUsers(users -> assertThat(users).hasSize(databaseSizeBeforeDelete - 1));
    }

    @Test
    void testUserEquals() throws Exception {
        User user1 = new User();
        user1.setId(DEFAULT_ID);
        User user2 = new User();
        user2.setId(user1.getId());
        assertThat(user1).isEqualTo(user2);
        user2.setId(2L);
        assertThat(user1).isNotEqualTo(user2);
        user1.setId(null);
        assertThat(user1).isNotEqualTo(user2);
    }

    private void assertPersistedUsers(Consumer<List<User>> userAssertion) {
        userAssertion.accept(userRepository.findAll());
    }
}
