package io.flowinquiry.modules.collab.service;

import io.flowinquiry.modules.collab.EmailContext;
import io.flowinquiry.modules.collab.service.event.MailSettingsUpdatedEvent;
import io.flowinquiry.modules.usermanagement.service.dto.UserDTO;
import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Properties;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.event.EventListener;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

/**
 * Service for sending emails asynchronously.
 *
 * <p>We use the {@link Async} annotation to send emails asynchronously.
 */
@Service
@Slf4j
public class MailService {

    private static final String USER = "user";
    private static final String BASE_URL = "baseUrl";

    static final String HOST_SETTING = "mail.host";
    static final String PORT_SETTING = "mail.port";
    static final String USERNAME_SETTING = "mail.username";
    static final String PASSWORD_SETTING = "mail.password";
    static final String PROTOCOL_SETTING = "mail.protocol";
    static final String SMTP_AUTH_SETTING = "mail.smtp.auth";
    static final String SMTP_STARTTLS_SETTING = "mail.smtp.starttls.enable";
    static final String DEBUG_SETTING = "mail.debug";
    static final String FROM_SETTING = "mail.from";
    static final String BASE_URL_SETTING = "mail.base_url";

    private final AppSettingService appSettingService;
    private final MessageSource messageSource;
    private final SpringTemplateEngine templateEngine;

    private JavaMailSenderImpl mailSender;

    @Getter private boolean mailEnabled = false;

    @Getter private String from = "undefined";

    @Getter private String baseUrl;

    public MailService(
            AppSettingService appSettingService,
            MessageSource messageSource,
            SpringTemplateEngine templateEngine) {
        this.appSettingService = appSettingService;
        this.messageSource = messageSource;
        this.templateEngine = templateEngine;
    }

    @PostConstruct
    public void init() {
        reloadMailSender();
    }

    @EventListener
    public void onMailSettingsUpdated(MailSettingsUpdatedEvent event) {
        log.info("Mail settings changed — reloading mail sender.");
        reloadMailSender();
    }

    private void reloadMailSender() {
        String host = appSettingService.getValue(HOST_SETTING).orElse(null);
        String portStr = appSettingService.getValue(PORT_SETTING).orElse(null);

        if (host == null || portStr == null) {
            mailEnabled = false;
            log.warn("MailService not configured. 'mail.host' or 'mail.port' is missing.");
            return;
        }

        try {
            JavaMailSenderImpl sender = new JavaMailSenderImpl();
            sender.setHost(host);
            sender.setPort(Integer.parseInt(portStr));
            sender.setUsername(appSettingService.getValue(USERNAME_SETTING).orElse(""));
            sender.setPassword(appSettingService.getDecryptedValue(PASSWORD_SETTING).orElse(""));

            Properties props = sender.getJavaMailProperties();
            props.put(
                    "mail.transport.protocol",
                    appSettingService.getValue(PROTOCOL_SETTING).orElse("smtp"));
            props.put(
                    "mail.smtp.auth", appSettingService.getValue(SMTP_AUTH_SETTING).orElse("true"));
            props.put(
                    "mail.smtp.starttls.enable",
                    appSettingService.getValue(SMTP_STARTTLS_SETTING).orElse("true"));
            props.put("mail.debug", appSettingService.getValue(DEBUG_SETTING).orElse("false"));

            from = appSettingService.getValue(FROM_SETTING).orElse("undefined");
            baseUrl = appSettingService.getValue(BASE_URL_SETTING).orElse("");

            this.mailSender = sender;
            this.mailEnabled = true;
            log.info("MailService configured and ready to send emails.");
        } catch (Exception ex) {
            this.mailEnabled = false;
            log.error(
                    "Failed to initialize MailService due to invalid config: {}",
                    ex.getMessage(),
                    ex);
        }
    }

    @Async
    public void sendEmail(
            String to, String subject, String content, boolean isMultipart, boolean isHtml) {
        if (mailEnabled && mailSender != null) {
            sendEmailSync(mailSender, to, subject, content, isMultipart, isHtml);
        }
    }

    private void sendEmailSync(
            JavaMailSender sender,
            String to,
            String subject,
            String content,
            boolean isMultipart,
            boolean isHtml) {
        log.debug(
                "Send email[multipart '{}' and html '{}'] to '{}' with subject '{}' and content={}",
                isMultipart,
                isHtml,
                to,
                subject,
                content);

        try {
            MimeMessage mimeMessage = sender.createMimeMessage();
            MimeMessageHelper message =
                    new MimeMessageHelper(mimeMessage, isMultipart, StandardCharsets.UTF_8.name());
            message.setTo(to);
            message.setFrom(from);
            message.setSubject(subject);
            message.setText(content, isHtml);
            sender.send(mimeMessage);
            log.debug("Sent email to User '{}'", to);
        } catch (MailException | MessagingException e) {
            log.warn("Email could not be sent to user '{}'", to, e);
        }
    }

    @Async
    public void sendEmailFromTemplate(UserDTO user, String templateName, String titleKey) {
        if (user.getEmail() == null) {
            log.debug("Email doesn't exist for user '{}'", user);
            return;
        }
        Locale locale = Locale.forLanguageTag(user.getLangKey() != null ? user.getLangKey() : "en");
        Context context = new Context(locale);
        context.setVariable(USER, user);
        context.setVariable(BASE_URL, baseUrl);
        String content = templateEngine.process(templateName, context);
        String subject = messageSource.getMessage(titleKey, null, locale);

        this.sendEmail(user.getEmail(), subject, content, false, true);
    }

    @Async
    public void sendEmail(EmailContext emailContext) {
        if (emailContext.getToUser() == null
                || emailContext.getToUser().getEmail() == null
                || emailContext.getSubject() == null) {
            log.debug(
                    "Email doesn't exist for user '{}' or no subject for email context '{}'",
                    emailContext.getToUser(),
                    emailContext.getSubject());
            return;
        }
        emailContext.addVariable(USER, emailContext.getToUser());
        String content =
                templateEngine.process(
                        emailContext.getTemplate(), emailContext.getThymeleafContext());
        this.sendEmail(
                emailContext.getToUser().getEmail(),
                emailContext.getSubject(),
                content,
                false,
                true);
    }

    @Async
    public void sendActivationEmail(UserDTO user) {
        log.debug("Sending activation email to '{}'", user.getEmail());
        this.sendEmailFromTemplate(user, "mail/activationEmail", "email.activation.title");
    }

    @Async
    public void sendCreationEmail(UserDTO user) {
        log.debug("Sending creation email to '{}'", user.getEmail());
        this.sendEmailFromTemplate(user, "mail/creationEmail", "email.activation.title");
    }

    @Async
    public void sendPasswordResetMail(UserDTO user) {
        log.debug("Sending password reset email to '{}'", user.getEmail());
        this.sendEmailFromTemplate(user, "mail/passwordResetEmail", "email.reset.title");
    }
}
