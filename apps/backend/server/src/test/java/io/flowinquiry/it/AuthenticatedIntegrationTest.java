package io.flowinquiry.it;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.context.annotation.Import;

/** Integration test with a default authenticated MockMvc request. */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@IntegrationTest
@Import(AuthenticatedMockMvcConfiguration.class)
public @interface AuthenticatedIntegrationTest {}
