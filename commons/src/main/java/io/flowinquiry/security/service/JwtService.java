package io.flowinquiry.security.service;

import static io.flowinquiry.security.SecurityUtils.AUTHORITIES_KEY;
import static io.flowinquiry.security.SecurityUtils.JWT_ALGORITHM;
import static io.flowinquiry.security.SecurityUtils.USER_ID;

import io.flowinquiry.modules.usermanagement.service.dto.FwUserDetails;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
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

@Service
public class JwtService {

    private static final Logger LOG = LoggerFactory.getLogger(JwtService.class);

    private final JwtEncoder jwtEncoder;

    private final JwtDecoder jwtDecoder;

    @Value("${flowinquiry.security.authentication.jwt.token-validity-in-seconds:0}")
    private long tokenValidityInSeconds;

    public JwtService(JwtEncoder jwtEncoder, JwtDecoder jwtDecoder) {
        this.jwtEncoder = jwtEncoder;
        this.jwtDecoder = jwtDecoder;
    }

    public String generateToken(Authentication authentication) {
        return generateToken(
                ((FwUserDetails) authentication.getPrincipal()).getUserId(),
                authentication.getName(),
                authentication.getAuthorities());
    }

    public String generateToken(
            Long userId, String email, Collection<? extends GrantedAuthority> grantedAuthorities) {
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
                        .claim(AUTHORITIES_KEY, authorities)
                        .claim(USER_ID, userId)
                        .build();

        JwsHeader jwsHeader = JwsHeader.with(JWT_ALGORITHM).build();
        return this.jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader, claims)).getTokenValue();
    }

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
