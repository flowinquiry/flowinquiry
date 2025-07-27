package io.flowinquiry.it;

import io.flowinquiry.tenant.context.TenantContext;
import java.lang.reflect.AnnotatedElement;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.extension.AfterEachCallback;
import org.junit.jupiter.api.extension.BeforeEachCallback;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.springframework.core.annotation.AnnotationUtils;

public class WithTestTenantExtension implements BeforeEachCallback, AfterEachCallback {
    @Override
    public void beforeEach(ExtensionContext context) {
        Optional<AnnotatedElement> testElement = context.getElement();

        // First try on method, then class
        WithTestTenant tenantAnnotation =
                testElement
                        .map(el -> AnnotationUtils.findAnnotation(el, WithTestTenant.class))
                        .orElseGet(
                                () ->
                                        AnnotationUtils.findAnnotation(
                                                Objects.requireNonNull(
                                                        context.getTestClass().orElse(null)),
                                                WithTestTenant.class));

        if (tenantAnnotation != null) {
            TenantContext.setTenantId(UUID.fromString(tenantAnnotation.value()));
        }
    }

    @Override
    public void afterEach(ExtensionContext context) {
        TenantContext.clear();
    }
}
