package io.flowinquiry.modules.collab.service;

import com.fasterxml.jackson.databind.JsonNode;
import io.flowinquiry.modules.collab.domain.EmailJob;
import io.flowinquiry.modules.collab.domain.EmailJobStatus;
import io.flowinquiry.modules.collab.repository.EmailJobRepository;
import jakarta.annotation.Nullable;
import org.springframework.stereotype.Service;

@Service
public class EmailJobService {

    private final EmailJobRepository emailJobRepository;

    public EmailJobService(EmailJobRepository emailJobRepository) {
        this.emailJobRepository = emailJobRepository;
    }

    public void enqueueEmailJob(
            String name,
            String email,
            String locale,
            String templateKey,
            JsonNode context,
            JsonNode attachments,
            @Nullable String subjectOverride) {
        EmailJob job = new EmailJob();
        job.setRecipients(combineNameAndEmail(name, email));
        job.setRecipientLocale(locale);
        job.setTemplateKey(templateKey);
        job.setTemplateContext(context);
        job.setAttachments(attachments);
        job.setSubjectOverride(subjectOverride);
        job.setStatus(EmailJobStatus.PENDING);
        emailJobRepository.save(job);
    }

    public void enqueueEmailJob(
            String name, String email, String locale, String templateKey, JsonNode context) {
        EmailJob job = new EmailJob();
        job.setRecipients(combineNameAndEmail(name, email));
        job.setRecipientLocale(locale);
        job.setTemplateKey(templateKey);
        job.setTemplateContext(context);
        job.setStatus(EmailJobStatus.PENDING);
        emailJobRepository.save(job);
    }

    private static String combineNameAndEmail(String name, String email) {
        return String.format("%s <%s>", name, email);
    }
}
