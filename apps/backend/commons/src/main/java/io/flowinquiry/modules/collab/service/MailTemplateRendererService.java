package io.flowinquiry.modules.collab.service;

import io.flowinquiry.modules.collab.domain.RenderedEmail;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.yaml.snakeyaml.Yaml;

/**
 * Service for rendering email templates using Thymeleaf template engine. This service processes
 * templates with YAML frontmatter containing metadata such as the email subject, and renders the
 * template body using Thymeleaf. Templates are loaded from the classpath and can be localized based
 * on the provided locale.
 */
@Service
public class MailTemplateRendererService {

    private final SpringTemplateEngine templateEngine;

    private final Yaml yaml;

    /**
     * Constructs a new MailTemplateRendererService with the required dependencies.
     *
     * @param templateEngine The Spring Template Engine used for processing Thymeleaf templates
     */
    public MailTemplateRendererService(SpringTemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
        yaml = new Yaml();
    }

    /**
     * Renders an email template with the given context and locale.
     *
     * @param templateKey The key identifying the template to render
     * @param context The Thymeleaf context containing variables for template rendering
     * @param locale The locale to use for template selection and rendering
     * @return A RenderedEmail object containing the rendered subject and body
     * @throws IOException If the template cannot be read or processed
     * @throws FileNotFoundException If the template file is not found
     * @throws IllegalArgumentException If the template format is invalid
     */
    public RenderedEmail render(String templateKey, Context context, Locale locale)
            throws IOException {
        String filename = templateKey + "." + locale.getLanguage() + ".yaml.md";
        String resourcePath = "templates/mail/" + filename;
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(resourcePath)) {
            if (is == null) {
                throw new FileNotFoundException("Template not found in classpath: " + resourcePath);
            }

            String raw = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            ParsedTemplate parsed = parseTemplate(raw);

            String subject = renderTemplate(parsed.subject, context);
            String body = renderTemplate(parsed.body, context);

            return new RenderedEmail(subject, body);
        }
    }

    private ParsedTemplate parseTemplate(String raw) {
        if (!raw.startsWith("---"))
            throw new IllegalArgumentException("Template must start with frontmatter");

        int secondDelimiter = raw.indexOf("---", 3);
        if (secondDelimiter == -1)
            throw new IllegalArgumentException("Template missing second frontmatter delimiter");

        String yamlSection = raw.substring(3, secondDelimiter).trim();
        String markdown = raw.substring(secondDelimiter + 3).trim();

        Map<String, Object> metadata = yaml.load(yamlSection);
        String subject = (String) metadata.get("subject");
        if (subject == null) throw new IllegalArgumentException("Missing 'subject' in frontmatter");

        return new ParsedTemplate(subject, markdown);
    }

    private String renderTemplate(String templateString, Context context) throws IOException {

        return templateEngine.process(templateString, context);
    }

    private record ParsedTemplate(String subject, String body) {}
}
