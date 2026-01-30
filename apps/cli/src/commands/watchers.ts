import { request } from "../http";
import { CliConfig } from "../config";
import { Pagination } from "../types";
import { paginationToParams } from "./helpers";

export async function addWatchers(
  config: CliConfig,
  entityType: string,
  entityId: number,
  watcherIds: number[],
) {
  return request<void>(
    "POST",
    "/api/entity-watchers/add",
    config,
    watcherIds,
    { query: { entityType, entityId } },
  );
}

export async function removeWatchers(
  config: CliConfig,
  entityType: string,
  entityId: number,
  watcherIds: number[],
) {
  return request<void>(
    "DELETE",
    "/api/entity-watchers/remove",
    config,
    watcherIds,
    { query: { entityType, entityId } },
  );
}

export async function removeWatcher(
  config: CliConfig,
  entityType: string,
  entityId: number,
  userId: number,
) {
  return request<void>(
    "DELETE",
    "/api/entity-watchers",
    config,
    undefined,
    { query: { entityType, entityId, userId } },
  );
}

export async function listWatchers(
  config: CliConfig,
  entityType: string,
  entityId: number,
) {
  return request(
    "GET",
    "/api/entity-watchers",
    config,
    undefined,
    { query: { entityType, entityId } },
  );
}

export async function listWatchedEntities(
  config: CliConfig,
  userId: number,
  pagination: Pagination,
) {
  const params = paginationToParams(pagination);
  params.set("userId", String(userId));
  return request("GET", `/api/entity-watchers/user?${params.toString()}`, config);
}
