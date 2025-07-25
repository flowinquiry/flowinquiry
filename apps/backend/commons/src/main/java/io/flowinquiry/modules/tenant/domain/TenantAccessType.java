package io.flowinquiry.modules.tenant.domain;

public enum TenantAccessType {
    SUBDOMAIN, // e.g. acme.flowinquiry.io
    CUSTOM_DOMAIN, // e.g. support.acme.com
    SELF_HOSTED // e.g. localhost or internal deployment
}
