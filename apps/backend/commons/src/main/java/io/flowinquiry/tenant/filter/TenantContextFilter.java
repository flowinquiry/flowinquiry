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

@Component
public class TenantContextFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof Jwt) {
                Jwt jwt = (Jwt) authentication.getPrincipal();
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
