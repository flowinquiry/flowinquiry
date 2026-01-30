import { request } from "../http";
import { CliConfig } from "../config";

export type TicketAgeingQuery = {
  projectId: string;
  iterationId?: string;
  status?: string[];
  priority?: string[];
  assignUserId?: string[];
  createdFrom?: string;
  createdTo?: string;
  groupBy?: string;
  includeClosed?: boolean;
};

export async function getTicketAgeingReport(
  config: CliConfig,
  query: TicketAgeingQuery,
) {
  const params: Record<string, string> = {
    projectId: query.projectId,
  };

  if (query.iterationId) params.iterationId = query.iterationId;
  if (query.status?.length) params.status = query.status.join(",");
  if (query.priority?.length) params.priority = query.priority.join(",");
  if (query.assignUserId?.length) params.assignUserId = query.assignUserId.join(",");
  if (query.createdFrom) params.createdFrom = query.createdFrom;
  if (query.createdTo) params.createdTo = query.createdTo;
  if (query.groupBy) params.groupBy = query.groupBy;
  if (query.includeClosed !== undefined) {
    params.includeClosed = String(query.includeClosed);
  }

  return request(
    "GET",
    "/api/reports/tickets/ageing",
    config,
    undefined,
    { query: params },
  );
}
