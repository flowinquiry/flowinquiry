package io.flowinquiry.tenant.context;

import java.util.UUID;

public class TenantContext {
    private static final ThreadLocal<UUID> currentTenant = new ThreadLocal<>();

    private static final ThreadLocal<Boolean> suppress = ThreadLocal.withInitial(() -> false);

    public static boolean isFilterSuppressed() {
        return suppress.get();
    }

    public static void suppressFiltering() {
        suppress.set(true);
    }

    public static void restoreFiltering() {
        suppress.remove();
    }

    public static void setTenantId(UUID tenantId) {
        currentTenant.set(tenantId);
    }

    public static UUID getTenantId() {
        if (suppress.get()) return null;
        UUID tenantId = currentTenant.get();
        if (tenantId == null) throw new IllegalStateException("Tenant ID is not set");
        return tenantId;
    }

    public static void clear() {
        currentTenant.remove();
    }
}
