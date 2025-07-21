package io.flowinquiry.modules.teams.service.job;

import static org.assertj.core.api.Assertions.assertThat;

import com.icegreen.greenmail.configuration.GreenMailConfiguration;
import com.icegreen.greenmail.junit5.GreenMailExtension;
import com.icegreen.greenmail.util.ServerSetupTest;
import io.flowinquiry.IntegrationTest;
import io.flowinquiry.modules.collab.service.EntityWatcherService;
import io.flowinquiry.modules.collab.service.MailService;
import io.flowinquiry.modules.teams.service.TicketService;
import io.flowinquiry.modules.usermanagement.service.UserService;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.test.context.ActiveProfiles;

@IntegrationTest
@ActiveProfiles("test")
public class SendEmailForTicketOverdueIT {
    @Autowired private TicketService ticketService;

    @Autowired private EntityWatcherService entityWatcherService;

    @Autowired private UserService userService;

    @Autowired private MessageSource messageSource;

    @Autowired private MailService mailService;

    private SendEmailForTicketOverdue cron;

    @RegisterExtension
    static GreenMailExtension greenMail =
            new GreenMailExtension(ServerSetupTest.SMTP)
                    .withConfiguration(
                            GreenMailConfiguration.aConfig()
                                    .withUser("noreply@flowinquiry.io", "user", "pass"))
                    .withPerMethodLifecycle(true);

    @BeforeEach
    void setup() {
        cron =
                new SendEmailForTicketOverdue(
                        entityWatcherService,
                        mailService,
                        userService,
                        ticketService,
                        messageSource);
    }

    @AfterEach
    void tearDown() {
        greenMail.stop();
    }

    @Test
    void shouldSendEmailForOverdueTicket() throws jakarta.mail.MessagingException {

        cron.notifyWatchers();

        greenMail.waitForIncomingEmail(5000, 8);
        MimeMessage[] receivedMessages = greenMail.getReceivedMessages();
        assertThat(receivedMessages).hasSize(8);
        assertThat(receivedMessages[0].getAllRecipients()[0].toString())
                .isEqualTo("alice.johnson@flowinquiry.io");
        assertThat(receivedMessages[0].getSubject()).contains("Overdue");
    }
}
