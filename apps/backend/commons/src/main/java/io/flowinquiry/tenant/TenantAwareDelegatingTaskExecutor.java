package io.flowinquiry.tenant;

import java.util.UUID;
import org.springframework.core.task.TaskExecutor;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * A TaskExecutor implementation that preserves tenant context and security context when executing
 * tasks asynchronously.
 *
 * <p>This executor wraps another TaskExecutor (delegate) and ensures that the tenant ID and
 * security context from the calling thread are properly propagated to the thread that executes the
 * task.
 *
 * <p>After task execution, it cleans up thread-local storage to prevent memory leaks and context
 * contamination between different requests.
 */
public class TenantAwareDelegatingTaskExecutor implements TaskExecutor {

    private final TaskExecutor delegate;

    /**
     * Creates a new TenantAwareDelegatingTaskExecutor.
     *
     * @param delegate the underlying TaskExecutor to which execution will be delegated
     */
    public TenantAwareDelegatingTaskExecutor(TaskExecutor delegate) {
        this.delegate = delegate;
    }

    @Override
    public void execute(Runnable task) {
        UUID tenantId = TenantContext.getTenantId().orElse(null);
        SecurityContext securityContext = SecurityContextHolder.getContext();

        delegate.execute(
                () -> {
                    try {
                        // Set both contexts
                        TenantContext.setTenantId(tenantId);
                        SecurityContextHolder.setContext(securityContext);

                        task.run();
                    } finally {
                        // Clean up thread-local storage
                        TenantContext.clear();
                        SecurityContextHolder.clearContext();
                    }
                });
    }
}
