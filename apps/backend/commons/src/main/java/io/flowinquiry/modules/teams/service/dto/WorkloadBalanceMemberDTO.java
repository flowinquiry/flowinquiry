package io.flowinquiry.modules.teams.service.dto;

import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkloadBalanceMemberDTO {

    private Long userId;
    private String userName;
    private String avatarUrl;

    /** Number of open (non-completed) tickets currently assigned */
    private long openCount;

    /** Number of completed tickets in the queried date range */
    private long closedCount;

    /** Tickets whose due date has passed and are not yet completed */
    private long overdueCount;

    /** Average age in days of the member's open tickets */
    private double avgAgeInDays;

    /**
     * Breakdown of open tickets by priority (e.g. {"Critical":2,"High":5,...})
     * Keys are TicketPriority enum name strings.
     */
    private Map<String, Long> priorityBreakdown;
}
