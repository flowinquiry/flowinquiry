package io.flowinquiry.tenant.filter;

import static io.flowinquiry.security.SecurityUtils.TENANT_ID;

import io.flowinquiry.tenant.context.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * HTTP filter responsible for extracting tenant information from JWT tokens and setting it in the
 * {@link TenantContext} for the current request.
 *
 * <p>This filter ensures that tenant context is properly established at the beginning of each
 * request and cleaned up at the end, maintaining proper isolation between different tenant
 * requests.
 *
 * <p>The tenant ID is extracted from the JWT token's claims and set in the thread-local context,
 * making it available throughout the request processing.
 */
@Component
public class TenantContextFilter extends OncePerRequestFilter {

    /**
     * Processes each HTTP request to extract and set tenant context information.
     *
     * <p>This method:
     *
     * <ol>
     *   <li>Extracts the tenant ID from the JWT token if present
     *   <li>Sets the tenant ID in the {@link TenantContext}
     *   <li>Continues the filter chain to process the request
     *   <li>Ensures the tenant context is cleared after request processing
     * </ol>
     *
     * @param request the HTTP request being processed
     * @param response the HTTP response being generated
     * @param filterChain the filter chain for executing other filters
     * @throws ServletException if a servlet exception occurs
     * @throws IOException if an I/O exception occurs
     */
    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
                String tenantId = jwt.getClaimAsString(TENANT_ID);
                if (tenantId != null) {
                    TenantContext.setTenantId(UUID.fromString(tenantId));
                }
            }

            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear(); // Ensure cleanup for next request/thread
        }
    }
}
