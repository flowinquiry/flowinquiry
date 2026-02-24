package io.flowinquiry.modules.teams.service.event;

import io.flowinquiry.modules.teams.domain.ProjectIteration;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class ProjectIterationStatusChangeEvent extends ApplicationEvent {
    private ProjectIteration projectIteration;

    public ProjectIterationStatusChangeEvent(Object source, ProjectIteration projectIteration) {
        super(source);
        this.projectIteration = projectIteration;
    }
}
