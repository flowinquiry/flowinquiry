package io.flowinquiry.it;

import io.flowinquiry.FlowInquiryApp;
import io.flowinquiry.config.FlowInquiryProperties;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

/**
 * Base composite annotation for integration tests in the Flow Inquiry application.
 *
 * <p>Combines {@link SpringBootTest}, the {@code test} Spring profile, a PostgreSQL Testcontainer
 * via {@link TestcontainersConfiguration}, and the {@link WithTestTenant} tenant context.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest(classes = {FlowInquiryApp.class})
@ActiveProfiles("test")
@AutoConfigureMockMvc
@EnableConfigurationProperties({FlowInquiryProperties.class})
@Import(TestcontainersConfiguration.class)
@WithTestTenant
public @interface IntegrationTest {}
