package io.flexwork.modules.crm.service.mapper;

import io.flexwork.modules.crm.domain.Account;
import io.flexwork.modules.crm.domain.Action;
import io.flexwork.modules.crm.domain.ActivityLog;
import io.flexwork.modules.crm.service.dto.AccountDTO;
import io.flexwork.modules.usermanagement.domain.User;
import org.mapstruct.*;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface AccountMapper {

    @Mapping(target = "parentAccountId", source = "parentAccount.id")
    @Mapping(target = "parentAccountName", source = "parentAccount.name")
    @Mapping(target = "assignedToUserId", source = "assignedToUser.id")
    AccountDTO toDto(Account account);

    @Mapping(target = "assignedToUser", source = "assignedToUserId", qualifiedByName = "toUser")
    @Mapping(target = "parentAccount", source = "parentAccountId", qualifiedByName = "toAccount")
    Account toEntity(AccountDTO accountDTO);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "assignedToUser", source = "assignedToUserId", qualifiedByName = "toUser")
    @Mapping(target = "parentAccount", source = "parentAccountId", qualifiedByName = "toAccount")
    void updateFromDto(AccountDTO accountDTO, @MappingTarget Account account);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "entityType", constant = "ACCOUNT")
    @Mapping(target = "entityId", source = "account.id")
    @Mapping(target = "user", source = "updatedUserId", qualifiedByName = "toUser")
    ActivityLog accountEntityToActivityLog(Account account, Action action, Long updatedUserId);

    @Named("toUser")
    default User toUser(Long userId) {
        return (userId == null) ? null : User.builder().id(userId).build();
    }

    @Named("toAccount")
    default Account toAccount(Long parentAccountId) {
        return (parentAccountId == null) ? null : Account.builder().id(parentAccountId).build();
    }
}
