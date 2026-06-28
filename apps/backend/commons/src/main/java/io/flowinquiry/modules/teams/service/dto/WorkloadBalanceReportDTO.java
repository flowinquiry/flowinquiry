package io.flowinquiry.modules.teams.service.dto;

import java.util.List;
import lombok.Data;

@Data
public class WorkloadBalanceReportDTO {

    /** Sum of open tickets across all members */
    private long totalOpenTickets;

    /** Average open tickets per member (rounded to 2 decimal places) */
    private double averagePerMember;

    /** Display name of the member with the highest open ticket count */
    private String topOverloadedMember;

    /** Per-member rows, sorted by openCount descending */
    private List<WorkloadBalanceMemberDTO> members;
}
