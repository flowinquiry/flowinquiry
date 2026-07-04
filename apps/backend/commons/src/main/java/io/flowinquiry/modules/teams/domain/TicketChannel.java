package io.flowinquiry.modules.teams.domain;

import tools.jackson.core.JacksonException;
import tools.jackson.core.JsonGenerator;
import tools.jackson.core.JsonParser;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.SerializationContext;
import tools.jackson.databind.ValueDeserializer;
import tools.jackson.databind.ValueSerializer;
import tools.jackson.databind.annotation.JsonDeserialize;
import tools.jackson.databind.annotation.JsonSerialize;

@JsonSerialize(using = TicketChannel.TicketChannelSerializer.class)
@JsonDeserialize(using = TicketChannel.TicketChannelDeserializer.class)
public enum TicketChannel {
    EMAIL("email"),
    PHONE("phone"),
    WEB_PORTAL("web_portal"),
    CHAT("chat"),
    SOCIAL_MEDIA("social_media"),
    IN_PERSON("in_person"),
    MOBILE_APP("mobile_app"),
    API("api"),
    SYSTEM_GENERATED("system_generated"),
    INTERNAL("internal");

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

    public static class TicketChannelSerializer extends ValueSerializer<TicketChannel> {
        @Override
        public void serialize(
                TicketChannel value, JsonGenerator gen, SerializationContext serializers)
                throws JacksonException {
            gen.writeString(value.getDisplayName()); // Serialize the human-readable value
        }
    }

    public static class TicketChannelDeserializer extends ValueDeserializer<TicketChannel> {
        @Override
        public TicketChannel deserialize(JsonParser p, DeserializationContext ctxt)
                throws JacksonException {
            String value = p.getText();
            return TicketChannel.fromDisplayName(value); // Use the method from the enum
        }
    }
}
