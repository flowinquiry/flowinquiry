import { request } from "../http";
import { CliConfig } from "../config";
import {
  PageableResult,
  Pagination,
  QueryDTO,
  TeamDTO,
  UserDTO,
  UserWithTeamRoleDTO,
} from "../types";
import { paginationToParams } from "./helpers";
import { appendFile, appendJsonPart } from "../multipart";

export async function listTeams(
  config: CliConfig,
  pagination: Pagination,
  query: QueryDTO,
) {
  const params = paginationToParams(pagination);

  return request<PageableResult<TeamDTO>>(
    "POST",
    `/api/teams/search?${params.toString()}`,
    config,
    query,
  );
}

export async function listTeamUsers(config: CliConfig, teamId: number) {
  return request<UserWithTeamRoleDTO[]>(
    "GET",
    `/api/teams/${teamId}/members`,
    config,
  );
}

export async function createTeam(
  config: CliConfig,
  payload: unknown,
  logoPath?: string,
) {
  const form = new FormData();
  appendJsonPart(form, "teamDTO", payload);
  if (logoPath) {
    await appendFile(form, "file", logoPath);
  }
  return request<TeamDTO>("POST", "/api/teams", config, form);
}

export async function updateTeam(
  config: CliConfig,
  payload: unknown,
  logoPath?: string,
) {
  const form = new FormData();
  appendJsonPart(form, "teamDTO", payload);
  if (logoPath) {
    await appendFile(form, "file", logoPath);
  }
  return request<TeamDTO>("PUT", "/api/teams", config, form);
}

export async function deleteTeam(config: CliConfig, teamId: number) {
  return request<void>("DELETE", `/api/teams/${teamId}`, config);
}

export async function deleteTeams(config: CliConfig, teamIds: number[]) {
  return request<void>("DELETE", "/api/teams", config, teamIds);
}

export async function getTeam(config: CliConfig, teamId: number) {
  return request<TeamDTO>("GET", `/api/teams/${teamId}`, config);
}

export async function getTeamsByUser(config: CliConfig, userId: number) {
  return request<TeamDTO[]>("GET", `/api/teams/users/${userId}`, config);
}

export async function addUsersToTeam(
  config: CliConfig,
  teamId: number,
  userIds: number[],
  role: string,
) {
  return request<void>(
    "POST",
    `/api/teams/${teamId}/add-users`,
    config,
    { userIds, role },
  );
}

export async function searchUsersNotInTeam(
  config: CliConfig,
  teamId: number,
  userTerm: string,
) {
  return request<UserDTO[]>(
    "GET",
    "/api/teams/searchUsersNotInTeam",
    config,
    undefined,
    { query: { teamId, userTerm } },
  );
}

export async function removeUserFromTeam(
  config: CliConfig,
  teamId: number,
  userId: number,
) {
  return request<void>(
    "DELETE",
    `/api/teams/${teamId}/users/${userId}`,
    config,
  );
}

export async function getUserRoleInTeam(
  config: CliConfig,
  teamId: number,
  userId: number,
) {
  return request(
    "GET",
    `/api/teams/${teamId}/users/${userId}/role`,
    config,
    undefined,
    { responseType: "text" },
  );
}

export async function hasManager(config: CliConfig, teamId: number) {
  return request("GET", `/api/teams/${teamId}/has-manager`, config);
}
