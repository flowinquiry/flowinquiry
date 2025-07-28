package io.flowinquiry.modules.usermanagement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

import io.flowinquiry.it.IntegrationTest;
import io.flowinquiry.modules.usermanagement.domain.Authority;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.repository.AuthorityRepository;
import io.flowinquiry.modules.usermanagement.repository.UserRepository;
import io.flowinquiry.modules.usermanagement.service.dto.AuthorityDTO;
import io.flowinquiry.modules.usermanagement.service.dto.UserDTO;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

/** Integration tests for {@link AuthorityService}. */
@IntegrationTest
@Transactional
class AuthorityServiceIT {

    private static final String TEST_AUTHORITY_NAME = "TEST_AUTHORITY";
    private static final String TEST_AUTHORITY_DESC_NAME = "Test Authority";
    private static final String TEST_AUTHORITY_DESCRIPTION = "Test authority description";
    private static final String UPDATED_AUTHORITY_DESC_NAME = "Updated Test Authority";
    private static final String UPDATED_AUTHORITY_DESCRIPTION =
            "Updated test authority description";

    @Autowired private AuthorityRepository authorityRepository;

    @Autowired private UserRepository userRepository;

    @Autowired private AuthorityService authorityService;

    private Authority testAuthority;
    private User adminUser;

    @BeforeEach
    public void setup() {
        // Find the admin user for testing user-authority operations
        adminUser = userRepository.findOneByEmailIgnoreCase("admin@flowinquiry.io").orElseThrow();

        // Create a test authority
        testAuthority = new Authority();
        testAuthority.setName(TEST_AUTHORITY_NAME);
        testAuthority.setDescriptiveName(TEST_AUTHORITY_DESC_NAME);
        testAuthority.setDescription(TEST_AUTHORITY_DESCRIPTION);
        testAuthority.setSystemRole(false);
    }

    @AfterEach
    public void cleanup() {
        // Clean up the test authority if it exists
        authorityRepository
                .findById(TEST_AUTHORITY_NAME)
                .ifPresent(
                        authority -> {
                            // Remove all users from the authority first
                            authorityRepository.removeAllUsersFromAuthority(TEST_AUTHORITY_NAME);
                            // Delete the authority
                            authorityRepository.deleteById(TEST_AUTHORITY_NAME);
                        });
    }

    @Test
    @Transactional
    void testCreateAuthority() {
        // Count authorities before
        long countBefore = authorityRepository.count();

        // Create the authority
        AuthorityDTO result = authorityService.createAuthority(testAuthority);

        // Verify the result
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo(TEST_AUTHORITY_NAME);
        assertThat(result.getDescriptiveName()).isEqualTo(TEST_AUTHORITY_DESC_NAME);
        assertThat(result.getDescription()).isEqualTo(TEST_AUTHORITY_DESCRIPTION);
        assertThat(result.isSystemRole()).isFalse();

        // Verify it was saved to the database
        assertThat(authorityRepository.count()).isEqualTo(countBefore + 1);
        Optional<Authority> savedAuthority = authorityRepository.findById(TEST_AUTHORITY_NAME);
        assertThat(savedAuthority).isPresent();
        assertThat(savedAuthority.get().getName()).isEqualTo(TEST_AUTHORITY_NAME);
        assertThat(savedAuthority.get().getDescriptiveName()).isEqualTo(TEST_AUTHORITY_DESC_NAME);
        assertThat(savedAuthority.get().getDescription()).isEqualTo(TEST_AUTHORITY_DESCRIPTION);
        assertThat(savedAuthority.get().getSystemRole()).isFalse();
    }

    @Test
    @Transactional
    void testUpdateAuthority() {
        // Save the authority first
        authorityRepository.save(testAuthority);

        // Update the authority
        testAuthority.setDescriptiveName(UPDATED_AUTHORITY_DESC_NAME);
        testAuthority.setDescription(UPDATED_AUTHORITY_DESCRIPTION);
        Authority updatedAuthority = authorityService.updateAuthority(testAuthority);

        // Verify the result
        assertThat(updatedAuthority).isNotNull();
        assertThat(updatedAuthority.getName()).isEqualTo(TEST_AUTHORITY_NAME);
        assertThat(updatedAuthority.getDescriptiveName()).isEqualTo(UPDATED_AUTHORITY_DESC_NAME);
        assertThat(updatedAuthority.getDescription()).isEqualTo(UPDATED_AUTHORITY_DESCRIPTION);

        // Verify it was updated in the database
        Optional<Authority> savedAuthority = authorityRepository.findById(TEST_AUTHORITY_NAME);
        assertThat(savedAuthority).isPresent();
        assertThat(savedAuthority.get().getDescriptiveName())
                .isEqualTo(UPDATED_AUTHORITY_DESC_NAME);
        assertThat(savedAuthority.get().getDescription()).isEqualTo(UPDATED_AUTHORITY_DESCRIPTION);
    }

    @Test
    @Transactional
    void testUpdateNonExistingAuthority() {
        // Try to update a non-existing authority
        Authority nonExistingAuthority = new Authority();
        nonExistingAuthority.setName("NON_EXISTING");
        nonExistingAuthority.setDescriptiveName("Non Existing");
        nonExistingAuthority.setDescription("This authority does not exist");
        nonExistingAuthority.setSystemRole(false);

        // Verify that an exception is thrown
        assertThatExceptionOfType(IllegalArgumentException.class)
                .isThrownBy(() -> authorityService.updateAuthority(nonExistingAuthority))
                .withMessageContaining("Authority not found");
    }

