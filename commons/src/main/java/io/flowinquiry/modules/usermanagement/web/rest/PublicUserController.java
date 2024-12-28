package io.flowinquiry.modules.usermanagement.web.rest;

import io.flowinquiry.modules.collab.service.MailService;
import io.flowinquiry.modules.fss.service.StorageService;
import io.flowinquiry.modules.usermanagement.AuthoritiesConstants;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.repository.UserRepository;
import io.flowinquiry.modules.usermanagement.service.UserService;
import io.flowinquiry.modules.usermanagement.service.dto.ResourcePermissionDTO;
import io.flowinquiry.modules.usermanagement.service.dto.UserDTO;
import io.flowinquiry.modules.usermanagement.service.dto.UserHierarchyDTO;
import io.flowinquiry.modules.usermanagement.web.rest.errors.BadRequestAlertException;
import io.flowinquiry.modules.usermanagement.web.rest.errors.EmailAlreadyUsedException;
import io.flowinquiry.platform.utils.Obfuscator;
import io.flowinquiry.query.Filter;
import io.flowinquiry.query.QueryDTO;
import jakarta.validation.Valid;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
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
    private final StorageService storageService;
    private final MailService mailService;

    public PublicUserController(
            UserService userService,
            UserRepository userRepository,
            StorageService storageService,
            MailService mailService) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.storageService = storageService;
        this.mailService = mailService;
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
            existingQuery.getFilters().add(new Filter("isDeleted", "eq", Boolean.FALSE));
        } else {
            QueryDTO defaultQuery = new QueryDTO();
            List<Filter> filters = List.of(new Filter("isDeleted", "eq", Boolean.FALSE));
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
        Optional<User> existingUser = userRepository.findOneByEmailIgnoreCase(userDTO.getEmail());
        if (existingUser.isPresent()
                && (!existingUser.orElseThrow().getId().equals(userDTO.getId()))) {
            throw new EmailAlreadyUsedException();
        }

        // Handle the avatar file upload, if present
        if (avatarFile != null && !avatarFile.isEmpty()) {
            String avatarPath =
                    storageService.uploadImage(
                            "avatar",
                            Obfuscator.obfuscate(userDTO.getId()),
                            avatarFile.getInputStream());
            userDTO.setImageUrl(avatarPath);
        }

        UserDTO updatedUser = userService.updateUser(userDTO);

        return ResponseEntity.ok(updatedUser);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserDTO> getUser(@PathVariable("userId") Long userId) {
        return ResponseUtil.wrapOrNotFound(userService.getUserWithManagerById(userId));
    }

    @GetMapping("/permissions/{userId}")
    public ResponseEntity<List<ResourcePermissionDTO>> getUserResourcesWithPermissions(
            @PathVariable Long userId) {
        List<ResourcePermissionDTO> resourcesWithPermissions =
                userService.getResourcesWithPermissionsByUserId(userId);
        return ResponseEntity.ok(resourcesWithPermissions);
    }

    @GetMapping("/{managerId}/direct-reports")
    public ResponseEntity<List<UserDTO>> getDirectReports(@PathVariable Long managerId) {
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
     * @throws BadRequestAlertException {@code 400 (Bad Request)} if the login or email is already
     *     in use.
     */
    @PostMapping
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<UserDTO> createUser(@Valid @RequestBody UserDTO userDTO)
            throws URISyntaxException {
        LOG.debug("REST request to save User : {}", userDTO);

        if (userDTO.getId() != null) {
            throw new BadRequestAlertException(
                    "A new user cannot already have an ID", "userManagement", "idexists");
            // Lowercase the user login before comparing with database
        } else if (userRepository.findOneByEmailIgnoreCase(userDTO.getEmail()).isPresent()) {
            throw new EmailAlreadyUsedException();
        } else {
            UserDTO newUser = userService.createUser(userDTO);
            mailService.sendCreationEmail(newUser);
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
    public ResponseEntity<UserHierarchyDTO> getUserHierarchy(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getUserHierarchyWithSubordinates(userId));
    }

    @GetMapping("/orgChart")
    public ResponseEntity<UserHierarchyDTO> getOrgChart() {
        return ResponseEntity.ok(userService.getOrgChart());
    }
}
