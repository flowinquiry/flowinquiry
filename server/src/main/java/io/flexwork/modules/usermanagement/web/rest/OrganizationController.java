package io.flexwork.modules.usermanagement.web.rest;

import static io.flexwork.query.QueryUtils.parseFiltersFromParams;

import io.flexwork.modules.usermanagement.domain.Organization;
import io.flexwork.modules.usermanagement.service.OrganizationService;
import io.flexwork.modules.usermanagement.service.dto.OrganizationDTO;
import io.flexwork.modules.usermanagement.service.mapper.OrganizationMapper;
import io.flexwork.query.QueryFilter;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/organizations")
public class OrganizationController {

    private OrganizationService organizationService;

    private OrganizationMapper organizationMapper;

    public OrganizationController(
            OrganizationMapper organizationMapper, OrganizationService organizationService) {
        this.organizationMapper = organizationMapper;
        this.organizationService = organizationService;
    }

    // Create a new organization
    @PostMapping
    public ResponseEntity<Organization> createOrganization(@RequestBody Organization organization) {
        Organization createdOrganization = organizationService.createOrganization(organization);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdOrganization);
    }

    // Update an existing organization
    @PutMapping("/{id}")
    public ResponseEntity<Organization> updateOrganization(
            @PathVariable Long id, @RequestBody Organization organization) {
        Organization updatedOrganization = organizationService.updateOrganization(id, organization);
        return ResponseEntity.ok(updatedOrganization);
    }

    // Delete an organization by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrganization(@PathVariable Long id) {
        organizationService.deleteOrganization(id);
        return ResponseEntity.noContent().build();
    }

    // Find an organization by ID
    @GetMapping("/{id}")
    public ResponseEntity<Organization> findOrganizationById(@PathVariable Long id) {
        Organization organization = organizationService.findOrganizationById(id);
        return ResponseEntity.ok(organization);
    }

    // Find organizations
    @GetMapping
    public ResponseEntity<Page<OrganizationDTO>> findOrganizations(
            @RequestParam Map<String, String> params, Pageable pageable) {
        List<QueryFilter> filters = parseFiltersFromParams(params);
        Page<Organization> teams = organizationService.findOrganizations(filters, pageable);
        return new ResponseEntity<>(
                teams.map(organizationMapper::organizationToOrganizationDTO), HttpStatus.OK);
    }
}
