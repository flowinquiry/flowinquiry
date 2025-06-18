package io.flowinquiry.modules.usermanagement.controller;

import io.flowinquiry.modules.collab.service.MailService;
import io.flowinquiry.modules.usermanagement.EmailAlreadyUsedException;
import io.flowinquiry.modules.usermanagement.InvalidPasswordException;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.repository.UserRepository;
import io.flowinquiry.modules.usermanagement.service.UserService;
import io.flowinquiry.modules.usermanagement.service.dto.PasswordChangeDTO;
import io.flowinquiry.modules.usermanagement.service.dto.UserDTO;
import io.flowinquiry.modules.usermanagement.service.dto.UserKey;
import io.flowinquiry.modules.usermanagement.service.mapper.UserMapper;
import io.flowinquiry.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import java.util.Optional;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "User Account", description = "User account management API")
public class UserAccountController {

    private static class AccountResourceException extends RuntimeException {

        private AccountResourceException(String message) {
            super(message);
        }
    }

    private static final Logger log = LoggerFactory.getLogger(UserAccountController.class);

    private final UserRepository userRepository;

    private final UserService userService;

    private final UserMapper userMapper;

    private final MailService mailService;

    public UserAccountController(
            UserRepository userRepository,
            UserService userService,
            UserMapper userMapper,
            MailService mailService) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.userMapper = userMapper;
        this.mailService = mailService;
    }

    /**
     * {@code POST /register} : register the user.
     *
     * @param managedUserVM the managed user View Model.
     * @throws InvalidPasswordException {@code 400 (Bad Request)} if the password is incorrect.
     * @throws EmailAlreadyUsedException {@code 400 (Bad Request)} if the email is already used.
     */
    @Operation(
            summary = "Register a new user account",
            description = "Creates a new user account and sends activation email")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "201", description = "User registered successfully"),
                @ApiResponse(
                        responseCode = "400",
                        description = "Invalid password or email already in use",
                        content = @Content(schema = @Schema(implementation = Error.class)))
            })
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public void registerAccount(@Valid @RequestBody ManagedUserVM managedUserVM) {
        if (isPasswordLengthInvalid(managedUserVM.getPassword())) {
            throw new InvalidPasswordException();
        }
        UserDTO user =
                userMapper.toDto(
                        userService.registerUser(managedUserVM, managedUserVM.getPassword()));
        mailService.sendActivationEmail(user);
    }

    @Operation(
            summary = "Resend activation email",
            description = "Resends the activation email to the specified email address")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Email sent successfully"),
                @ApiResponse(responseCode = "404", description = "User not found")
            })
    @GetMapping("/{email}/resend-activation-email")
    public void resendActivationEmail(
            @Parameter(description = "Email address of the user", required = true)
                    @Valid @PathVariable("email")
                    @Email String email) {
        Optional<User> user = userRepository.findUserByEmailEqualsIgnoreCase(email);
        if (user.isEmpty()) {
            log.warn("User with email {} not found", email);
            return;
        }
        UserDTO userDTO = userMapper.toDto(user.get());
        mailService.sendCreationEmail(userDTO);
    }

    /**
     * {@code GET /activate} : activate the registered user.
     *
     * @param key the activation key.
     * @throws RuntimeException {@code 500 (Internal Server Error)} if the user couldn't be
     *     activated.
     */
    @Operation(
            summary = "Activate user account",
            description = "Activates a registered user account using the provided activation key")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Account activated successfully"),
                @ApiResponse(
                        responseCode = "500",
                        description = "User not found for the provided activation key")
            })
    @GetMapping("/activate")
    public void activateAccount(
            @Parameter(description = "Activation key sent to the user's email", required = true)
                    @RequestParam("key")
                    String key) {
        Optional<User> user = userService.activateRegistration(key);
        if (user.isEmpty()) {
            throw new AccountResourceException("No user was found for this activation key");
        }
    }

    /**
     * {@code GET /account} : get the current user.
     *
     * @return the current user.
     * @throws RuntimeException {@code 500 (Internal Server Error)} if the user couldn't be
     *     returned.
     */
    @Operation(
            summary = "Get current user account",
            description = "Returns the authenticated user's account information")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "User account information retrieved successfully",
                        content = @Content(schema = @Schema(implementation = UserDTO.class))),
                @ApiResponse(responseCode = "500", description = "User could not be found")
            })
    @GetMapping("/account")
    public UserDTO getAccount() {
        return userService
                .getUserWithAuthorities()
                .orElseThrow(() -> new AccountResourceException("User could not be found"));
    }

    /**
     * {@code POST /account} : update the current user information.
     *
     * @param userDTO the current user information.
     * @throws EmailAlreadyUsedException {@code 400 (Bad Request)} if the email is already used.
     * @throws RuntimeException {@code 500 (Internal Server Error)} if the user login wasn't found.
     */
    @Operation(
            summary = "Update user account",
            description = "Updates the current user's account information")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "User account updated successfully"),
                @ApiResponse(
                        responseCode = "400",
                        description = "Email already in use or cannot be changed"),
                @ApiResponse(responseCode = "500", description = "User could not be found")
            })
    @PostMapping("/account")
    public void saveAccount(
            @Parameter(description = "Updated user information", required = true)
                    @Valid @RequestBody
                    UserDTO userDTO) {
        String userLogin =
                SecurityUtils.getCurrentUserLogin()
                        .map(UserKey::getEmail)
                        .orElseThrow(
                                () -> new AccountResourceException("Current user login not found"));
        Optional<User> user = userRepository.findOneByEmailIgnoreCase(userLogin);
        if (user.isEmpty()) {
            throw new AccountResourceException("User could not be found");
        }
        if (!user.get().getEmail().equals(userDTO.getEmail())) {
            throw new AccountResourceException("Can not change email");
        }
        userService.updateUser(
                userDTO.getFirstName(),
                userDTO.getLastName(),
                userDTO.getEmail(),
                userDTO.getLangKey(),
                userDTO.getImageUrl());
    }

    /**
     * {@code POST /account/change-password} : changes the current user's password.
     *
     * @param passwordChangeDto current and new password.
     * @throws InvalidPasswordException {@code 400 (Bad Request)} if the new password is incorrect.
     */
    @Operation(summary = "Change password", description = "Changes the current user's password")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Password changed successfully"),
                @ApiResponse(responseCode = "400", description = "Invalid new password")
            })
    @PostMapping(path = "/account/change-password")
    public void changePassword(
            @Parameter(description = "Current and new password", required = true) @RequestBody
                    PasswordChangeDTO passwordChangeDto) {
        if (isPasswordLengthInvalid(passwordChangeDto.getNewPassword())) {
            throw new InvalidPasswordException();
        }
        userService.changePassword(
                passwordChangeDto.getCurrentPassword(), passwordChangeDto.getNewPassword());
    }

    /**
     * {@code POST /account/reset-password/init} : Send an email to reset the password of the user.
     *
     * @param email the mail of the user.
     */
    @Operation(
            summary = "Request password reset",
            description = "Sends an email with a link to reset the user's password")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Reset email sent successfully")
            })
    @GetMapping(path = "/account/reset-password/init")
    public void requestPasswordReset(
            @Parameter(description = "Email address of the user", required = true)
                    @RequestParam("email")
                    @Email String email) {
        Optional<UserDTO> user = userService.requestPasswordReset(email);
        if (user.isPresent()) {
            mailService.sendPasswordResetMail(user.orElseThrow());
        } else {
            // Pretend the request has been successful to prevent checking which emails really exist
            // but log that an invalid attempt has been made
            log.warn("Password reset requested for non existing mail {}", email);
        }
    }

    /**
     * {@code POST /account/reset-password/finish} : Finish to reset the password of the user.
     *
     * @param keyAndPassword the generated key and the new password.
     * @throws InvalidPasswordException {@code 400 (Bad Request)} if the password is incorrect.
     * @throws RuntimeException {@code 500 (Internal Server Error)} if the password could not be
     *     reset.
     */
    @Operation(
            summary = "Complete password reset",
            description =
                    "Completes the password reset process using the provided key and new password")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Password reset successfully"),
                @ApiResponse(responseCode = "400", description = "Invalid new password"),
                @ApiResponse(responseCode = "500", description = "No user found for the reset key")
            })
    @PostMapping(path = "/account/reset-password/finish")
    public void finishPasswordReset(
            @Parameter(description = "Reset key and new password", required = true) @RequestBody
                    KeyAndPasswordVM keyAndPassword) {
        if (isPasswordLengthInvalid(keyAndPassword.getNewPassword())) {
            throw new InvalidPasswordException();
        }
        Optional<User> user =
                userService.completePasswordReset(
                        keyAndPassword.getNewPassword(), keyAndPassword.getKey());

        if (user.isEmpty()) {
            throw new AccountResourceException("No user was found for this reset key");
        }
    }

    private static boolean isPasswordLengthInvalid(String password) {
        return (StringUtils.isEmpty(password)
                || password.length() < ManagedUserVM.PASSWORD_MIN_LENGTH
                || password.length() > ManagedUserVM.PASSWORD_MAX_LENGTH);
    }
}
