package io.flowinquiry.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Configuration for OpenAPI documentation. */
@Configuration
public class OpenApiConfiguration {

    /**
     * OpenAPI configuration bean.
     *
     * @return the OpenAPI configuration
     */
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(
                        new Info()
                                .title("Flow Inquiry API")
                                .description("Flow Inquiry REST API Documentation")
                                .version("1.0.0")
                                //                                .extensions(
                                //                                        Map.of(
                                //                                                "x-logo",
                                //                                                Map.of(
                                //                                                        "url",
                                //
                                // "https://docs.flowinquiry.io/api-docs/logo-light.svg",
                                //
                                // "backgroundColor", "#FFFFFF",
                                //                                                        "altText",
                                // "FlowInquiry logo")))
                                .license(
                                        new License()
                                                .name("AGPLv3")
                                                .url("https://opensource.org/license/agpl-v3")))
                .addServersItem(new Server().url("https://flowinquiry.io"))
                .components(
                        new Components()
                                .addSecuritySchemes(
                                        "bearer-jwt",
                                        new SecurityScheme()
                                                .type(SecurityScheme.Type.HTTP)
                                                .scheme("bearer")
                                                .bearerFormat("JWT")
                                                .in(SecurityScheme.In.HEADER)
                                                .name("Authorization")))
                .addSecurityItem(new SecurityRequirement().addList("bearer-jwt"));
    }
}
