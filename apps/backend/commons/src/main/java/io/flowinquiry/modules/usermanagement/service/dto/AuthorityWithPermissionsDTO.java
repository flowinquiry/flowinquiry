package io.flowinquiry.modules.usermanagement.service.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthorityWithPermissionsDTO {

    private AuthorityDTO authority;

    private List<AuthorityResourcePermissionDTO> permissions;
}
