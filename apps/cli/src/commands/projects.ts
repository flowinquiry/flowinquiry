import { request } from "../http";
import { CliConfig } from "../config";
import {
  PageableResult,
  Pagination,
  QueryDTO,
  ProjectDTO,
  ProjectEpicDTO,
  ProjectIterationDTO,
} from "../types";
import { paginationToParams } from "./helpers";

export async function listProjects(
  config: CliConfig,
  pagination: Pagination,
  query: QueryDTO,
) {
  const params = paginationToParams(pagination);

  return request<PageableResult<ProjectDTO>>(
    "POST",
    `/api/projects/search?${params.toString()}`,
    config,
    query,
  );
}

export async function createProject(config: CliConfig, payload: unknown) {
  return request<ProjectDTO>("POST", "/api/projects", config, payload);
}

export async function getProject(config: CliConfig, projectId: number) {
  return request<ProjectDTO>("GET", `/api/projects/${projectId}`, config);
}

export async function updateProject(
  config: CliConfig,
  projectId: number,
  payload: unknown,
) {
  return request<ProjectDTO>(
    "PUT",
    `/api/projects/${projectId}`,
    config,
    payload,
  );
}

export async function deleteProject(config: CliConfig, projectId: number) {
  return request<void>("DELETE", `/api/projects/${projectId}`, config);
}

export async function exportProjects(
  config: CliConfig,
  pagination: Pagination,
  query: QueryDTO | undefined,
  accept: string,
  outputPath?: string,
) {
  const params = paginationToParams(pagination);
  return request(
    "POST",
    `/api/projects/export?${params.toString()}`,
    config,
    query ?? {},
    {
      accept,
      downloadTo: outputPath,
    },
  );
}

export async function getProjectIterations(
  config: CliConfig,
  projectId: number,
) {
  return request<ProjectIterationDTO[]>(
    "GET",
    `/api/projects/${projectId}/iterations`,
    config,
  );
}

export async function getProjectEpics(config: CliConfig, projectId: number) {
  return request<ProjectEpicDTO[]>(
    "GET",
    `/api/projects/${projectId}/epics`,
    config,
  );
}

export async function getProjectByShortName(
  config: CliConfig,
  shortName: string,
) {
  return request<ProjectDTO>(
    "GET",
    `/api/projects/short-name/${encodeURIComponent(shortName)}`,
    config,
  );
}

export async function getProjectsByUser(
  config: CliConfig,
  userId: number,
  pagination: Pagination,
) {
  const params = paginationToParams(pagination);
  return request<PageableResult<ProjectDTO>>(
    "GET",
    `/api/projects/by-user/${userId}?${params.toString()}`,
    config,
  );
}
