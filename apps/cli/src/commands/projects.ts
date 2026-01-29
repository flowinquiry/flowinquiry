import { request } from "../http";
import { CliConfig } from "../config";
import { PageableResult, Pagination, QueryDTO, ProjectDTO } from "../types";

export async function listProjects(
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

  return request<PageableResult<ProjectDTO>>(
    "POST",
    `/api/projects/search?${params.toString()}`,
    config,
    query,
  );
}
