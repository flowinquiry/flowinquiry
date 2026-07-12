package io.flowinquiry.modules.ai.service;

import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.google.genai.GoogleGenAiChatModel;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * ChatModelService implementation backed by Google Gemini via Spring AI's Google GenAI starter.
 *
 * <p>This bean is only activated when both {@code GEMINI_CHAT_MODEL} and {@code GEMINI_API_KEY}
 * environment variables (or application properties) are present, following the same conditional
 * pattern used by {@link OpenAiChatModelService} and {@link OllamaChatModelService}.
 */
@Service
@ConditionalOnProperty(
        name = {"GEMINI_CHAT_MODEL", "GEMINI_API_KEY"},
        matchIfMissing = false)
public class GeminiChatModelService implements ChatModelService {

    private final GoogleGenAiChatModel geminiChatModel;

    public GeminiChatModelService(GoogleGenAiChatModel geminiChatModel) {
        this.geminiChatModel = geminiChatModel;
    }

    @Override
    public String call(String input) {
        return geminiChatModel.call(input);
    }

    @Override
    public String call(Prompt prompt) {
        ChatResponse response = geminiChatModel.call(prompt);
        Generation generation = response.getResult();
        return (generation != null) ? generation.getOutput().getText() : "";
    }
}
