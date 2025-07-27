package io.flowinquiry.it;

import io.flowinquiry.tenant.context.TenantContext;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.extension.AfterEachCallback;
import org.junit.jupiter.api.extension.BeforeEachCallback;
import org.junit.jupiter.api.extension.ExtensionContext;

public class WithTestTenantExtension implements BeforeEachCallback, AfterEachCallback {
    @Override
    public void beforeEach(ExtensionContext context) {
        Optional<WithTestTenant> annotation =
                context.getElement()
                        .flatMap(el -> Optional.ofNullable(el.getAnnotation(WithTestTenant.class)))
                        .or(
                                () ->
                                        context.getTestClass()
                                                .map(
                                                        cls ->
                                                                cls.getAnnotation(
                                                                        WithTestTenant.class)));

        annotation.ifPresent(a -> TenantContext.setTenantId(UUID.fromString(a.value())));
    }

    @Override
    public void afterEach(ExtensionContext context) {
        TenantContext.clear();
    }
}
