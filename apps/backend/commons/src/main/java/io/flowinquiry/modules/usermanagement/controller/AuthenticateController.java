package io.flowinquiry.modules.usermanagement.controller;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.flowinquiry.security.service.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Controller to authenticate users. */
@RestController
@RequestMapping("/api")
@Tag(name = "Authentication", description = "API endpoints for user authentication")
@Slf4j
public class AuthenticateController {

    private final JwtService jwtService;

    private final AuthenticationManager appAuthenticationManager;

    public AuthenticateController(
            JwtService jwtService,
            @Qualifier("appAuthenticationManager") AuthenticationManager appAuthenticationManager) {
        this.jwtService = jwtService;
        this.appAuthenticationManager = appAuthenticationManager;
    }

    @PostMapping("/authenticate")
    @Operation(
            summary = "Authenticate user",
            description = "Authenticates a user and returns a JWT token",
            responses = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Successfully authenticated",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema = @Schema(implementation = JWTToken.class))),
                @ApiResponse(responseCode = "401", description = "Bad credentials"),
                @ApiResponse(responseCode = "400", description = "Invalid input")
            })
    public ResponseEntity<JWTToken> authorize(
            @Parameter(description = "Login credentials", required = true) @Valid @RequestBody
                    LoginVM loginVM) {
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(loginVM.getEmail(), loginVM.getPassword());

        Authentication authentication = appAuthenticationManager.authenticate(authenticationToken);
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtService.generateToken(authentication);
        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setBearerAuth(jwt);
        return new ResponseEntity<>(new JWTToken(jwt), httpHeaders, HttpStatus.OK);
    }

    /**
     * {@code GET /authenticate} : check if the user is authenticated, and return its login.
     *
     * @param request the HTTP request.
     * @return the login if the user is authenticated.
     */
    @GetMapping("/authenticate")
    @Operation(
            summary = "Check authentication status",
            description = "Checks if the current user is authenticated and returns the username",
            responses = {
                @ApiResponse(
                        responseCode = "200",
                        description =
                                "Returns the username if authenticated or null if not authenticated",
                        content =
                                @Content(
                                        mediaType = "text/plain",
                                        schema = @Schema(type = "string")))
            })
    public String isAuthenticated(
            @Parameter(description = "HTTP request", hidden = true) HttpServletRequest request) {
        log.debug("REST request to check if the current user is authenticated");
        return request.getRemoteUser();
    }

    /** Object to return as body in JWT Authentication. */
    @Schema(description = "JWT token response")
    static class JWTToken {

        @Schema(description = "JWT token for authentication")
        private String idToken;

        JWTToken(String idToken) {
            this.idToken = idToken;
        }

        @JsonProperty("id_token")
        String getIdToken() {
            return idToken;
        }

        void setIdToken(String idToken) {
            this.idToken = idToken;
        }
    }
}
