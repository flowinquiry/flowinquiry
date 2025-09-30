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
                        EmailJobStatus.PENDING, Limit.of(500));

        for (EmailJob job : jobs) {
            try {
                Locale locale =
                        Locale.forLanguageTag(
                                Optional.ofNullable(job.getRecipientLocale()).orElse("en"));
                Context context = new Context(locale);
                Map<String, Object> contextMap =
                        new ObjectMapper()
                                .convertValue(job.getTemplateContext(), new TypeReference<>() {});
                context.setVariable(BASE_URL, baseUrl);
                context.setVariables(contextMap);
                RenderedEmail rendered =
                        emailTemplateRenderer.render(job.getTemplateKey(), context, locale);

                String subject =
                        (job.getSubjectOverride() != null)
                                ? job.getSubjectOverride()
                                : rendered.subject();
                emailSender.sendEmail(job.getRecipients(), subject, rendered.body(), false, true);

                job.setStatus(EmailJobStatus.SENT);
            } catch (Exception ex) {
                job.setRetries(job.getRetries() + 1);
                if (job.getRetries() >= MAX_RETRIES) {
                    job.setStatus(EmailJobStatus.FAILED);
                }
            }

            job.setUpdatedAt(Instant.now());
            emailJobRepository.save(job);
        }
    }
}
