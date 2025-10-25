package io.flowinquiry.modules.collab.domain;

import com.fasterxml.jackson.databind.JsonNode;
import io.flowinquiry.utils.JsonNodeConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "fw_email_job")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class EmailJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Comma-separated list of recipients with their names and email addresses,
    // e.g., "John Doe <john@example.com>, Jane Smith <jane@example.com>"
    @Column(nullable = false, columnDefinition = "TEXT")
    private String recipients;

    // Comma-separated list of CC recipients with their names and email addresses
    @Column(name = "cc_recipients", columnDefinition = "TEXT")
    private String ccRecipients;

    // Comma-separated list of BCC recipients with their names and email addresses
    @Column(name = "bcc_recipients", columnDefinition = "TEXT")
    private String bccRecipients;

    private String recipientLocale;

    private String templateKey;

    @Column(columnDefinition = "jsonb")
    @Convert(converter = JsonNodeConverter.class)
    private JsonNode templateContext;

    private String subjectOverride;

    @Column(columnDefinition = "jsonb")
    @Convert(converter = JsonNodeConverter.class)
    private JsonNode attachments;

    @Enumerated(EnumType.STRING)
    private EmailJobStatus status = EmailJobStatus.PENDING;

    private int retries = 0;

    private Instant createdAt = Instant.now();

    private Instant updatedAt;
}
