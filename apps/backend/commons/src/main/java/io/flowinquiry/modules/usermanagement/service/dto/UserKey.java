package io.flowinquiry.modules.usermanagement.service.dto;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserKey {
    private Long id;

    private String email;

    private UUID tentId;
}
