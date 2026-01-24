import {
  doAdvanceSearch,
  get,
  patch,
  post,
  put,
} from "@/lib/actions/commons.action";
import { formatDateParams } from "@/lib/datetime";
import { HttpError } from "@/lib/errors";
import { PageableResult } from "@/types/commons";
import { Pagination, QueryDTO } from "@/types/query";
import {
  TeamTicketPriorityDistributionDTO,
  TicketActionCountByDateDTO,
} from "@/types/teams";
import {
  PriorityDistributionDTO,
  TicketDistributionDTO,
  TicketDTO,
  TicketStatisticsDTO,
} from "@/types/tickets";

export const createTicket = async (
  ticket: TicketDTO,
  setError?: (error: HttpError | string | null) => void,
) => {
  return post<TicketDTO, TicketDTO>(`/api/tickets`, ticket, setError);
};

export const findTicketById = async (
  ticketId: number,
  setError?: (error: HttpError | string | null) => void,
) => {
  return get<TicketDTO>(`/api/tickets/${ticketId}`, setError);
};

export const updateTicket = async (
  ticketId: number,
  ticket: TicketDTO,
  setError?: (error: HttpError | string | null) => void,
) => {
  return put<TicketDTO, TicketDTO>(
    `/api/tickets/${ticketId}`,
    ticket,
    setError,
  );
};

export async function searchTickets(
  query: QueryDTO,
  pagination: Pagination,
  setError?: (error: HttpError | string | null) => void,
) {
  return doAdvanceSearch<TicketDTO>(
    `/api/tickets/search`,
    query,
    pagination,
    setError,
  );
}

export const findPreviousTicket = async (
  ticketId: number,
  projectId?: number | null,
  setError?: (error: HttpError | string | null) => void,
) => {
  const url =
    projectId != null
      ? `/api/tickets/${ticketId}/previous?projectId=${projectId}`
      : `/api/tickets/${ticketId}/previous`;

  return get<TicketDTO>(url, setError);
};

export const findNextTicket = async (
  ticketId: number,
  projectId?: number | null,
  setError?: (error: HttpError | string | null) => void,
) => {
  const url =
    projectId != null
      ? `/api/tickets/${ticketId}/next?projectId=${projectId}`
      : `/api/tickets/${ticketId}/next`;
  return get<TicketDTO>(url, setError);
};

export const getTicketsAssignmentDistributionByTeam = async (
  teamId: number,
  dateParams: { range?: string; from?: Date; to?: Date },
  setError?: (error: HttpError | string | null) => void,
) => {
  return get<TicketDistributionDTO[]>(
    `/api/tickets/teams/${teamId}/ticket-distribution?${formatDateParams(dateParams)}`,
    setError,
  );
};

export const getTicketsPriorityDistributionByTeam = async (
  teamId: number,
  dateParams: { range?: string; from?: Date; to?: Date },
  setError?: (error: HttpError | string | null) => void,
) => {
  return get<PriorityDistributionDTO[]>(
    `/api/tickets/teams/${teamId}/priority-distribution?${formatDateParams(dateParams)}`,
    setError,
  );
};

export const getUnassignedTickets = async (
  teamId: number,
  page: number,
  sortBy: string,
  sortDirection: string,
  secondarySortBy: string,
  secondarySortDirection: string,
  setError?: (error: HttpError | string | null) => void,
) => {
  return get<PageableResult<TicketDTO>>(
    `/api/tickets/teams/${teamId}/unassigned-tickets?page=${page}&size=5&sort=${sortBy},${sortDirection}&sort=${secondarySortBy},${secondarySortDirection}`,
    setError,
  );
};

export const getOverdueTicketsByTeam = async (
  teamId: number,
  page: number,
  sortBy: string,
  sortDirection: string,
  secondarySortBy: string,
  secondarySortDirection: string,
  setError?: (error: HttpError | string | null) => void,
) => {
  return get<PageableResult<TicketDTO>>(
    `/api/tickets/teams/${teamId}/overdue-tickets?page=${page}&size=5&sort=${sortBy},${sortDirection}&sort=${secondarySortBy},${secondarySortDirection}`,
    setError,
  );
};

export const getTicketStatisticsByTeamId = async (
  teamId: number,
  dateParams: { range?: string; from?: Date; to?: Date },
  setError?: (error: HttpError | string | null) => void,
) => {
  return get<TicketStatisticsDTO>(
    `/api/tickets/teams/${teamId}/statistics?${formatDateParams(dateParams)}`,
    setError,
  );
};

export const getCountOverdueTicketsByTeamId = async (
  teamId: number,
  dateParams: { range?: string; from?: Date; to?: Date },
  setError?: (error: HttpError | string | null) => void,
) => {
  return get<number>(
    `/api/tickets/teams/${teamId}/overdue-tickets/count?${formatDateParams(dateParams)}`,
    setError,
  );
};

export const getTicketCreationDaySeries = async (
  teamId: number,
  days: number,
  setError?: (error: HttpError | string | null) => void,
) => {
  return get<TicketActionCountByDateDTO[]>(
    `/api/tickets/teams/${teamId}/ticket-creations-day-series?days=${days}`,
    setError,
  );
};

export const getOverdueTicketsByUser = async (
  userId: number,
  page: number,
  sortBy: string,
  sortDirection: string,
  setError?: (error: HttpError | string | null) => void,
) => {
  return get<PageableResult<TicketDTO>>(
    `/api/tickets/users/${userId}/overdue-tickets?page=${page}&size=5&sort=${sortBy},${sortDirection}`,
    setError,
  );
};

export const getTeamTicketPriorityDistributionForUser = async (
  userId: number,
  setError?: (error: HttpError | string | null) => void,
) => {
  return get<Array<TeamTicketPriorityDistributionDTO>>(
    `/api/tickets/users/${userId}/team-tickets-priority-distribution`,
    setError,
  );
};

export const updateTicketState = (
  ticketId: number,
  newStateId: number,
  setError?: (error: HttpError | string | null) => void,
) => {
  return patch<any, TicketDTO>(
    `/api/tickets/${ticketId}/state`,
    { newStateId: newStateId },
    setError,
  );
};
