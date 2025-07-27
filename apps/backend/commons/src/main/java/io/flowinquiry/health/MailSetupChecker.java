package io.flowinquiry.health;

import io.flowinquiry.modules.collab.service.MailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("prod")
@Slf4j
public class MailSetupChecker implements ApplicationRunner {

    private final MailService mailService;

    public MailSetupChecker(MailService mailService) {
        this.mailService = mailService;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (mailService.isMailEnabled()) {
            log.info("Mail settings are found");
        } else {
            log.warn("Email provider is not configured yet");
        }
    }
}
