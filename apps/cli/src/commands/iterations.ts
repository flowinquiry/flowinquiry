import { request } from "../http";
import { CliConfig } from "../config";
import { ProjectIterationDTO } from "../types";

export async function getIteration(config: CliConfig, iterationId: number) {
  return request<ProjectIterationDTO>(
    "GET",
    `/api/project-iterations/${iterationId}`,
    config,
  );
}

export async function createIteration(config: CliConfig, payload: unknown) {
  return request<ProjectIterationDTO>(
    "POST",
    "/api/project-iterations",
    config,
    payload,
  );
}

export async function updateIteration(
  config: CliConfig,
  iterationId: number,
  payload: unknown,
) {
  return request<ProjectIterationDTO>(
    "PUT",
    `/api/project-iterations/${iterationId}`,
    config,
    payload,
  );
}

export async function deleteIteration(config: CliConfig, iterationId: number) {
  return request<void>(
    "DELETE",
    `/api/project-iterations/${iterationId}`,
    config,
  );
}

export async function closeIteration(config: CliConfig, iterationId: number) {
  return request<ProjectIterationDTO>(
    "POST",
    `/api/project-iterations/${iterationId}/close`,
    config,
  );
}
