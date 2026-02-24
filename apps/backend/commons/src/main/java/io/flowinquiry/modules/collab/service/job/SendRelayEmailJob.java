package io.flowinquiry.modules.collab.service.job;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.flowinquiry.modules.collab.domain.EmailJob;
import io.flowinquiry.modules.collab.domain.EmailJobStatus;
import io.flowinquiry.modules.collab.domain.RenderedEmail;
import io.flowinquiry.modules.collab.repository.EmailJobRepository;
import io.flowinquiry.modules.collab.service.AppSettingService;
import io.flowinquiry.modules.collab.service.MailService;
import io.flowinquiry.modules.collab.service.MailTemplateRendererService;
import jakarta.annotation.PostConstruct;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.Limit;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.thymeleaf.context.Context;

@Slf4j
@Profile("!test")
@Component
public class SendRelayEmailJob {
    private static final int MAX_RETRIES = 3;
    private static final int EMAIL_JOB_BATCH_LIMIT = 500;

    private static final String BASE_URL = "baseUrl";
    static final String BASE_URL_SETTING = "mail.base_url";

    private final EmailJobRepository emailJobRepository;
    private final MailTemplateRendererService emailTemplateRenderer;
    private final AppSettingService appSettingService;
    private final MailService emailSender;

    private String baseUrl;

    public SendRelayEmailJob(
            EmailJobRepository emailJobRepository,
            MailTemplateRendererService emailTemplateRenderer,
            MailService emailSender,
            AppSettingService appSettingService) {
        this.emailJobRepository = emailJobRepository;
        this.emailTemplateRenderer = emailTemplateRenderer;
        this.emailSender = emailSender;
        this.appSettingService = appSettingService;
    }

    @PostConstruct
    public void init() {
        this.baseUrl = appSettingService.getValue(BASE_URL_SETTING).orElse("");
    }

    @SchedulerLock(name = "SendRelayEmailJob", lockAtMostFor = "1h")
    @Scheduled(fixedRate = 60000)
    public void run() {
        List<EmailJob> jobs =
                emailJobRepository.findByStatusOrderByCreatedAtAsc(
                        EmailJobStatus.PENDING, Limit.of(EMAIL_JOB_BATCH_LIMIT));

        if (jobs.isEmpty()) {
            log.debug("No pending email jobs found.");
            return;
        }

        ObjectMapper objectMapper = new ObjectMapper();

        for (EmailJob job : jobs) {
            try {
                Locale locale =
                        Locale.forLanguageTag(
                                Optional.ofNullable(job.getRecipientLocale()).orElse("en"));
                Context context = prepareContext(job, locale, objectMapper);
                RenderedEmail rendered =
                        emailTemplateRenderer.render(job.getTemplateKey(), context, locale);

                String subject =
                        Optional.ofNullable(job.getSubjectOverride()).orElse(rendered.subject());
                emailSender.sendEmail(job.getRecipients(), subject, rendered.body(), false, true);

                job.setStatus(EmailJobStatus.SENT);
                log.info("Email job {} sent successfully.", job.getId());
            } catch (Exception ex) {
                job.setRetries(job.getRetries() + 1);
                log.error("Failed to send email job {}: {}", job.getId(), ex.getMessage(), ex);
                if (job.getRetries() >= MAX_RETRIES) {
                    job.setStatus(EmailJobStatus.FAILED);
                    log.warn(
                            "Email job {} marked as FAILED after {} retries.",
                            job.getId(),
                            MAX_RETRIES);
                }
            }

            job.setUpdatedAt(Instant.now());
            emailJobRepository.save(job);
        }
    }

    private Context prepareContext(EmailJob job, Locale locale, ObjectMapper objectMapper) {
        Context context = new Context(locale);
        Map<String, Object> contextMap =
                objectMapper.convertValue(job.getTemplateContext(), new TypeReference<>() {});
        context.setVariable(BASE_URL, baseUrl);
        context.setVariables(contextMap);
        return context;
    }
}
