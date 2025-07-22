package io.flowinquiry.modules.usermanagement.service;

import static io.flowinquiry.modules.usermanagement.domain.UserAuth.UP_AUTH_PROVIDER;
import static io.flowinquiry.query.QueryUtils.createSpecification;

import io.flowinquiry.exceptions.ResourceNotFoundException;
import io.flowinquiry.modules.usermanagement.AuthoritiesConstants;
import io.flowinquiry.modules.usermanagement.EmailAlreadyUsedException;
import io.flowinquiry.modules.usermanagement.InvalidPasswordException;
import io.flowinquiry.modules.usermanagement.domain.Authority;
import io.flowinquiry.modules.usermanagement.domain.Permission;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.domain.UserAuth;
import io.flowinquiry.modules.usermanagement.domain.UserStatus;
import io.flowinquiry.modules.usermanagement.domain.User_;
import io.flowinquiry.modules.usermanagement.repository.AuthorityRepository;
import io.flowinquiry.modules.usermanagement.repository.UserAuthRepository;
import io.flowinquiry.modules.usermanagement.repository.UserRepository;
import io.flowinquiry.modules.usermanagement.service.dto.ResourcePermissionDTO;
import io.flowinquiry.modules.usermanagement.service.dto.UserDTO;
import io.flowinquiry.modules.usermanagement.service.dto.UserHierarchyDTO;
import io.flowinquiry.modules.usermanagement.service.dto.UserKey;
import io.flowinquiry.modules.usermanagement.service.event.CreatedUserEvent;
import io.flowinquiry.modules.usermanagement.service.event.DeleteUserEvent;
import io.flowinquiry.modules.usermanagement.service.mapper.UserMapper;
import io.flowinquiry.query.QueryDTO;
import io.flowinquiry.security.SecurityUtils;
import io.flowinquiry.utils.Random;
import jakarta.persistence.EntityNotFoundException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Service class for managing users. */
@Service
@Transactional
public class UserService {

    private static final Logger LOG = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;

    private final UserAuthRepository userAuthRepository;

    private final PasswordEncoder passwordEncoder;

    private final AuthorityRepository authorityRepository;

    private final UserMapper userMapper;

    private final ApplicationEventPublisher eventPublisher;

    public UserService(
            UserRepository userRepository,
            UserAuthRepository userAuthRepository,
            PasswordEncoder passwordEncoder,
            AuthorityRepository authorityRepository,
            UserMapper userMapper,
            ApplicationEventPublisher eventPublisher) {
        this.userRepository = userRepository;
        this.userAuthRepository = userAuthRepository;
        this.passwordEncoder = passwordEncoder;
        this.authorityRepository = authorityRepository;
        this.userMapper = userMapper;
        this.eventPublisher = eventPublisher;
    }

    public Optional<User> activateRegistration(String key) {
        LOG.debug("Activating user for activation key {}", key);
        return userRepository
                .findOneByActivationKey(key)
                .map(
                        user -> {
                            // activate given user for the registration key.
                            user.setStatus(UserStatus.ACTIVE);
                            user.setActivationKey(null);
                            LOG.debug("Activated user: {}", user);
                            return user;
                        });
    }

    public Optional<User> completePasswordReset(String newPassword, String key) {
        LOG.debug("Reset user password for reset key {}", key);

        return userRepository
                .findOneByResetKey(key)
                .filter(
                        user ->
                                user.getResetDate() != null
                                        && user.getResetDate()
                                                .isAfter(Instant.now().minus(1, ChronoUnit.DAYS)))
                .map(
                        user -> {
                            // Find the FwUserAuth record for UsernameAndPAssword authentication
                            user.getUserAuths().stream()
                                    .filter(
                                            auth ->
                                                    UP_AUTH_PROVIDER.equalsIgnoreCase(
                                                            auth.getAuthProvider()))
                                    .findFirst()
                                    .ifPresent(
                                            auth -> {
                                                auth.setPasswordHash(
                                                        passwordEncoder.encode(newPassword));
                                                userAuthRepository.save(auth);
                                            });

                            // Update user details
                            user.setStatus(UserStatus.ACTIVE);
                            user.setResetKey(null);
                            user.setResetDate(null);

                            // Save changes to the user
                            userRepository.save(user);

                            LOG.debug("Password reset successfully for user: {}", user.getEmail());
                            return user;
                        });
    }

