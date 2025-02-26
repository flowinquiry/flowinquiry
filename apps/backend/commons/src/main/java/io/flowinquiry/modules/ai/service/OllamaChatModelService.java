package io.flowinquiry.modules.ai.service;

import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(
        name = {"OLLAMA_CHAT_MODEL", "OLLAMA_API_KEY"},
        matchIfMissing = false)
public class OllamaChatModelService implements ChatModelService {

    private OllamaChatModel olamaChatModel;

    @Override
    public String call(String input) {
        return "Response from Ollama: " + input;
    }

    @Override
    public String call(Prompt prompt) {
        return "";
    }
}
