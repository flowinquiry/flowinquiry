import { request } from "../http";
import { CliConfig } from "../config";
import { OrganizationDTO, PageableResult, Pagination, QueryDTO } from "../types";
import { paginationToParams } from "./helpers";

export async function createOrganization(config: CliConfig, payload: unknown) {
  return request<OrganizationDTO>("POST", "/api/organizations", config, payload);
}

export async function updateOrganization(
  config: CliConfig,
  id: number,
  payload: unknown,
) {
  return request<OrganizationDTO>(
    "PUT",
    `/api/organizations/${id}`,
    config,
    payload,
  );
}

export async function deleteOrganization(config: CliConfig, id: number) {
  return request<void>("DELETE", `/api/organizations/${id}`, config);
}

export async function getOrganization(config: CliConfig, id: number) {
  return request<OrganizationDTO>("GET", `/api/organizations/${id}`, config);
}

export async function searchOrganizations(
  config: CliConfig,
  pagination: Pagination,
  query: QueryDTO,
) {
  const params = paginationToParams(pagination);
  return request<PageableResult<OrganizationDTO>>(
    "POST",
    `/api/organizations/search?${params.toString()}`,
    config,
    query,
  );
}
