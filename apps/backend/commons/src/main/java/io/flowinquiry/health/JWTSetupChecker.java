package io.flowinquiry.health;

import io.flowinquiry.config.FlowInquiryProperties;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class JWTSetupChecker implements ApplicationRunner {

    private final FlowInquiryProperties flowInquiryProperties;

    public JWTSetupChecker(FlowInquiryProperties flowInquiryProperties) {
        this.flowInquiryProperties = flowInquiryProperties;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (StringUtils.isEmpty(
                flowInquiryProperties
                        .getSecurity()
                        .getAuthentication()
                        .getJwt()
                        .getBase64Secret())) {
            throw new IllegalArgumentException("JWT secret is missing");
        } else {
            log.info("JWT secret found and ready to use");
        }
    }
}
