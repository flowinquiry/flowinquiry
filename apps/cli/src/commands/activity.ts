import { request } from "../http";
import { CliConfig } from "../config";
import { ActivityLogDTO, PageableResult, Pagination } from "../types";
import { paginationToParams } from "./helpers";

export async function listActivityLogs(
  config: CliConfig,
  entityType: string,
  entityId: number,
  pagination: Pagination,
) {
  const params = paginationToParams(pagination);
  params.set("entityType", entityType);
  params.set("entityId", String(entityId));

  return request<PageableResult<ActivityLogDTO>>(
    "GET",
    `/api/activity-logs?${params.toString()}`,
    config,
  );
}

export async function listUserActivityLogs(
  config: CliConfig,
  userId: number,
  pagination: Pagination,
) {
  const params = paginationToParams(pagination);
  return request<PageableResult<ActivityLogDTO>>(
    "GET",
    `/api/activity-logs/user/${userId}?${params.toString()}`,
    config,
  );
}
