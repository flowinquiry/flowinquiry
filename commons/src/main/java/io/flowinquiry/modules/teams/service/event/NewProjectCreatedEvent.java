package io.flowinquiry.modules.teams.service.event;

import io.flowinquiry.modules.teams.service.dto.ProjectDTO;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class NewProjectCreatedEvent extends ApplicationEvent {

    private final ProjectDTO projectDTO;

    public NewProjectCreatedEvent(Object source, ProjectDTO team) {
        super(source);
        this.projectDTO = team;
    }
}
