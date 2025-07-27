package io.flowinquiry.config;

import static java.net.URLDecoder.decode;

import jakarta.servlet.ServletContext;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.server.WebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.boot.web.servlet.ServletContextInitializer;
import org.springframework.boot.web.servlet.server.ConfigurableServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.data.web.config.PageableHandlerMethodArgumentResolverCustomizer;
import org.springframework.util.CollectionUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/** Configuration of web application with Servlet 3.0 APIs. */
@Configuration
@Slf4j
public class WebConfigurer
        implements ServletContextInitializer, WebServerFactoryCustomizer<WebServerFactory> {

    private final Environment env;

    private final FlowInquiryProperties flowInquiryProperties;

    public WebConfigurer(Environment env, FlowInquiryProperties flowInquiryProperties) {
        this.env = env;
        this.flowInquiryProperties = flowInquiryProperties;
    }

    @Override
    public void onStartup(ServletContext servletContext) {
        if (env.getActiveProfiles().length != 0) {
            log.info(
                    "Web application configuration, using profiles: {}",
                    (Object[]) env.getActiveProfiles());
        }

        log.info("Web application fully configured");
    }

    /** Customize the Servlet engine: Mime types, the document root, the cache. */
    @Override
    public void customize(WebServerFactory server) {
        setLocationForStaticAssets(server);
    }

    private void setLocationForStaticAssets(WebServerFactory server) {
        if (server instanceof ConfigurableServletWebServerFactory servletWebServer) {
            File root;
            String prefixPath = resolvePathPrefix();
            root = new File(prefixPath + "build/resources/main/static/");
            if (root.exists() && root.isDirectory()) {
                servletWebServer.setDocumentRoot(root);
            }
        }
    }

    /** Resolve path prefix to static resources. */
    private String resolvePathPrefix() {
        String fullExecutablePath =
                decode(
                        Objects.requireNonNull(this.getClass().getResource("")).getPath(),
                        StandardCharsets.UTF_8);
        String rootPath = Paths.get(".").toUri().normalize().getPath();
        String extractedPath = fullExecutablePath.replace(rootPath, "");
        int extractionEndIndex = extractedPath.indexOf("build/");
        if (extractionEndIndex <= 0) {
            return "";
        }
        return extractedPath.substring(0, extractionEndIndex);
    }

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = flowInquiryProperties.getCors();
        if (!CollectionUtils.isEmpty(config.getAllowedOrigins())
                || !CollectionUtils.isEmpty(config.getAllowedOriginPatterns())) {
            log.debug("Registering CORS filter");
            source.registerCorsConfiguration("/api/**", config);
            source.registerCorsConfiguration("/management/**", config);
        }
        return new CorsFilter(source);
    }

    // Start pageable index from 1
    @Bean
    public PageableHandlerMethodArgumentResolverCustomizer paginationCustomizer() {
        return pageableResolver -> {
            pageableResolver.setOneIndexedParameters(true); // default is false, starts with 0
        };
    }
}
