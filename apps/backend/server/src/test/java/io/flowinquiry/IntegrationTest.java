package io.flowinquiry;

import io.flowinquiry.config.FlowInquiryProperties;
import io.flowinquiry.config.JacksonConfiguration;
import io.flowinquiry.testcontainers.jdbc.EnablePostgreSQL;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.SpringBootTest;

/** Base composite annotation for integration tests. */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest(classes = {FlowInquiryApp.class, JacksonConfiguration.class})
@EnableConfigurationProperties({FlowInquiryProperties.class})
@EnablePostgreSQL
public @interface IntegrationTest {}
