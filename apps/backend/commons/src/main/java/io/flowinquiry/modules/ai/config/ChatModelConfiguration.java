package io.flowinquiry.modules.ai.config;

import io.flowinquiry.modules.ai.service.ChatModelService;
import io.flowinquiry.modules.ai.service.GeminiChatModelService;
import io.flowinquiry.modules.ai.service.OllamaChatModelService;
import io.flowinquiry.modules.ai.service.OpenAiChatModelService;
import java.util.Optional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class ChatModelConfiguration {

    /**
     * Selects a primary {@link ChatModelService} bean based on provider precedence:
     * Ollama &gt; OpenAI &gt; Gemini.
     *
     * <p>The {@code @ConditionalOnBean} condition ensures this bean is only created when at least
     * one of the three provider services is available, preventing an ambiguous-bean conflict at
     * start-up when none are configured.
     */
    @Bean
    @Primary
    @ConditionalOnBean({OllamaChatModelService.class, OpenAiChatModelService.class, GeminiChatModelService.class})
    public ChatModelService chatModel(
            Optional<OllamaChatModelService> ollamaChatModelService,
            Optional<OpenAiChatModelService> openAiChatModelService,
            Optional<GeminiChatModelService> geminiChatModelService) {

        if (ollamaChatModelService.isPresent()) {
            return ollamaChatModelService.get();
        } else if (openAiChatModelService.isPresent()) {
            return openAiChatModelService.get();
        } else if (geminiChatModelService.isPresent()) {
            return geminiChatModelService.get();
        }

        // Unreachable — @ConditionalOnBean guarantees at least one is present.
        return null;
    }
}
