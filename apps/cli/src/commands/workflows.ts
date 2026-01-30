import { request } from "../http";
import { CliConfig } from "../config";
import {
  PageableResult,
  Pagination,
  QueryDTO,
  WorkflowDTO,
  WorkflowDetailedDTO,
  WorkflowStateDTO,
} from "../types";
import { paginationToParams } from "./helpers";

export async function searchWorkflows(
  config: CliConfig,
  pagination: Pagination,
  query: QueryDTO,
) {
  const params = paginationToParams(pagination);
  return request<PageableResult<WorkflowDTO>>(
    "POST",
    `/api/workflows/search?${params.toString()}`,
    config,
    query,
  );
}

export async function getWorkflow(config: CliConfig, workflowId: number) {
  return request<WorkflowDTO>("GET", `/api/workflows/${workflowId}`, config);
}

export async function updateWorkflow(
  config: CliConfig,
  workflowId: number,
  payload: unknown,
) {
  return request<WorkflowDTO>(
    "PUT",
    `/api/workflows/${workflowId}`,
    config,
    payload,
  );
}

export async function deleteWorkflow(config: CliConfig, workflowId: number) {
  return request("DELETE", `/api/workflows/${workflowId}`, config);
}

export async function listWorkflowsForTeam(config: CliConfig, teamId: number) {
  return request<WorkflowDTO[]>(
    "GET",
    `/api/workflows/teams/${teamId}`,
    config,
  );
}

export async function listWorkflowsForTeamUsedForProject(
  config: CliConfig,
  teamId: number,
  usedForProject?: boolean,
) {
  return request<WorkflowDTO[]>(
    "GET",
    `/api/workflows/teams/${teamId}`,
    config,
    undefined,
    {
      query:
        usedForProject === undefined
          ? undefined
          : { used_for_project: usedForProject },
    },
  );
}

export async function deleteTeamWorkflow(
  config: CliConfig,
  workflowId: number,
  teamId: number,
) {
  return request<void>(
    "DELETE",
    `/api/workflows/${workflowId}/teams/${teamId}`,
    config,
  );
}

export async function listGlobalWorkflowsNotLinked(
  config: CliConfig,
  teamId: number,
) {
  return request<WorkflowDTO[]>(
    "GET",
    `/api/workflows/teams/${teamId}/global-workflows-not-linked-yet`,
    config,
  );
}

export async function getWorkflowTransitions(
  config: CliConfig,
  workflowId: number,
  workflowStateId: number,
  includeSelf?: boolean,
) {
  return request<WorkflowStateDTO[]>(
    "GET",
    `/api/workflows/${workflowId}/transitions`,
    config,
    undefined,
    { query: { workflowStateId, includeSelf } },
  );
}

export async function getWorkflowInitialStates(
  config: CliConfig,
  workflowId: number,
) {
  return request<WorkflowStateDTO[]>(
    "GET",
    `/api/workflows/${workflowId}/initial-states`,
    config,
  );
}

export async function getProjectWorkflowByTeam(
  config: CliConfig,
  teamId: number,
) {
  return request<WorkflowDetailedDTO>(
    "GET",
    `/api/workflows/teams/${teamId}/project-workflow`,
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

export async function createWorkflowDetail(
  config: CliConfig,
  payload: unknown,
) {
  return request<WorkflowDetailedDTO>(
    "POST",
    "/api/workflows/details",
    config,
    payload,
  );
}

export async function updateWorkflowDetail(
  config: CliConfig,
  workflowId: number,
  payload: unknown,
) {
  return request<WorkflowDetailedDTO>(
    "PUT",
    `/api/workflows/details/${workflowId}`,
    config,
    payload,
  );
}

export async function createWorkflowReference(
  config: CliConfig,
  refId: number,
  teamId: number,
  payload: unknown,
) {
  return request<WorkflowDetailedDTO>(
    "POST",
    `/api/workflows/${refId}/teams/${teamId}/create-workflow-reference`,
    config,
    payload,
  );
}

export async function createWorkflowClone(
  config: CliConfig,
  cloneId: number,
  teamId: number,
  payload: unknown,
) {
  return request<WorkflowDetailedDTO>(
    "POST",
    `/api/workflows/${cloneId}/teams/${teamId}/create-workflow-clone`,
    config,
    payload,
  );
}
