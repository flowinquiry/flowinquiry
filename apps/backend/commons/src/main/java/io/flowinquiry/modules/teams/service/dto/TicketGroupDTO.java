package io.flowinquiry.modules.teams.service.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class TicketGroupDTO {
    private String groupByAttribute;
    private List<TicketDTO> tickets;
}
