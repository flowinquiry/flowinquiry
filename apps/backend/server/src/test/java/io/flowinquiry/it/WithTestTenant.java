package io.flowinquiry.it;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.junit.jupiter.api.extension.ExtendWith;

/**
 * Annotation for setting up a specific tenant context in tests for a multi-tenant application. When
 * applied to a test class or method, it automatically sets the specified tenant ID in the {@link
 * io.flowinquiry.tenant.context.TenantContext} before test execution and clears it afterward.
 *
 * <p>This annotation is processed by {@link WithTestTenantExtension} which handles the tenant
 * context setup and cleanup.
 *
 * <p>Example usage:
 *
 * <pre>{@code
 * @WithTestTenant
 * class MyTenantTest {
 *     // Tests will run with the default tenant ID
 * }
 *
 * @WithTestTenant("00000000-0000-0000-0000-000000000002")
 * void testWithSpecificTenant() {
 *     // This test will run with the specified tenant ID
 * }
 * }</pre>
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
@ExtendWith(WithTestTenantExtension.class)
public @interface WithTestTenant {
    /**
     * The tenant ID to use for the test(s).
     *
     * @return a string representation of the UUID to be used as tenant ID
     */
    String value() default "00000000-0000-0000-0000-000000000001";
}
