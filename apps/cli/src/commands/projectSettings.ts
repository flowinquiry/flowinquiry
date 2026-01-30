import { request } from "../http";
import { CliConfig } from "../config";
import { ProjectSettingDTO } from "../types";

export async function getProjectSettings(
  config: CliConfig,
  projectId: number,
) {
  return request<ProjectSettingDTO>(
    "GET",
    `/api/project-settings/project/${projectId}`,
    config,
  );
}

export async function createProjectSettings(
  config: CliConfig,
  payload: unknown,
) {
  return request<ProjectSettingDTO>(
    "POST",
    "/api/project-settings",
    config,
    payload,
  );
}

export async function updateProjectSettings(
  config: CliConfig,
  projectId: number,
  payload: unknown,
) {
  return request<ProjectSettingDTO>(
    "PUT",
    `/api/project-settings/project/${projectId}`,
    config,
    payload,
  );
}
