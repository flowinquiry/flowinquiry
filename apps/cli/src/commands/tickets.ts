import { request } from "../http";
import { CliConfig } from "../config";
import { PageableResult, Pagination, QueryDTO, TicketDTO, TicketPriority } from "../types";
import { paginationToParams } from "./helpers";

export type TicketCreateInput = {
  teamId: number;
  workflowId: number;
  stateId: number;
  requesterId: number;
  priority: TicketPriority;
  title: string;
  description: string;
};

export async function createTicket(
  config: CliConfig,
  input: TicketCreateInput,
): Promise<TicketDTO> {
  const payload: Partial<TicketDTO> = {
    teamId: input.teamId,
    workflowId: input.workflowId,
    currentStateId: input.stateId,
    requestUserId: input.requesterId,
    priority: input.priority,
    requestTitle: input.title,
    requestDescription: input.description,
  };

  return request<TicketDTO>("POST", "/api/tickets", config, payload);
}

export async function searchTickets(
  config: CliConfig,
  pagination: Pagination,
  query: QueryDTO,
) {
  const params = paginationToParams(pagination);
  return request<PageableResult<TicketDTO>>(
    "POST",
    `/api/tickets/search?${params.toString()}`,
    config,
    query,
  );
}

export async function getTicket(config: CliConfig, ticketId: number) {
  return request<TicketDTO>("GET", `/api/tickets/${ticketId}`, config);
}

export async function updateTicket(
  config: CliConfig,
  ticketId: number,
  payload: unknown,
) {
  return request<TicketDTO>(
    "PUT",
    `/api/tickets/${ticketId}`,
    config,
    payload,
  );
}

export async function deleteTicket(config: CliConfig, ticketId: number) {
  return request<void>("DELETE", `/api/tickets/${ticketId}`, config);
}

export async function getNextTicket(
  config: CliConfig,
  currentId: number,
  projectId?: number,
) {
  return request<TicketDTO>(
    "GET",
    `/api/tickets/${currentId}/next`,
    config,
    undefined,
    { query: { projectId } },
  );
}

export async function getPreviousTicket(
  config: CliConfig,
  currentId: number,
  projectId?: number,
) {
  return request<TicketDTO>(
    "GET",
    `/api/tickets/${currentId}/previous`,
    config,
    undefined,
    { query: { projectId } },
  );
}

export async function getTeamTicketDistribution(
  config: CliConfig,
  teamId: number,
  query: { fromDate?: string; toDate?: string; range?: string },
) {
  return request(
    "GET",
    `/api/tickets/teams/${teamId}/ticket-distribution`,
    config,
    undefined,
    { query },
  );
}

export async function getTeamPriorityDistribution(
  config: CliConfig,
  teamId: number,
  query: { fromDate?: string; toDate?: string; range?: string },
) {
  return request(
    "GET",
    `/api/tickets/teams/${teamId}/priority-distribution`,
    config,
    undefined,
    { query },
  );
}

export async function getTeamStatistics(
  config: CliConfig,
  teamId: number,
  query: { fromDate?: string; toDate?: string; range?: string },
) {
  return request(
    "GET",
    `/api/tickets/teams/${teamId}/statistics`,
    config,
    undefined,
    { query },
  );
}

export async function getTeamOverdueTickets(
  config: CliConfig,
  teamId: number,
  pagination: Pagination,
) {
  const params = paginationToParams(pagination);
  return request<PageableResult<TicketDTO>>(
    "GET",
    `/api/tickets/teams/${teamId}/overdue-tickets?${params.toString()}`,
    config,
  );
}

export async function countTeamOverdueTickets(
  config: CliConfig,
  teamId: number,
  query: { fromDate?: string; toDate?: string; range?: string },
) {
  return request(
    "GET",
    `/api/tickets/teams/${teamId}/overdue-tickets/count`,
    config,
    undefined,
    { query },
  );
}

export async function getTeamUnassignedTickets(
  config: CliConfig,
  teamId: number,
  pagination: Pagination,
) {
  const params = paginationToParams(pagination);
  return request<PageableResult<TicketDTO>>(
    "GET",
    `/api/tickets/teams/${teamId}/unassigned-tickets?${params.toString()}`,
    config,
  );
}

export async function getTeamTicketCreationSeries(
  config: CliConfig,
  teamId: number,
  days?: number,
) {
  return request(
    "GET",
    `/api/tickets/teams/${teamId}/ticket-creations-day-series`,
    config,
    undefined,
    { query: { days } },
  );
}

export async function getUserOverdueTickets(
  config: CliConfig,
  userId: number,
  pagination: Pagination,
) {
  const params = paginationToParams(pagination);
  return request<PageableResult<TicketDTO>>(
    "GET",
    `/api/tickets/users/${userId}/overdue-tickets?${params.toString()}`,
    config,
  );
}

export async function getUserTeamPriorityDistribution(
  config: CliConfig,
  userId: number,
  query: { from?: string; to?: string; range?: string },
) {
  return request(
    "GET",
    `/api/tickets/users/${userId}/team-tickets-priority-distribution`,
    config,
    undefined,
    { query },
  );
}

export async function getTicketStateHistory(
  config: CliConfig,
  ticketId: number,
) {
  return request("GET", `/api/tickets/${ticketId}/states-history`, config);
}

export async function updateTicketState(
  config: CliConfig,
  ticketId: number,
  newStateId: number,
) {
  return request<TicketDTO>(
    "PATCH",
    `/api/tickets/${ticketId}/state`,
    config,
    { newStateId },
  );
}
