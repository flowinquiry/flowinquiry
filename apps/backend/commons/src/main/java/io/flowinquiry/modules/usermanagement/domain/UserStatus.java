package io.flowinquiry.modules.usermanagement.domain;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public enum UserStatus {
    ACTIVE,
    PENDING;

    public static UserStatus from(String value) {
        try {
            return UserStatus.valueOf(value);
        } catch (Exception e) {
            log.warn("Invalid value for WorkflowVisibility: {}", value);
            return UserStatus.ACTIVE;
        }
    }
}
