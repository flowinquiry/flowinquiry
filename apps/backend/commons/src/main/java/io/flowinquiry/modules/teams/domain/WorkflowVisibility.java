package io.flowinquiry.modules.teams.domain;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public enum WorkflowVisibility {
    PUBLIC,
    PRIVATE,
    TEAM;

    public static WorkflowVisibility from(String value) {
        try {
            return WorkflowVisibility.valueOf(value);
        } catch (Exception e) {
            log.warn("Invalid value for WorkflowVisibility: {}", value);
            return WorkflowVisibility.PRIVATE;
        }
    }
}
