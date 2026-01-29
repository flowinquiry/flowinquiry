import { request } from "../http";
import { CliConfig } from "../config";
import { PageableResult, Pagination, QueryDTO } from "../types";

export async function listTeams(
  config: CliConfig,
  pagination: Pagination,
  query: QueryDTO,
) {
  const params = new URLSearchParams({
    page: String(pagination.page),
    size: String(pagination.size),
  });
  if (pagination.sort?.length) {
    const sort = pagination.sort[0];
    params.set("sort", `${sort.field},${sort.direction}`);
  }

  return request<PageableResult<unknown>>(
    "POST",
    `/api/teams/search?${params.toString()}`,
    config,
    query,
  );
}

export async function listTeamUsers(config: CliConfig, teamId: number) {
  return request<unknown[]>("GET", `/api/teams/${teamId}/members`, config);
}
