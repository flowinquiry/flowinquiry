package io.flowinquiry.it;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Spring Boot 4 Testcontainers configuration using {@code @ServiceConnection}.
 *
 * <p>Import this class in integration tests that need a PostgreSQL database:
 *
 * <pre>{@code
 * @SpringBootTest
 * @Import(TestcontainersConfiguration.class)
 * class MyIT { ... }
 * }</pre>
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

    @Bean
    @ServiceConnection
    PostgreSQLContainer<?> postgresContainer() {
        return new PostgreSQLContainer<>("postgres:latest")
                .withDatabaseName("test")
                .withUsername("test")
                .withPassword("test")
                // Make every connection default to flowinquiry schema
                .withCommand("postgres", "-c", "search_path=flowinquiry,public");
    }
}
