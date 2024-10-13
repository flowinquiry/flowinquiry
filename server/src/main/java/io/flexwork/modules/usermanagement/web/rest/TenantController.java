package io.flexwork.modules.usermanagement.web.rest;

import io.flexwork.modules.usermanagement.domain.Tenant;
import io.flexwork.modules.usermanagement.service.TenantService;
import io.flexwork.modules.usermanagement.service.dto.TenantDTO;
import io.flexwork.modules.usermanagement.service.mapper.TenantMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class TenantController {

    private static final Logger log = LoggerFactory.getLogger(TenantController.class);

    private final TenantService tenantService;

    private final TenantMapper tenantMapper;

    public TenantController(TenantService tenantService, TenantMapper tenantMapper) {
        this.tenantService = tenantService;
        this.tenantMapper = tenantMapper;
    }

    @PostMapping("/tenants")
    public TenantDTO createTenant(@RequestBody TenantDTO tenantDTO) {
        Tenant tenant = tenantMapper.tenantDtoToTenant(tenantDTO);
        return tenantMapper.tenantToTenantDto(tenantService.registerNewTenant(tenant));
    }

    @GetMapping("/tenants")
    public Page<TenantDTO> findAllTenants(Pageable pageable) {
        return tenantService.findAllTenants(pageable).map(tenantMapper::tenantToTenantDto);
    }
}
