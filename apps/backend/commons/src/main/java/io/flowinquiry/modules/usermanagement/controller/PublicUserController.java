package io.flowinquiry.modules.usermanagement.controller;

import io.flowinquiry.exceptions.ResourceNotFoundException;
import io.flowinquiry.modules.fss.service.StorageService;
import io.flowinquiry.modules.fss.service.event.ResourceRemoveEvent;
import io.flowinquiry.modules.usermanagement.AuthoritiesConstants;
import io.flowinquiry.modules.usermanagement.EmailAlreadyUsedException;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.repository.UserRepository;
import io.flowinquiry.modules.usermanagement.service.UserService;
import io.flowinquiry.modules.usermanagement.service.dto.ResourcePermissionDTO;
import io.flowinquiry.modules.usermanagement.service.dto.UserDTO;
import io.flowinquiry.modules.usermanagement.service.dto.UserHierarchyDTO;
import io.flowinquiry.modules.usermanagement.service.mapper.UserMapper;
import io.flowinquiry.query.Filter;
import io.flowinquiry.query.FilterOperator;
import io.flowinquiry.query.QueryDTO;
import jakarta.validation.Valid;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import tech.jhipster.web.util.PaginationUtil;
import tech.jhipster.web.util.ResponseUtil;

@RestController
@RequestMapping("/api/users")
public class PublicUserController {

    private static final List<String> ALLOWED_ORDERED_PROPERTIES =
            List.of("id", "login", "firstName", "lastName", "email", "activated", "langKey");

    private static final Logger LOG = LoggerFactory.getLogger(PublicUserController.class);

    private final UserRepository userRepository;
    private final UserService userService;
    private final ApplicationEventPublisher eventPublisher;
    private final StorageService storageService;
    private final UserMapper userMapper;

