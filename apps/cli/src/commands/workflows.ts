import { request } from "../http";
import { CliConfig } from "../config";

export async function listWorkflowsForTeam(
  config: CliConfig,
  teamId: number,
) {
  return request<unknown[]>("GET", `/api/workflows/teams/${teamId}`, config);
}

export async function getWorkflowDetail(
  config: CliConfig,
  workflowId: number,
) {
  return request("GET", `/api/workflows/details/${workflowId}`, config);
}
