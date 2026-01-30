import { request } from "../http";
import { CliConfig } from "../config";
import { NotificationDTO, PageableResult, Pagination } from "../types";
import { paginationToParams } from "./helpers";

export async function listNotifications(
  config: CliConfig,
  userId: number,
  pagination: Pagination,
) {
  const params = paginationToParams(pagination);
  return request<PageableResult<NotificationDTO>>(
    "GET",
    `/api/notifications/user/${userId}?${params.toString()}`,
    config,
  );
}

export async function markNotificationsRead(
  config: CliConfig,
  notificationIds: number[],
) {
  return request<void>(
    "POST",
    "/api/notifications/mark-read",
    config,
    { notificationIds },
  );
}

export async function listUnreadNotifications(
  config: CliConfig,
  userId: number,
) {
  return request<NotificationDTO[]>(
    "GET",
    "/api/notifications/unread",
    config,
    undefined,
    { query: { userId } },
  );
}