    public Optional<UserDTO> requestPasswordReset(String mail) {
        return userRepository
                .findOneByEmailIgnoreCase(mail)
                .filter(user -> Objects.equals(user.getStatus(), UserStatus.ACTIVE))
                .map(
                        user -> {
                            user.setResetKey(Random.generateResetKey());
                            user.setResetDate(Instant.now());
                            return user;
                        })
                .map(userMapper::toDto);
    }

    public User registerUser(UserDTO userDTO, String password) {
        // Check if email is already registered
        userRepository
                .findOneByEmailIgnoreCase(userDTO.getEmail())
                .ifPresent(
                        existingUser -> {
                            boolean removed = removeNonActivatedUser(existingUser);
                            if (!removed) {
                                throw new EmailAlreadyUsedException();
                            }
                        });

        // Create new user
        User newUser = new User();
        newUser.setFirstName(userDTO.getFirstName());
        newUser.setLastName(userDTO.getLastName());
        if (userDTO.getEmail() != null) {
            newUser.setEmail(userDTO.getEmail().toLowerCase());
        }
        newUser.setImageUrl(userDTO.getImageUrl());
        newUser.setLangKey(userDTO.getLangKey());
        newUser.setStatus(UserStatus.PENDING); // New user is not active
        newUser.setActivationKey(Random.generateActivationKey()); // Registration key

        // Assign default authority
        Set<Authority> authorities = new HashSet<>();
        authorityRepository.findById(AuthoritiesConstants.USER).ifPresent(authorities::add);
        newUser.setAuthorities(authorities);

        // Create and save the corresponding FwUserAuth record for username and password
        // authentication
        String encryptedPassword = passwordEncoder.encode(password);
        UserAuth userAuth = new UserAuth();
        userAuth.setUser(newUser);
        userAuth.setAuthProvider(UP_AUTH_PROVIDER);
        userAuth.setPasswordHash(encryptedPassword);
        newUser.getUserAuths().add(userAuth);

        // Save the user
        userRepository.save(newUser);

        LOG.debug("Created Information for User: {}", newUser);
        return newUser;
    }

    private boolean removeNonActivatedUser(User existingUser) {
        if (existingUser.getStatus().equals(UserStatus.ACTIVE)) {
            return false;
        }
        userRepository.delete(existingUser);
        userRepository.flush();
        return true;
    }

    public UserDTO createUser(UserDTO userDTO) {
        User user = userMapper.toEntity(userDTO);

        user.setResetKey(Random.generateResetKey());
        user.setResetDate(Instant.now());
        user.setStatus(UserStatus.PENDING);

        // Due to client when construct the authority, it passes the Authority object
        // with the name
        // and descriptiveName have both actual value
        // is descriptiveName, so we must mapping the authority by search authority by
        // descriptive
        // name
        if (userDTO.getAuthorities() != null) {
            Set<Authority> authorities =
                    userDTO.getAuthorities().stream()
                            .map(authorityRepository::findById)
                            .filter(Optional::isPresent)
                            .map(Optional::get)
                            .collect(Collectors.toSet());
            user.setAuthorities(authorities);
        }
        String encryptedPassword = passwordEncoder.encode(Random.generatePassword());
        UserAuth userAuth = new UserAuth();
        userAuth.setUser(user);
        userAuth.setAuthProvider(UP_AUTH_PROVIDER);
        userAuth.setPasswordHash(encryptedPassword);

        Set<UserAuth> userAuths = new HashSet<>();
        userAuths.add(userAuth);
        user.setUserAuths(userAuths);

        userRepository.save(user);
        LOG.debug("Created Information for User: {}", user);

        UserDTO savedUser = userMapper.toDto(user);
        eventPublisher.publishEvent(new CreatedUserEvent(this, savedUser));
        return savedUser;
    }

