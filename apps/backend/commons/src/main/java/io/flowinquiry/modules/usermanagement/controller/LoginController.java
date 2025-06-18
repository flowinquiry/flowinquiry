package io.flowinquiry.modules.usermanagement.controller;

import io.flowinquiry.modules.usermanagement.InvalidLoginException;
import io.flowinquiry.modules.usermanagement.repository.UserRepository;
import io.flowinquiry.modules.usermanagement.service.UserService;
import io.flowinquiry.modules.usermanagement.service.dto.UserDTO;
import io.flowinquiry.security.service.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "Login", description = "API endpoints for user login")
public class LoginController {

    private final JwtService jwtService;

    private final AuthenticationManager appAuthenticationManager;

    private final UserService userService;

    private final UserRepository userRepository;

    public LoginController(
            JwtService jwtService,
            @Qualifier("appAuthenticationManager") AuthenticationManager appAuthenticationManager,
            UserService userService,
            UserRepository userRepository) {
        this.jwtService = jwtService;
        this.appAuthenticationManager = appAuthenticationManager;
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    @Operation(
            summary = "Login user",
            description =
                    "Authenticates a user, returns user details with JWT token in header, and updates last login time",
            responses = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully authenticated",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = UserDTO.class))),
                @ApiResponse(responseCode = "401", description = "Bad credentials"),
                @ApiResponse(responseCode = "400", description = "Invalid input")
            })
    public ResponseEntity<UserDTO> authorize(
            @Parameter(description = "Login credentials", required = true) @Valid @RequestBody
                    LoginVM loginVM) {
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(loginVM.getEmail(), loginVM.getPassword());

        Authentication authentication = appAuthenticationManager.authenticate(authenticationToken);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserDTO adminUserDTO =
                userService.getUserWithAuthorities().orElseThrow(InvalidLoginException::new);

        String jwt = jwtService.generateToken(authentication);
        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setBearerAuth(jwt);

        // Update last login time for user
        userRepository.updateLastLoginTime(loginVM.getEmail(), Instant.now());
        return new ResponseEntity<>(adminUserDTO, httpHeaders, HttpStatus.OK);
    }
}
