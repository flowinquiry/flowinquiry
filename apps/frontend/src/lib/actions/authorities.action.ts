import { deleteExec, get, post } from "@/lib/actions/commons.action";
import { HttpError } from "@/lib/errors";
import {
  AuthorityDTO,
  AuthorityResourcePermissionDTO,
  AuthorityWithPermissionsDTO,
} from "@/types/authorities";
import { PageableResult } from "@/types/commons";
import { createQueryParams, Pagination } from "@/types/query";
import { UserDTO } from "@/types/users";

export const getAuthorities = async (
  page: number,
  setError?: (error: HttpError | string | null) => void,
) => {
  return get<PageableResult<AuthorityDTO>>(
    `/api/authorities?page=${page}&size=2000&sort=descriptiveName,asc`,
    setError,
  );
};

export const findAuthorityByName = async (
  name: string,
  setError?: (error: HttpError | string | null) => void,
) => {
  return get<AuthorityDTO>(`/api/authorities/${name}`, setError);
};

export const createAuthority = async (
  authority: AuthorityDTO,
  setError?: (error: HttpError | string | null) => void,
) => {
  return post<AuthorityDTO, AuthorityDTO>(
    `/api/authorities`,
    authority,
    setError,
  );
};

export const createAuthorityWithPermissions = async (
  payload: AuthorityWithPermissionsDTO,
  setError?: (error: HttpError | string | null) => void,
) => {
  return post<AuthorityWithPermissionsDTO, AuthorityWithPermissionsDTO>(
    `/api/authorities/with-permissions`,
    payload,
    setError,
  );
};

export const getResources = async (
  setError?: (error: HttpError | string | null) => void,
) => {
  return get<Array<{ name: string; description: string }>>(
    `/api/resources`,
    setError,
  );
};

export const deleteAuthority = async (
  authority_name: string,
  setError?: (error: HttpError | string | null) => void,
) => {
  return deleteExec<string, void>(
    `/api/authorities/${authority_name}`,
    undefined,
    setError,
  );
};

export const findPermissionsByAuthorityName = async (
  authorityName: string,
  setError?: (error: HttpError | string | null) => void,
) => {
  return get<Array<AuthorityResourcePermissionDTO>>(
    `/api/authority-permissions/${authorityName}`,
    setError,
  );
};

export const batchSavePermissions = async (
  permissions: Array<AuthorityResourcePermissionDTO>,
  setError?: (error: HttpError | string | null) => void,
) => {
  return post<
    Array<AuthorityResourcePermissionDTO>,
    Array<AuthorityResourcePermissionDTO>
  >(`/api/authority-permissions/batchSave`, permissions, setError);
};

export async function getUsersByAuthority(
  authority: string,
  pagination: Pagination,
) {
  const queryParams = createQueryParams(pagination);
  return get<PageableResult<UserDTO>>(
    `/api/authorities/${authority}/users?${queryParams.toString()}`,
  );
}

export async function findUsersNotInAuthority(
  userTerm: string,
  authorityName: string,
) {
  return get<Array<UserDTO>>(
    `/api/authorities/searchUsersNotInAuthority?userTerm=${userTerm}&&authorityName=${authorityName}`,
  );
}

export const addUsersToAuthority = (
  authorityName: string,
  userIds: number[],
) => {
  return post(`/api/authorities/${authorityName}/add-users`, userIds);
};

export const deleteUserFromAuthority = async (
  authorityName: string,
  userId: number,
) => {
  return deleteExec(`/api/authorities/${authorityName}/users/${userId}`);
};