    public PublicUserController(
            UserService userService,
            UserRepository userRepository,
            ApplicationEventPublisher eventPublisher,
            StorageService storageService,
            UserMapper userMapper) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
        this.storageService = storageService;
        this.userMapper = userMapper;
    }

    /**
     * {@code GET /users} : get all users with only public information - calling this method is
     * allowed for anyone.
     *
     * @param pageable the pagination information.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body all users.
     */
    @PostMapping("/search")
    public ResponseEntity<Page<UserDTO>> searchAllPublicUsers(
            @Valid @RequestBody Optional<QueryDTO> queryDTO, Pageable pageable) {
        LOG.debug("REST request to get all public User names");

        // Check for allowed properties in pageable
        if (!onlyContainsAllowedProperties(pageable)) {
            return ResponseEntity.badRequest().build();
        }

        // Handle queryDTO presence and filters
        if (queryDTO.isPresent()) {
            QueryDTO existingQuery = queryDTO.get();
            if (existingQuery.getFilters() == null) {
                existingQuery.setFilters(new ArrayList<>());
            }
            existingQuery
                    .getFilters()
                    .add(new Filter("isDeleted", FilterOperator.EQ, Boolean.FALSE));
        } else {
            QueryDTO defaultQuery = new QueryDTO();
            List<Filter> filters =
                    List.of(new Filter("isDeleted", FilterOperator.EQ, Boolean.FALSE));
            defaultQuery.setFilters(filters);
            queryDTO = Optional.of(defaultQuery);
        }

        // Fetch public users and generate pagination headers
        final Page<UserDTO> page = userService.findAllPublicUsers(queryDTO, pageable);
        HttpHeaders headers =
                PaginationUtil.generatePaginationHttpHeaders(
                        ServletUriComponentsBuilder.fromCurrentRequest(), page);
        return new ResponseEntity<>(page, headers, HttpStatus.OK);
    }

    /**
     * {@code PUT /users} : Updates an existing User.
     *
     * @param userDTO the user to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated
     *     user.
     * @throws EmailAlreadyUsedException {@code 400 (Bad Request)} if the email is already in use.
     */
    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserDTO> updateUser(
            @RequestPart("userDTO") UserDTO userDTO,
            @RequestParam(value = "file", required = false) MultipartFile avatarFile)
            throws Exception {
        Optional<User> userByEmail = userRepository.findOneByEmailIgnoreCase(userDTO.getEmail());
        if (userByEmail.isPresent()
                && (!userByEmail.orElseThrow().getId().equals(userDTO.getId()))) {
            throw new EmailAlreadyUsedException();
        }

        User existingUser =
                userRepository
                        .findById(userDTO.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Can not find user"));
        Optional<String> fileRemovedPath = Optional.empty();

        // Handle the avatar file upload, if present
        if (avatarFile != null && !avatarFile.isEmpty()) {
            fileRemovedPath = Optional.ofNullable(existingUser.getImageUrl());
            String avatarPath =
                    storageService.uploadImage(
                            "avatar", UUID.randomUUID().toString(), avatarFile.getInputStream());
            userDTO.setImageUrl(avatarPath);
        }

        UserDTO updatedUser = userService.updateUser(userDTO);
        fileRemovedPath.ifPresent(
                s -> eventPublisher.publishEvent(new ResourceRemoveEvent(this, s)));
        return ResponseEntity.ok(updatedUser);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserDTO> getUser(@PathVariable("userId") Long userId) {
        return ResponseUtil.wrapOrNotFound(userService.getUserWithManagerById(userId));
    }

    @GetMapping("/permissions/{userId}")
    public ResponseEntity<List<ResourcePermissionDTO>> getUserResourcesWithPermissions(
            @PathVariable("userId") Long userId) {
        List<ResourcePermissionDTO> resourcesWithPermissions =
                userService.getResourcesWithPermissionsByUserId(userId);
        return ResponseEntity.ok(resourcesWithPermissions);
    }

    @GetMapping("/{managerId}/direct-reports")
    public ResponseEntity<List<UserDTO>> getDirectReports(
            @PathVariable("managerId") Long managerId) {
        List<UserDTO> directReports = userService.getDirectReports(managerId);
        return ResponseEntity.ok(directReports);
    }

    private boolean onlyContainsAllowedProperties(Pageable pageable) {
        return pageable.getSort().stream()
                .map(Sort.Order::getProperty)
                .allMatch(ALLOWED_ORDERED_PROPERTIES::contains);
    }

    /**
     * {@code POST /admin/users} : Creates a new user.
     *
     * <p>Creates a new user if the login and email are not already used, and sends an mail with an
     * activation link. The user needs to be activated on creation.
     *
     * @param userDTO the user to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new
     *     user, or with status {@code 400 (Bad Request)} if the login or email is already in use.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     * @throws IllegalArgumentException {@code 400 (Bad Request)} if the login or email is already
     *     in use.
     */
    @PostMapping
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<UserDTO> createUser(@Valid @RequestBody UserDTO userDTO)
            throws URISyntaxException {
        LOG.debug("REST request to save User : {}", userDTO);

        if (userDTO.getId() != null) {
            throw new IllegalArgumentException("A new user cannot already have an ID");
            // Lowercase the user login before comparing with database
        } else if (userRepository.findOneByEmailIgnoreCase(userDTO.getEmail()).isPresent()) {
            throw new EmailAlreadyUsedException();
        } else {
            UserDTO newUser = userService.createUser(userDTO);
            return ResponseEntity.created(new URI("/api/users/" + newUser.getEmail()))
                    .body(newUser);
        }
    }

    /**
     * {@code DELETE /admin/users/:email} : delete the "email" User.
     *
     * @param userId the userId of the user to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable("userId") Long userId) {
        LOG.debug("REST request to delete User: {}", userId);
        userService.softDeleteUserById(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{userId}/hierarchy")
    public ResponseEntity<UserHierarchyDTO> getUserHierarchy(@PathVariable("userId") Long userId) {
        return ResponseEntity.ok(userService.getUserHierarchyWithSubordinates(userId));
    }

    @GetMapping("/orgChart")
    public ResponseEntity<UserHierarchyDTO> getOrgChart() {
        return ResponseEntity.ok(userService.getOrgChart());
    }

    /**
     * Search for users by a term that can match firstName, lastName, or email Returns a maximum of
     * 10 results
     *
     * @param userTerm The search term
     * @return List of up to 10 users matching the search criteria
     */
    @GetMapping("/search-by-term")
    public List<UserDTO> searchUsers(@RequestParam("term") String userTerm) {
        PageRequest pageRequest = PageRequest.of(0, 10, Sort.by("lastName").ascending());
        return userService.searchUsers(userTerm, pageRequest).getContent().stream()
                .map(userMapper::toDto)
                .toList();
    }

    @PatchMapping("/locale")
    public void updateLocale(@RequestBody Map<String, String> body) {
        String langKey = body.get("langKey");
        if (langKey == null || langKey.isBlank()) {
            return;
        }
        userService.updateCurrentUserLocale(langKey);
    }
}
