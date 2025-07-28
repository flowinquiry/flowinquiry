package io.flowinquiry.modules.usermanagement.service;

import io.flowinquiry.modules.usermanagement.domain.Authority;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.repository.AuthorityRepository;
import io.flowinquiry.modules.usermanagement.repository.UserRepository;
import io.flowinquiry.modules.usermanagement.service.dto.AuthorityDTO;
import io.flowinquiry.modules.usermanagement.service.dto.UserDTO;
import io.flowinquiry.modules.usermanagement.service.mapper.AuthorityMapper;
import io.flowinquiry.modules.usermanagement.service.mapper.UserMapper;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthorityService {

    private final AuthorityRepository authorityRepository;

    private final UserRepository userRepository;

    private final AuthorityMapper authorityMapper;

    private final UserMapper userMapper;

    public AuthorityService(
            AuthorityRepository authorityRepository,
            UserRepository userRepository,
            UserMapper userMapper,
            AuthorityMapper authorityMapper) {
        this.authorityRepository = authorityRepository;
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.authorityMapper = authorityMapper;
    }

    /**
     * Create a new authority.
     *
     * @param authority the authority to save
     * @return the persisted entity
     */
    public AuthorityDTO createAuthority(Authority authority) {
        return authorityMapper.toDto(authorityRepository.save(authority));
    }

    /**
     * Update an existing authority.
     *
     * @param authority the authority to update
     * @return the updated entity
     */
    public Authority updateAuthority(Authority authority) {
        if (!authorityRepository.existsById(authority.getName())) {
            throw new IllegalArgumentException("Authority not found: " + authority.getName());
        }
        return authorityRepository.save(authority);
    }

    /**
     * Delete an authority by name.
     *
     * @param authorityName the name of the authority to delete
     */
    public void deleteAuthority(String authorityName) {
        authorityRepository.removeAllUsersFromAuthority(authorityName);
        authorityRepository.deleteById(authorityName);
    }

    /**
     * Find an authority by name.
     *
     * @param authorityName the name of the authority
     * @return the found authority, or Optional.empty() if not found
     */
    @Transactional(readOnly = true)
    public Optional<AuthorityDTO> findAuthorityByName(String authorityName) {
        return authorityRepository.findById(authorityName).map(authorityMapper::toDto);
    }

    @Transactional(readOnly = true)
    public Page<UserDTO> findAllUsersByAuthority(String authorityName, Pageable pageable) {
        return authorityRepository
                .findUsersByAuthority(authorityName, pageable)
                .map(userMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<UserDTO> findUsersNotInAuthority(
            String searchTerm, String authorityName, Pageable pageable) {
        return userMapper.toDtos(
                authorityRepository.findUsersNotInAuthority(searchTerm, authorityName, pageable));
    }

    /**
     * Get all authorities.
     *
     * @return the list of authorities
     */
    @Transactional(readOnly = true)
    public Page<AuthorityDTO> findAllAuthorities(Pageable pageable) {
        return authorityRepository.findAll(pageable).map(authorityMapper::toDto);
    }

    @Transactional
    public void addUsersToAuthority(List<Long> userIds, String authorityName) {
        // Fetch the authority entity
        Authority authority =
                authorityRepository
                        .findById(authorityName)
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Authority not found: " + authorityName));

        // Fetch the users and associate them with the authority
        List<User> users = userRepository.findAllById(userIds);
        for (User user : users) {
            user.getAuthorities().add(authority);
        }
        userRepository.saveAll(users);
    }

    @Transactional
    public void removeUserFromAuthority(Long userId, String authorityName) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(
                                () -> new IllegalArgumentException("User not found: " + userId));

        Authority authority =
                authorityRepository
                        .findById(authorityName)
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Authority not found: " + authorityName));

        // Remove the authority from the user's authorities set
        if (user.getAuthorities().contains(authority)) {
            user.getAuthorities().remove(authority);
            userRepository.save(user); // Save the updated user
        }
    }
}
