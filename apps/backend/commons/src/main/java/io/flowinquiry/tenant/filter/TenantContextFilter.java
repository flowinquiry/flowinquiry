package io.flowinquiry.tenant.filter;

import static io.flowinquiry.security.SecurityUtils.TENANT_ID;

import io.flowinquiry.tenant.TenantContext;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.PersistenceException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Session;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
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
@Slf4j
@Component
public class TenantContextFilter extends OncePerRequestFilter {

    @PersistenceContext private EntityManager entityManager;

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
            UUID tenantId = resolveTenantId(request);

            if (tenantId != null) {
                TenantContext.setTenantId(tenantId);
            } else {
                log.debug("Anonymous request with no tenant ID for: {}", request.getRequestURI());
            }

            if (tenantId != null
                    && entityManager.isOpen()
                    && entityManager.getEntityManagerFactory().isOpen()) {
                try {
                    Session session = entityManager.unwrap(Session.class);
                    if (session.isOpen() && session.getEnabledFilter("tenantFilter") == null) {
                        session.enableFilter("tenantFilter").setParameter("tenantId", tenantId);
                    }
                } catch (IllegalStateException | PersistenceException ex) {
                    log.warn("Exception when enabling tenant filter: {}", ex.getMessage(), ex);
                }
            }

            filterChain.doFilter(request, response);

        } finally {
            TenantContext.clear();
        }
    }

    private UUID resolveTenantId(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // Case 1: Authenticated user with JWT
        if (auth instanceof JwtAuthenticationToken jwtToken && auth.isAuthenticated()) {
            String tenantId = jwtToken.getToken().getClaimAsString(TENANT_ID);
            if (tenantId != null) {
                return UUID.fromString(tenantId);
            }
        }

        // Case 2: Anonymous access — try header or query param
        if (auth == null || auth instanceof AnonymousAuthenticationToken) {
            String tenantIdHeader = request.getHeader("X-Tenant-ID");
            if (tenantIdHeader != null && !tenantIdHeader.isBlank()) {
                return UUID.fromString(tenantIdHeader);
            }

            String tenantIdParam = request.getParameter("tenant");
            if (tenantIdParam != null && !tenantIdParam.isBlank()) {
                return UUID.fromString(tenantIdParam);
            }
        }
        return null;
    }
}
