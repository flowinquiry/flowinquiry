package io.flowinquiry.modules.shared.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.TimeZone;
import java.util.concurrent.TimeUnit;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "Timezone", description = "API for retrieving timezone information")
public class TimezoneController {

    @Operation(
            summary = "Get all timezones",
            description = "Returns a list of all available timezones with their offsets")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "List of timezones retrieved successfully",
                        content =
                                @Content(
                                        mediaType = "application/json",
                                        schema =
                                                @Schema(
                                                        type = "array",
                                                        implementation = ZoneInfo.class)))
            })
    @GetMapping("/timezones")
    public List<ZoneInfo> getTimezones() {
        return getTimeZoneList("GMT");
    }

    private static String calculateOffset(int rawOffset) {
        if (rawOffset == 0) {
            return "+00:00";
        }
        long hours = TimeUnit.MILLISECONDS.toHours(rawOffset);
        long minutes = TimeUnit.MILLISECONDS.toMinutes(rawOffset);
        minutes = Math.abs(minutes - TimeUnit.HOURS.toMinutes(hours));

        return String.format("%+03d:%02d", hours, Math.abs(minutes));
    }

    private static List<ZoneInfo> getTimeZoneList(String base) {
        String[] availableZoneIds = TimeZone.getAvailableIDs();
        List<ZoneInfo> result = new ArrayList<>(availableZoneIds.length);

        for (String zoneId : availableZoneIds) {
            TimeZone curTimeZone = TimeZone.getTimeZone(zoneId);
            String offset = calculateOffset(curTimeZone.getRawOffset());
            result.add(new ZoneInfo(zoneId, String.format("(%s%s)", base, offset)));
        }
        Collections.sort(result);
        return result;
    }

    @Schema(description = "Timezone information")
    public record ZoneInfo(
            @Schema(description = "Timezone identifier", example = "America/New_York")
                    String zoneId,
            @Schema(description = "Timezone offset from GMT", example = "(GMT-05:00)")
                    String offset)
            implements Comparable<ZoneInfo> {
        @Override
        public int compareTo(ZoneInfo o) {
            return this.offset.compareTo(o.offset);
        }
    }
}
