package io.flowinquiry.config;

import static org.springframework.security.config.Customizer.withDefaults;

import io.flowinquiry.modules.usermanagement.AuthoritiesConstants;
import io.flowinquiry.modules.usermanagement.service.OAuth2UserService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.web.access.BearerTokenAccessDeniedHandler;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity(securedEnabled = true)
public class SecurityConfiguration {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, OAuth2UserService oauth2UserService)
            throws Exception {
        http.cors(withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(
                        authz ->
                                authz.requestMatchers(HttpMethod.POST, "/api/login")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.GET, "/login")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.POST, "/api/authenticate")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.GET, "/api/authenticate")
                                        .permitAll()
                                        .requestMatchers("/api/register")
                                        .permitAll()
                                        .requestMatchers("/api/files/**")
                                        .permitAll()
                                        .requestMatchers("/api/activate")
                                        .permitAll()
                                        .requestMatchers("/api/account/reset-password/init")
                                        .permitAll()
                                        .requestMatchers("/api/account/reset-password/finish")
                                        .permitAll()
                                        .requestMatchers("/oauth2/**")
                                        .permitAll()
                                        .requestMatchers("/api/auth/**")
                                        .permitAll()
                                        .requestMatchers("/actuator/health")
                                        .permitAll()
                                        .requestMatchers("/v3/api-docs.yaml")
                                        .permitAll()
                                        .requestMatchers("/swagger-ui/**")
                                        .permitAll()
                                        .requestMatchers("/swagger-ui.html")
                                        .permitAll()
                                        .requestMatchers("/api/admin/**")
                                        .hasAuthority(AuthoritiesConstants.ADMIN)
                                        .requestMatchers("/api/**")
                                        .authenticated()
                                        .requestMatchers("/management/**")
                                        .hasAuthority(AuthoritiesConstants.ADMIN))
                .oauth2Login(
                        oauth2 ->
                                oauth2.defaultSuccessUrl("/home", true)
                                        .userInfoEndpoint(
                                                userInfo ->
                                                        userInfo.userService(oauth2UserService)))
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(withDefaults()))
                .sessionManagement(
                        session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(
                        exceptions ->
                                exceptions
                                        .authenticationEntryPoint(
                                                new CustomBearerTokenAuthenticationEntryPoint())
                                        .accessDeniedHandler(new BearerTokenAccessDeniedHandler()));

        return http.build();
    }
}
