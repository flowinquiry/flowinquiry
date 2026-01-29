import { request } from "../http";
import { CliConfig } from "../config";
import { WorkflowDTO, WorkflowDetailedDTO } from "../types";

export async function listWorkflowsForTeam(config: CliConfig, teamId: number) {
  return request<WorkflowDTO[]>(
    "GET",
    `/api/workflows/teams/${teamId}`,
    config,
  );
}

export async function getWorkflowDetail(config: CliConfig, workflowId: number) {
  return request<WorkflowDetailedDTO>(
    "GET",
    `/api/workflows/details/${workflowId}`,
    config,
  );
}
