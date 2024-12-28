package io.flowinquiry.modules.teams.domain;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import java.io.IOException;

@JsonSerialize(using = TicketChannel.TicketChannelSerializer.class)
@JsonDeserialize(using = TicketChannel.TicketChannelDeserializer.class)
public enum TicketChannel {
    EMAIL("Email"),
    PHONE("Phone"),
    WEB_PORTAL("Web Portal"),
    CHAT("Chat"),
    SOCIAL_MEDIA("Social Media"),
    IN_PERSON("In-person"),
    MOBILE_APP("Mobile App"),
    API("API"),
    SYSTEM_GENERATED("System-generated"),
    INTERNAL("Internal");

    private final String displayName;

    TicketChannel(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    // Reverse lookup with case-insensitive comparison
    public static TicketChannel fromDisplayName(String displayName) {
        if (displayName == null) {
            throw new IllegalArgumentException("Display name cannot be null");
        }
        for (TicketChannel channel : values()) {
            if (channel.displayName.equalsIgnoreCase(displayName.trim())) {
                return channel;
            }
        }
        throw new IllegalArgumentException("Unknown display name: " + displayName);
    }

    public static class TicketChannelSerializer extends JsonSerializer<TicketChannel> {
        @Override
        public void serialize(
                TicketChannel value, JsonGenerator gen, SerializerProvider serializers)
                throws IOException {
            gen.writeString(value.getDisplayName()); // Serialize the human-readable value
        }
    }

    public static class TicketChannelDeserializer extends JsonDeserializer<TicketChannel> {
        @Override
        public TicketChannel deserialize(JsonParser p, DeserializationContext ctxt)
                throws IOException {
            String value = p.getText();
            return TicketChannel.fromDisplayName(value); // Use the method from the enum
        }
    }
}
