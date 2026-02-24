package io.flowinquiry.modules.collab.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

import com.icegreen.greenmail.configuration.GreenMailConfiguration;
import com.icegreen.greenmail.junit5.GreenMailExtension;
import com.icegreen.greenmail.util.ServerSetupTest;
import io.flowinquiry.it.IntegrationTest;
import io.flowinquiry.modules.shared.Constants;
import io.flowinquiry.modules.usermanagement.service.dto.UserDTO;
import jakarta.mail.Multipart;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import java.io.ByteArrayOutputStream;
import java.util.regex.Pattern;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

/** Integration tests for {@link MailService}. */
@IntegrationTest
class MailServiceIT {

    private static final Pattern PATTERN_LOCALE_2 = Pattern.compile("([a-z]{2})-([a-z]{2})");
    private static final Pattern PATTERN_LOCALE_3 =
            Pattern.compile("([a-z]{2})-([a-zA-Z]{4})-([a-z]{2})");

    private static final String TEST_EMAIL = "john.doe@example.com";
    private static final String TEST_SUBJECT = "testSubject";
    private static final String TEST_CONTENT = "testContent";

    @MockitoBean private JavaMailSender javaMailSender;
    @Autowired private MailService mailService;

    @RegisterExtension
    static GreenMailExtension greenMail =
            new GreenMailExtension(ServerSetupTest.SMTP)
                    .withConfiguration(
                            GreenMailConfiguration.aConfig()
                                    .withUser("noreply@example.com", "user", "pass"))
                    .withPerMethodLifecycle(true);

    @BeforeEach
    public void setup() {
        doNothing().when(javaMailSender).send(any(MimeMessage.class));
        when(javaMailSender.createMimeMessage()).thenReturn(new MimeMessage((Session) null));
    }

    @Test
    void testSendEmail() throws Exception {
        testBasicEmail(false, false);
    }

    @Test
    void testSendHtmlEmail() throws Exception {
        testBasicEmail(false, true);
    }

    @Test
    void testSendMultipartEmail() throws Exception {
        testMultipartEmail(false);
    }

    @Test
    void testSendMultipartHtmlEmail() throws Exception {
        testMultipartEmail(true);
    }

    @Test
    void testSendActivationEmail() throws Exception {
        testUserTemplateEmail(EmailType.ACTIVATION);
    }

    @Test
    void testCreationEmail() throws Exception {
        testUserTemplateEmail(EmailType.CREATION);
    }

    @Test
    void testSendPasswordResetMail() throws Exception {
        testUserTemplateEmail(EmailType.PASSWORD_RESET);
    }

    @Test
    void testSendEmailWithException() {
        doThrow(MailSendException.class).when(javaMailSender).send(any(MimeMessage.class));
        try {
            mailService.sendEmail(TEST_EMAIL, TEST_SUBJECT, TEST_CONTENT, false, false);
        } catch (Exception e) {
            fail("Exception shouldn't have been thrown");
        }
    }

    /**
     * Helper method to test basic email functionality
     *
     * @param isMultipart whether the email is multipart
     * @param isHtml whether the email is HTML
     */
    private void testBasicEmail(boolean isMultipart, boolean isHtml) throws Exception {
        mailService.sendEmail(TEST_EMAIL, TEST_SUBJECT, TEST_CONTENT, isMultipart, isHtml);

        greenMail.waitForIncomingEmail(1);
        MimeMessage[] receivedMessages = greenMail.getReceivedMessages();
        assertThat(receivedMessages).hasSize(1);
        MimeMessage receivedMessage = receivedMessages[0];

        // Common assertions for all email types
        assertThat(receivedMessage.getSubject()).isEqualTo(TEST_SUBJECT);
        assertThat(receivedMessage.getAllRecipients()[0]).hasToString(TEST_EMAIL);
        assertThat(receivedMessage.getFrom()[0]).hasToString(mailService.getFrom());

        if (!isMultipart) {
            assertThat(receivedMessage.getContent()).isEqualTo(TEST_CONTENT);
            assertThat(receivedMessage.getContent()).isInstanceOf(String.class);
            String expectedContentType =
                    isHtml ? "text/html;charset=UTF-8" : "text/plain; charset=UTF-8";
            assertThat(receivedMessage.getDataHandler().getContentType())
                    .isEqualTo(expectedContentType);
        }
    }

    /**
     * Helper method to test multipart email functionality
     *
     * @param isHtml whether the email is HTML
     */
    private void testMultipartEmail(boolean isHtml) throws Exception {
        mailService.sendEmail(TEST_EMAIL, TEST_SUBJECT, TEST_CONTENT, true, isHtml);

        greenMail.waitForIncomingEmail(1);
        MimeMessage[] receivedMessages = greenMail.getReceivedMessages();
        assertThat(receivedMessages).hasSize(1);
        MimeMessage receivedMessage = receivedMessages[0];

        // Common assertions for multipart emails
        assertThat(receivedMessage.getSubject()).isEqualTo(TEST_SUBJECT);
        assertThat(receivedMessage.getAllRecipients()[0]).hasToString(TEST_EMAIL);
        assertThat(receivedMessage.getFrom()[0]).hasToString(mailService.getFrom());
        assertThat(receivedMessage.getContent()).isInstanceOf(Multipart.class);

        // Extract and verify content type
        MimeMultipart mp = (MimeMultipart) receivedMessage.getContent();
        MimeBodyPart part =
                (MimeBodyPart) ((MimeMultipart) mp.getBodyPart(0).getContent()).getBodyPart(0);
        ByteArrayOutputStream aos = new ByteArrayOutputStream();
        part.writeTo(aos);

        String expectedContentType =
                isHtml ? "text/html;charset=UTF-8" : "text/plain; charset=UTF-8";
        assertThat(part.getDataHandler().getContentType()).isEqualTo(expectedContentType);
    }

    /** Enum to represent the different types of template emails */
    private enum EmailType {
        ACTIVATION,
        CREATION,
        PASSWORD_RESET
    }

    /**
     * Helper method to test template emails
     *
     * @param emailType the type of template email to test
     */
    private void testUserTemplateEmail(EmailType emailType) throws Exception {
        UserDTO user = new UserDTO();
        user.setLangKey(Constants.DEFAULT_LANGUAGE);
        user.setEmail(TEST_EMAIL);

        switch (emailType) {
            case ACTIVATION:
                mailService.sendActivationEmail(user);
                break;
            case CREATION:
                mailService.sendCreationEmail(user);
                break;
            case PASSWORD_RESET:
                mailService.sendPasswordResetMail(user);
                break;
        }

        greenMail.waitForIncomingEmail(1);
        MimeMessage[] receivedMessages = greenMail.getReceivedMessages();
        assertThat(receivedMessages).hasSize(1);
        MimeMessage receivedMessage = receivedMessages[0];

        // Common assertions for all template emails
        assertThat(receivedMessage.getAllRecipients()[0]).hasToString(user.getEmail());
        assertThat(receivedMessage.getFrom()[0]).hasToString(mailService.getFrom());
        assertThat(receivedMessage.getContent().toString()).isNotEmpty();
        assertThat(receivedMessage.getDataHandler().getContentType())
                .isEqualTo("text/html;charset=UTF-8");
    }
}
