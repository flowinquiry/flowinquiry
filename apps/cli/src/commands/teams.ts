import { request } from "../http";
import { CliConfig } from "../config";
import {
  PageableResult,
  Pagination,
  QueryDTO,
  TeamDTO,
  UserWithTeamRoleDTO,
} from "../types";

export async function listTeams(
  config: CliConfig,
  pagination: Pagination,
  query: QueryDTO,
) {
  const params = new URLSearchParams({
    page: String(pagination.page - 1), // Spring uses 0-indexed pages
    size: String(pagination.size),
  });
  if (pagination.sort?.length) {
    const sort = pagination.sort[0];
    params.set("sort", `${sort.field},${sort.direction}`);
  }

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