    /**
     * Update all information for a specific user, and return the modified user.
     *
     * @param userDTO user to update.
     * @return updated user.
     */
    public UserDTO updateUser(UserDTO userDTO) {
        User existingUser =
                userRepository
                        .findById(userDTO.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        userMapper.updateEntity(userDTO, existingUser);
        Set<Authority> managedAuthorities = existingUser.getAuthorities();
        if (userDTO.getAuthorities() != null) {
            managedAuthorities.clear();
            userDTO.getAuthorities().stream()
                    .map(authorityRepository::findById)
                    .filter(Optional::isPresent)
                    .map(Optional::get)
                    .forEach(managedAuthorities::add);
        }

        return userMapper.toDto(userRepository.save(existingUser));
    }

    public void deleteUserByEmail(String email) {
        userRepository
                .findOneByEmailIgnoreCase(email)
                .ifPresent(
                        user -> {
                            userRepository.delete(user);
                            LOG.debug("Deleted User: {}", user);
                        });
    }

    public void softDeleteUserById(Long userId) {
        userRepository
                .findById(userId)
                .ifPresent(
                        user -> {
                            user.setIsDeleted(true);
                            userRepository.save(user);
                            LOG.debug("Soft deleted User: {}", user);
                        });
        eventPublisher.publishEvent(new DeleteUserEvent(this, userId));
    }

    /**
     * Update basic information (first name, last name, email, language) for the current user.
     *
     * @param firstName first name of user.
     * @param lastName last name of user.
     * @param email email id of user.
     * @param langKey language key.
     * @param imageUrl image URL of user.
     */
    public void updateUser(
            String firstName, String lastName, String email, String langKey, String imageUrl) {
        SecurityUtils.getCurrentUserLogin()
                .map(UserKey::getEmail)
                .flatMap(userRepository::findOneByEmailIgnoreCase)
                .ifPresent(
                        user -> {
                            user.setFirstName(firstName);
                            user.setLastName(lastName);
                            if (email != null) {
                                user.setEmail(email.toLowerCase());
                            }
                            user.setLangKey(langKey);
                            user.setImageUrl(imageUrl);
                            userRepository.save(user);
                            LOG.debug("Changed Information for User: {}", user);
                        });
    }

    @Transactional
    public void changePassword(String currentClearTextPassword, String newPassword) {
        SecurityUtils.getCurrentUserLogin()
                .map(UserKey::getEmail)
                .flatMap(userRepository::findOneByEmailIgnoreCase)
                .ifPresent(
                        user -> {
                            // Find the UserAuth record for "UsernameAndPAssword" authentication
                            UserAuth localAuth =
                                    user.getUserAuths().stream()
                                            .filter(
                                                    auth ->
                                                            UP_AUTH_PROVIDER.equalsIgnoreCase(
                                                                    auth.getAuthProvider()))
                                            .findFirst()
                                            .orElseThrow(
                                                    () ->
                                                            new InvalidPasswordException(
                                                                    "Username password provider not found for user "
                                                                            + user.getEmail()));

                            String currentEncryptedPassword = localAuth.getPasswordHash();
                            if (!passwordEncoder.matches(
                                    currentClearTextPassword, currentEncryptedPassword)) {
                                throw new InvalidPasswordException("Current password is incorrect");
                            }

                            // Update the password
                            String encryptedPassword = passwordEncoder.encode(newPassword);
                            localAuth.setPasswordHash(encryptedPassword);

                            // Save changes
                            userAuthRepository.save(localAuth);

                            LOG.debug("Changed password for User: {}", user.getEmail());
                        });
    }

    @Transactional(readOnly = true)
    public Page<UserDTO> findAllPublicUsers(Optional<QueryDTO> queryDTO, Pageable pageable) {
        Specification<User> spec = createSpecification(queryDTO);
        if (spec == null) {
            spec = Specification.where(null);
        }
        spec.and((root, query, criteriaBuilder) -> criteriaBuilder.isNotNull(root.get(User_.ID)))
                .and(
                        (root, query, criteriaBuilder) ->
                                criteriaBuilder.equal(root.get(User_.STATUS), UserStatus.ACTIVE));
        return userRepository.findAll(spec, pageable).map(userMapper::toDto);
    }

    @Transactional(readOnly = true)
    public Optional<UserDTO> getUserWithManagerById(Long id) {
        return userRepository.findOneWithManagerById(id).map(userMapper::toDto);
    }

    @Transactional(readOnly = true)
    public Optional<UserDTO> getUserById(Long id) {
        return userRepository.findOneById(id).map(userMapper::toDto);
    }

    @Transactional(readOnly = true)
    public Optional<UserDTO> getUserWithAuthorities() {
        return SecurityUtils.getCurrentUserLogin()
                .map(UserKey::getEmail)
                .flatMap(userRepository::findOneWithAuthoritiesByEmailIgnoreCase)
                .map(user -> userMapper.toDto(user, new UserMapper.Context(false)));
    }

    public List<ResourcePermissionDTO> getResourcesWithPermissionsByUserId(Long userId) {
        List<Object[]> results = userRepository.findResourcesWithHighestPermissionsByUserId(userId);

        return results.stream()
                .map(
                        result ->
                                new ResourcePermissionDTO(
                                        (String) result[0], // resourceName
                                        (result[1] == null)
                                                ? Permission.NONE.toString()
                                                : Permission.fromCode((int) result[1]).toString()))
                .collect(Collectors.toList());
    }

    /**
     * Gets all direct reports of a specific user.
     *
     * @param managerId the ID of the manager.
     * @return a list of direct reports.
     */
    public List<UserDTO> getDirectReports(Long managerId) {
        List<User> directReports = userRepository.findByManagerId(managerId);
        return directReports.stream().map(userMapper::toDto).collect(Collectors.toList());
    }

    public UserHierarchyDTO getOrgChart() {
        List<UserHierarchyDTO> topLevelUsers = userRepository.findAllTopLevelUsers();

        if (topLevelUsers.size() > 1) {
            UserHierarchyDTO dummyRoot = new UserHierarchyDTO();
            dummyRoot.setId(-1L);
            dummyRoot.setName("");
            dummyRoot.setImageUrl(null);
            dummyRoot.setManagerId(null);
            dummyRoot.setManagerName(null);
            dummyRoot.setManagerImageUrl(null);
            dummyRoot.setSubordinates(topLevelUsers);
            return dummyRoot;
        }

        // Handle case with a single top-level user
        if (!topLevelUsers.isEmpty()) {
            UserHierarchyDTO rootUser = topLevelUsers.getFirst();
            List<UserHierarchyDTO> subordinates =
                    userRepository.findAllSubordinates(rootUser.getId());
            rootUser.setSubordinates(subordinates);
            return rootUser;
        }

        return null;
    }

    public UserHierarchyDTO getUserHierarchyWithSubordinates(Long userId) {
        // Fetch user hierarchy
        UserHierarchyDTO userHierarchy =
                userRepository
                        .findUserHierarchyById(userId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "User not found with id: " + userId));

        // Fetch subordinates
        List<UserHierarchyDTO> subordinates = userRepository.findAllSubordinates(userId);
        userHierarchy.setSubordinates(subordinates);
        return userHierarchy;
    }

    /**
     * Search for users by a term that can match firstName, lastName, or email
     *
     * @param userTerm The search term
     * @param pageable The pagination information
     * @return Page of users matching the search criteria
     */
    public Page<User> searchUsers(String userTerm, Pageable pageable) {
        return userRepository.findByUserTerm(userTerm, pageable);
    }

    public void updateCurrentUserLocale(String langKey) {
        Long userId = 1L;
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        user.setLangKey(langKey);
        userRepository.save(user);
    }
}
