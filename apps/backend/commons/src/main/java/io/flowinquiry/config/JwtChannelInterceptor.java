package io.flowinquiry.config;

import io.flowinquiry.security.service.JwtService;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Intercepts STOMP messages to extract and authenticate JWT tokens from the WebSocket connection.
 *
 * <p>This interceptor is applied to the WebSocket message broker's inbound channel. It
 * authenticates users when they send a {@code CONNECT} STOMP command by extracting the JWT token
 * from the {@code Authorization} header.
 *
 * <p>If a valid JWT token is found, the corresponding {@link Authentication} is set in the {@link
 * SecurityContextHolder}, allowing Spring Security to handle authorization for subsequent WebSocket
 * messages.
 *
 * @author Hai Nguyen
 */
@Component
@Slf4j
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

    public JwtChannelInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    /**
     * Intercepts the STOMP message before it is sent to the broker to authenticate users.
     *
     * <p>This method checks if the message is a {@code CONNECT} STOMP command. If so, it extracts
     * the {@code Authorization} header, verifies the JWT token, and sets the authenticated user in
     * the {@link SecurityContextHolder}.
     *
     * @param message the STOMP message being sent
     * @param channel the message channel through which the message is sent
     * @return the original message if authentication is successful, otherwise the message is still
     *     passed through
     */
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            Map nativeHeaders = (Map) accessor.getHeader("nativeHeaders");
            if (nativeHeaders != null) {
                List authorizationValues = ((List) nativeHeaders.get("Authorization"));
                if (authorizationValues != null && !authorizationValues.isEmpty()) {
                    String authHeader = (String) authorizationValues.getFirst();
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);
                        Authentication authentication = jwtService.authenticateToken(token);
                        if (authentication != null) {
                            log.debug(
                                    "🔐 STOMP Message Authenticated for user: {}",
                                    authentication.getName());
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                        }
                    }
                }
            }
        }
        return message;
    }
}
