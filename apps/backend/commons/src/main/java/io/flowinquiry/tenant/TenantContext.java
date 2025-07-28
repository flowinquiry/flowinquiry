package io.flowinquiry.tenant;

import java.util.Optional;
import java.util.UUID;

/**
 * Utility class for managing tenant context in a multi-tenant application. This class provides
 * thread-local storage for tenant information, ensuring that tenant-specific data is isolated
 * between different threads/requests. It also provides functionality to temporarily suppress tenant
 * filtering when needed.
 */
public class TenantContext {
    /**
     * Thread-local storage for the current tenant ID. Each thread has its own independent tenant
     * ID.
     */
    private static final ThreadLocal<UUID> currentTenant = new ThreadLocal<>();

    /**
     * Thread-local flag to indicate whether tenant filtering should be suppressed. When set to
     * true, tenant filtering will be bypassed.
     */
    private static final ThreadLocal<Boolean> suppress = ThreadLocal.withInitial(() -> false);

    /**
     * Checks if tenant filtering is currently suppressed.
     *
     * @return true if tenant filtering is suppressed, false otherwise
     */
    public static boolean isFilterSuppressed() {
        return suppress.get();
    }

    /**
     * Suppresses tenant filtering for the current thread. When filtering is suppressed, {@link
     * #getTenantId()} will return null instead of throwing an exception when tenant ID is not set.
     */
    public static void suppressFiltering() {
        suppress.set(true);
    }

    /**
     * Restores tenant filtering for the current thread by removing the suppress flag. After calling
     * this method, tenant filtering will be applied normally.
     */
    public static void restoreFiltering() {
        suppress.remove();
    }

    /**
     * Sets the tenant ID for the current thread.
     *
     * @param tenantId the UUID of the tenant to set as current
     */
    public static void setTenantId(UUID tenantId) {
        currentTenant.set(tenantId);
    }

    /**
     * Gets the tenant ID for the current thread. If tenant filtering is suppressed, this method
     * returns null. Otherwise, if the tenant ID is not set, it throws an IllegalStateException.
     *
     * @return the current tenant ID, or null if filtering is suppressed
     * @throws IllegalStateException if tenant ID is not set and filtering is not suppressed
     */
    public static Optional<UUID> getTenantId() {
        if (suppress.get()) return Optional.empty();
        return Optional.of(currentTenant.get());
    }

    /**
     * Clears the tenant ID for the current thread. This should typically be called at the end of
     * request processing to prevent memory leaks and tenant context bleeding between requests.
     */
    public static void clear() {
        currentTenant.remove();
    }
}
