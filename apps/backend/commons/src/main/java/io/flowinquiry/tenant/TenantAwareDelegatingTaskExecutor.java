package io.flowinquiry.tenant;

import java.util.UUID;
import org.springframework.core.task.TaskExecutor;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

public class TenantAwareDelegatingTaskExecutor implements TaskExecutor {

    private final TaskExecutor delegate;

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
