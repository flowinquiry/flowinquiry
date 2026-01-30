import { request } from "../http";
import { CliConfig } from "../config";
import { PageableResult, Pagination, QueryDTO, UserDTO } from "../types";
import { paginationToParams } from "./helpers";
import { appendFile, appendJsonPart } from "../multipart";

export async function searchUsers(
  config: CliConfig,
  pagination: Pagination,
  query: QueryDTO,
) {
  const params = paginationToParams(pagination);
  return request<PageableResult<UserDTO>>(
    "POST",
    `/api/users/search?${params.toString()}`,
    config,
    query,
  );
}

export async function getUser(config: CliConfig, userId: number) {
  return request<UserDTO>("GET", `/api/users/${userId}`, config);
}

export async function createUser(config: CliConfig, payload: unknown) {
  return request<UserDTO>("POST", "/api/users", config, payload);
}

export async function updateUser(
  config: CliConfig,
  payload: unknown,
  avatarPath?: string,
) {
  const form = new FormData();
  appendJsonPart(form, "userDTO", payload);
  if (avatarPath) {
    await appendFile(form, "file", avatarPath);
  }
  return request<UserDTO>("PUT", "/api/users", config, form);
}

export async function deleteUser(config: CliConfig, userId: number) {
  return request<void>("DELETE", `/api/users/${userId}`, config);
}

export async function getUserPermissions(config: CliConfig, userId: number) {
  return request("GET", `/api/users/permissions/${userId}`, config);
}

export async function getDirectReports(config: CliConfig, managerId: number) {
  return request<UserDTO[]>(
    "GET",
    `/api/users/${managerId}/direct-reports`,
    config,
  );
}

export async function getUserHierarchy(config: CliConfig, userId: number) {
  return request("GET", `/api/users/${userId}/hierarchy`, config);
}

export async function getOrgChart(config: CliConfig) {
  return request("GET", "/api/users/orgChart", config);
}

export async function searchUsersByTerm(config: CliConfig, term: string) {
  return request<UserDTO[]>(
    "GET",
    "/api/users/search-by-term",
    config,
    undefined,
    { query: { term } },
  );
}

export async function updateLocale(config: CliConfig, langKey: string) {
  return request<void>("PATCH", "/api/users/locale", config, { langKey });
}