    @Test
    @Transactional
    void testDeleteAuthority() {
        // Save the authority first
        authorityRepository.save(testAuthority);

        // Verify it exists
        assertThat(authorityRepository.findById(TEST_AUTHORITY_NAME)).isPresent();

        // Delete the authority
        authorityService.deleteAuthority(TEST_AUTHORITY_NAME);

        // Verify it was deleted
        assertThat(authorityRepository.findById(TEST_AUTHORITY_NAME)).isNotPresent();
    }

    @Test
    @Transactional
    void testFindAuthorityByName() {
        // Save the authority first
        authorityRepository.save(testAuthority);

        // Find the authority by name
        Optional<AuthorityDTO> foundAuthority =
                authorityService.findAuthorityByName(TEST_AUTHORITY_NAME);

        // Verify the result
        assertThat(foundAuthority).isPresent();
        assertThat(foundAuthority.get().getName()).isEqualTo(TEST_AUTHORITY_NAME);
        assertThat(foundAuthority.get().getDescriptiveName()).isEqualTo(TEST_AUTHORITY_DESC_NAME);
        assertThat(foundAuthority.get().getDescription()).isEqualTo(TEST_AUTHORITY_DESCRIPTION);
    }

    @Test
    @Transactional
    void testFindAllAuthorities() {
        // Save the authority first
        authorityRepository.save(testAuthority);

        // Find all authorities
        Pageable pageable = PageRequest.of(0, 10);
        Page<AuthorityDTO> authorities = authorityService.findAllAuthorities(pageable);

        // Verify the result
        assertThat(authorities).isNotNull();
        assertThat(authorities.getContent()).isNotEmpty();
        // Verify our test authority is in the list
        assertThat(
                        authorities.getContent().stream()
                                .anyMatch(a -> a.getName().equals(TEST_AUTHORITY_NAME)))
                .isTrue();
    }

    @Test
    @Transactional
    void testAddUsersToAuthority() {
        // Save the authority first
        authorityRepository.save(testAuthority);

        // Add the admin user to the authority
        List<Long> userIds = new ArrayList<>();
        userIds.add(adminUser.getId());
        authorityService.addUsersToAuthority(userIds, TEST_AUTHORITY_NAME);

        // Verify the user was added to the authority
        User updatedUser = userRepository.findById(adminUser.getId()).orElseThrow();
        assertThat(
                        updatedUser.getAuthorities().stream()
                                .anyMatch(a -> a.getName().equals(TEST_AUTHORITY_NAME)))
                .isTrue();
    }

    @Test
    @Transactional
    void testRemoveUserFromAuthority() {
        // Save the authority first
        authorityRepository.save(testAuthority);

        // Add the admin user to the authority
        List<Long> userIds = new ArrayList<>();
        userIds.add(adminUser.getId());
        authorityService.addUsersToAuthority(userIds, TEST_AUTHORITY_NAME);

        // Verify the user was added to the authority
        User updatedUser = userRepository.findById(adminUser.getId()).orElseThrow();
        assertThat(
                        updatedUser.getAuthorities().stream()
                                .anyMatch(a -> a.getName().equals(TEST_AUTHORITY_NAME)))
                .isTrue();

        // Remove the user from the authority
        authorityService.removeUserFromAuthority(adminUser.getId(), TEST_AUTHORITY_NAME);

        // Verify the user was removed from the authority
        updatedUser = userRepository.findById(adminUser.getId()).orElseThrow();
        assertThat(
                        updatedUser.getAuthorities().stream()
                                .anyMatch(a -> a.getName().equals(TEST_AUTHORITY_NAME)))
                .isFalse();
    }

    @Test
    @Transactional
    void testFindAllUsersByAuthority() {
        // Save the authority first
        authorityRepository.save(testAuthority);

        // Add the admin user to the authority
        List<Long> userIds = new ArrayList<>();
        userIds.add(adminUser.getId());
        authorityService.addUsersToAuthority(userIds, TEST_AUTHORITY_NAME);

        //         Find all users by authority
        Pageable pageable = PageRequest.of(0, 10);
        Page<UserDTO> users =
                authorityService.findAllUsersByAuthority(TEST_AUTHORITY_NAME, pageable);

        // Verify the result
        assertThat(users).isNotNull();
        assertThat(users.getContent()).isNotEmpty();
        assertThat(users.getContent().stream().anyMatch(u -> u.getId().equals(adminUser.getId())))
                .isTrue();
    }

    @Test
    @Transactional
    void testFindUsersNotInAuthority() {
        // Save the authority first
        authorityRepository.save(testAuthority);

        // Find users not in the authority with an empty search term
        Pageable pageable = PageRequest.of(0, 10);
        List<UserDTO> users =
                authorityService.findUsersNotInAuthority("", TEST_AUTHORITY_NAME, pageable);

        // Verify the result
        assertThat(users).isNotNull();
        assertThat(users).isNotEmpty();
        // The admin user should be in the list since we haven't added them to the authority yet
        assertThat(users.stream().anyMatch(u -> u.getId().equals(adminUser.getId()))).isTrue();

        // Add the admin user to the authority
        List<Long> userIds = new ArrayList<>();
        userIds.add(adminUser.getId());
        authorityService.addUsersToAuthority(userIds, TEST_AUTHORITY_NAME);

        // Find users not in the authority again
        users = authorityService.findUsersNotInAuthority("", TEST_AUTHORITY_NAME, pageable);

        // Verify the admin user is no longer in the list
        assertThat(users.stream().anyMatch(u -> u.getId().equals(adminUser.getId()))).isFalse();
    }
}
