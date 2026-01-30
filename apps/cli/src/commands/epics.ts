import { request } from "../http";
import { CliConfig } from "../config";
import { ProjectEpicDTO } from "../types";

export async function getEpic(config: CliConfig, epicId: number) {
  return request<ProjectEpicDTO>(
    "GET",
    `/api/project-epics/${epicId}`,
    config,
  );
}

export async function createEpic(config: CliConfig, payload: unknown) {
  return request<ProjectEpicDTO>("POST", "/api/project-epics", config, payload);
}

export async function updateEpic(
  config: CliConfig,
  epicId: number,
  payload: unknown,
) {
  return request<ProjectEpicDTO>(
    "PUT",
    `/api/project-epics/${epicId}`,
    config,
    payload,
  );
}

export async function deleteEpic(config: CliConfig, epicId: number) {
  return request<void>("DELETE", `/api/project-epics/${epicId}`, config);
}
