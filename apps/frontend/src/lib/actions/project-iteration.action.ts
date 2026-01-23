import { get, post, put } from "@/lib/actions/commons.action";
import { HttpError } from "@/lib/errors";
import { ProjectEpicDTO, ProjectIterationDTO } from "@/types/projects";

export const createProjectIteration = async (
  projectIteration: ProjectIterationDTO,
  setError?: (error: HttpError | string | null) => void,
) => {
  projectIteration.status = "ACTIVE";
  return post<ProjectIterationDTO, ProjectIterationDTO>(
    `/api/project-iterations`,
    projectIteration,
    setError,
  );
};

export const closeProjectIteration = async (
  projectId: number,
  setError?: (error: HttpError | string | null) => void,
) => {
  return post<any, ProjectIterationDTO>(
    `/api/project-iterations/${projectId}/close`,
    setError,
  );
};

export const updateProjectIteration = (
  projectIterationId: number,
  projectIteration: ProjectIterationDTO,
  setError?: (error: HttpError | string | null) => void,
) => {
  return put<ProjectEpicDTO, ProjectEpicDTO>(
    `/api/project-iterations/${projectIterationId}`,
    projectIteration,
    setError,
  );
};

export const findIterationsByProjectId = async (
  projectId: number,
  setError?: (error: HttpError | string | null) => void,
) => {
  return get<Array<ProjectIterationDTO>>(
    `/api/projects/${projectId}/iterations`,
    setError,
  );
};
