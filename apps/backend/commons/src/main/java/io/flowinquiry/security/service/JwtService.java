package io.flowinquiry.security.service;

import static io.flowinquiry.security.SecurityUtils.AUTHORITIES_KEY;
import static io.flowinquiry.security.SecurityUtils.JWT_ALGORITHM;
import static io.flowinquiry.security.SecurityUtils.TENANT_ID;
import static io.flowinquiry.security.SecurityUtils.USER_ID;

import io.flowinquiry.security.domain.FwUserDetails;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.stereotype.Service;

/**
 * Service for handling JWT (JSON Web Token) operations.
 *
 * <p>This service provides functionality for generating and authenticating JWT tokens used for
 * securing the application. It encapsulates the JWT encoding and decoding operations and manages
 * token validity.
 */
@Service
public class JwtService {

    /** Logger for this class */
    private static final Logger LOG = LoggerFactory.getLogger(JwtService.class);

    /** Encoder for creating JWT tokens */
    private final JwtEncoder jwtEncoder;

    /** Decoder for validating and parsing JWT tokens */
    private final JwtDecoder jwtDecoder;

    /**
     * Token validity period in seconds, loaded from application configuration. Default value is 0
     * if not specified in configuration.
     */
    @Value("${flowinquiry.security.authentication.jwt.token-validity-in-seconds:0}")
    private long tokenValidityInSeconds;

    /**
     * Constructs a new JwtService with the specified encoder and decoder.
     *
     * @param jwtEncoder the encoder used to create JWT tokens
     * @param jwtDecoder the decoder used to validate and parse JWT tokens
     */
    public JwtService(JwtEncoder jwtEncoder, JwtDecoder jwtDecoder) {
        this.jwtEncoder = jwtEncoder;
        this.jwtDecoder = jwtDecoder;
    }

    /**
     * Generates a JWT token for the given authentication.
     *
     * @param authentication the authentication object containing user details
     * @return a JWT token string
     */
    public String generateToken(Authentication authentication) {
        FwUserDetails userDetails = (FwUserDetails) authentication.getPrincipal();
        return generateToken(
                userDetails.getUserId(),
                authentication.getName(),
                userDetails.getTenantId(),
                authentication.getAuthorities());
    }

    /**
     * Generates a JWT token with the specified user details and authorities.
     *
     * @param userId the ID of the user
     * @param email the email of the user, used as the subject of the token
     * @param tenantId the tenantId of user, which tenant user belong to
     * @param grantedAuthorities the authorities granted to the user
     * @return a JWT token string
     */
    public String generateToken(
            Long userId,
            String email,
            UUID tenantId,
            Collection<? extends GrantedAuthority> grantedAuthorities) {
        String authorities =
                grantedAuthorities.stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(Collectors.joining(" "));

        Instant now = Instant.now();
        Instant validity = now.plus(this.tokenValidityInSeconds, ChronoUnit.SECONDS);
        JwtClaimsSet claims =
                JwtClaimsSet.builder()
                        .issuedAt(now)
                        .expiresAt(validity)
                        .subject(email)
                        .claim(TENANT_ID, tenantId)
                        .claim(AUTHORITIES_KEY, authorities)
                        .claim(USER_ID, userId)
                        .build();

        JwsHeader jwsHeader = JwsHeader.with(JWT_ALGORITHM).build();
        return this.jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader, claims)).getTokenValue();
    }

    /**
     * Authenticates a JWT token and converts it to an Authentication object.
     *
     * @param token the JWT token string to authenticate
     * @return an Authentication object if the token is valid, null otherwise
     */
    public Authentication authenticateToken(String token) {
        try {
            Jwt jwt = jwtDecoder.decode(token);
            return new JwtAuthenticationConverter().convert(jwt);
        } catch (JwtException e) {
            LOG.error("❌ Invalid JWT Token: " + e.getMessage(), e);
            return null;
        }
    }
}
