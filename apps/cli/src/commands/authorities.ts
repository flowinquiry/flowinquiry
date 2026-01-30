import { request } from "../http";
import { CliConfig } from "../config";
import { AuthorityDTO, PageableResult, Pagination, UserDTO } from "../types";
import { paginationToParams } from "./helpers";

export async function createAuthority(config: CliConfig, payload: unknown) {
  return request<AuthorityDTO>("POST", "/api/authorities", config, payload);
}

export async function listAuthorities(
  config: CliConfig,
  pagination: Pagination,
) {
  const params = paginationToParams(pagination);
  return request<PageableResult<AuthorityDTO>>(
    "GET",
    `/api/authorities?${params.toString()}`,
    config,
  );
}

export async function getAuthority(config: CliConfig, name: string) {
  return request<AuthorityDTO>(
    "GET",
    `/api/authorities/${encodeURIComponent(name)}`,
    config,
  );
}

export async function deleteAuthority(config: CliConfig, id: string) {
  return request<void>(
    "DELETE",
    `/api/authorities/${encodeURIComponent(id)}`,
    config,
  );
}

export async function getUsersByAuthority(
  config: CliConfig,
  authorityName: string,
  pagination: Pagination,
) {
  const params = paginationToParams(pagination);
  return request<PageableResult<UserDTO>>(
    "GET",
    `/api/authorities/${encodeURIComponent(authorityName)}/users?${params.toString()}`,
    config,
  );
}

export async function searchUsersNotInAuthority(
  config: CliConfig,
  authorityName: string,
  userTerm: string,
) {
  return request<UserDTO[]>(
    "GET",
    "/api/authorities/searchUsersNotInAuthority",
    config,
    undefined,
    { query: { authorityName, userTerm } },
  );
}

export async function addUsersToAuthority(
  config: CliConfig,
  authorityName: string,
  userIds: number[],
) {
  return request<void>(
    "POST",
    `/api/authorities/${encodeURIComponent(authorityName)}/add-users`,
    config,
    userIds,
  );
}

export async function removeUserFromAuthority(
  config: CliConfig,
  authorityName: string,
  userId: number,
) {
  return request<void>(
    "DELETE",
    `/api/authorities/${encodeURIComponent(authorityName)}/users/${userId}`,
    config,
  );
}
