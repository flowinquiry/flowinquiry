import {
  deleteExec,
  doAdvanceSearch,
  get,
  post,
  put,
} from "@/lib/actions/commons.action";
import { HttpError } from "@/lib/errors";
import { Pagination, QueryDTO } from "@/types/query";
import {
  TeamDTO,
  TransitionItemCollectionDTO,
  UserTeamsContextDTO,
  UserWithTeamRoleDTO,
} from "@/types/teams";
import { UserDTO } from "@/types/users";

export const createTeam = async (
  teamForm: FormData,
  setError?: (error: HttpError | string | null) => void,
) => {
  return post<FormData, TeamDTO>(`/api/teams`, teamForm, setError);
};

export const updateTeam = async (
  teamForm: FormData,
  setError?: (error: HttpError | string | null) => void,
) => {
  return put<FormData, TeamDTO>(`/api/teams`, teamForm, setError);
};

export const findTeamById = async (
  teamId: number,
  setError?: (error: HttpError | string | null) => void,
) => {
  return get<TeamDTO>(`/api/teams/${teamId}`, setError);
};

export async function searchTeams(
  query: QueryDTO,
  pagination: Pagination,
  setError?: (error: HttpError | string | null) => void,
) {
  return doAdvanceSearch<TeamDTO>(
    `/api/teams/search`,
    query,
    pagination,
    setError,
  );
}

export async function deleteTeams(
  ids: number[],
  setError?: (error: HttpError | string | null) => void,
) {
  return deleteExec(`/api/teams`, ids, setError);
}

export async function findMembersByTeamId(
  teamId: number,
  setError?: (error: HttpError | string | null) => void,
) {
  return get<Array<UserWithTeamRoleDTO>>(
    `/api/teams/${teamId}/members`,
    setError,
  );
}

export async function findTeamsByMemberId(
  userId: number,
  setError?: (error: HttpError | string | null) => void,
) {
  return get<Array<TeamDTO>>(`/api/teams/users/${userId}`, setError);
}

export async function findUsersNotInTeam(
  userTerm: string,
  teamId: number,
  setError?: (error: HttpError | string | null) => void,
) {
  return get<Array<UserDTO>>(
    `/api/teams/searchUsersNotInTeam?userTerm=${userTerm}&&teamId=${teamId}`,
    setError,
  );
}

export const addUsersToTeam = (
  teamId: number,
  userIds: number[],
  teamRole: string,
  setError?: (error: HttpError | string | null) => void,
) => {
  return post(
    `/api/teams/${teamId}/add-users`,
    {
      userIds: userIds,
      role: teamRole,
    },
    setError,
  );
};

export const deleteUserFromTeam = async (
  teamId: number,
  userId: number,
  setError?: (error: HttpError | string | null) => void,
) => {
  return deleteExec(
    `/api/teams/${teamId}/users/${userId}`,
    undefined,
    setError,
  );
};

export const updateUserRoleInTeam = async (
  teamId: number,
  userId: number,
  role: string,
  setError?: (error: HttpError | string | null) => void,
) => {
  return put<{ role: string }, void>(
    `/api/teams/${teamId}/users/${userId}/role`,
    { role },
    setError,
  );
};

export const getUserRoleInTeam = async (
  userId: number,
  teamId: number,
  setError?: (error: HttpError | string | null) => void,
) => {
  return get<Record<string, string>>(
    `/api/teams/${teamId}/users/${userId}/role`,
    setError,
  );
};

export const getTicketStateChangesHistory = async (
  ticketId: number,
  setError?: (error: HttpError | string | null) => void,
) => {
  return get<TransitionItemCollectionDTO>(
    `/api/tickets/${ticketId}/states-history`,
    setError,
  );
};

export const checkTeamHasAnyManager = async (
  teamId: number,
  setError?: (error: HttpError | string | null) => void,
) => {
  return get<{ result: boolean }>(`/api/teams/${teamId}/has-manager`, setError);
};

export const getTeamsContextByUserId = async (
  userId: number,
  setError?: (error: HttpError | string | null) => void,
) => {
  return get<UserTeamsContextDTO>(
    `/api/teams/users/${userId}/teams-context`,
    setError,
  );
};
