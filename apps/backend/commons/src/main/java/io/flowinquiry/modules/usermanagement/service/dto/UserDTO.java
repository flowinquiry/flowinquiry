package io.flowinquiry.modules.usermanagement.service.dto;

import io.flowinquiry.modules.usermanagement.domain.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.io.Serializable;
import java.time.Instant;
import java.util.Set;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
public class UserDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @EqualsAndHashCode.Include private Long id;

    @Email @EqualsAndHashCode.Include private String email;

    @NotBlank private String firstName;

    @NotBlank private String lastName;

    private String timezone;

    private String imageUrl;

    private UserStatus status;

    private Boolean isDeleted;

    private String langKey;

    private Instant lastLoginTime;

    private Set<String> authorities;

    private Long managerId;

    private String managerName;

    private String managerImageUrl;

    private String about;

    private String address;

    private String city;

    private String state;

    private String country;

    private String title;

    private Long createdBy;

    private Instant createdAt;

    private Long lastModifiedBy;

    private Instant modifiedAt;

    private String resetKey;

    private Instant resetDate;

    private String activationKey;

    public String getFullName() {
        return firstName + " " + lastName;
    }
}
