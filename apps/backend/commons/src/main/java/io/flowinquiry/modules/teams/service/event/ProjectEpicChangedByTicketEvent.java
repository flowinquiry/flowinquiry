package io.flowinquiry.modules.teams.service.event;

import io.flowinquiry.modules.teams.service.dto.TicketDTO;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class ProjectEpicChangedByTicketEvent extends ApplicationEvent {
    private TicketDTO ticket;

    public ProjectEpicChangedByTicketEvent(Object source, TicketDTO ticket) {
        super(source);
        this.ticket = ticket;
    }
}
