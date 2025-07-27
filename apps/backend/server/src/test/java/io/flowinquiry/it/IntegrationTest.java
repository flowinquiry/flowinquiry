package io.flowinquiry.it;

import io.flowinquiry.FlowInquiryApp;
import io.flowinquiry.config.FlowInquiryProperties;
import io.flowinquiry.config.JacksonConfiguration;
import io.flowinquiry.testcontainers.jdbc.EnablePostgreSQL;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Base composite annotation for integration tests in the Flow Inquiry application.
 *
 * <p>This annotation combines several Spring Boot test annotations to simplify the setup of
 * integration tests. It includes:
 *
 * <ul>
 *   <li>{@link SpringBootTest} configured with the main application class {@link FlowInquiryApp}
 *       and {@link JacksonConfiguration} for proper JSON serialization/deserialization
 *   <li>{@link EnableConfigurationProperties} to load {@link FlowInquiryProperties} for test
 *       configuration
 *   <li>{@code EnablePostgreSQL} to set up a PostgreSQL database for testing using Testcontainers
 * </ul>
 *
 * <p>Usage example:
 *
 * <pre>{@code
 * @IntegrationTest
 * class MyIntegrationTest {
 *     // Test methods
 * }
 * }</pre>
 *
 * <p>This annotation is designed to be used on test classes that require a fully configured
 * application context with database access for integration testing.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest(classes = {FlowInquiryApp.class, JacksonConfiguration.class})
@EnableConfigurationProperties({FlowInquiryProperties.class})
@EnablePostgreSQL
@WithTestTenant
public @interface IntegrationTest {}
