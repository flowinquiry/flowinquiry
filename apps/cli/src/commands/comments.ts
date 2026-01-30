import { request } from "../http";
import { CliConfig } from "../config";
import { CommentDTO } from "../types";

export async function saveComment(config: CliConfig, payload: unknown) {
  return request<CommentDTO>("POST", "/api/comments", config, payload);
}

export async function getComment(config: CliConfig, commentId: number) {
  return request<CommentDTO>("GET", `/api/comments/${commentId}`, config);
}

export async function listComments(
  config: CliConfig,
  entityType: string,
  entityId: number,
) {
  return request<CommentDTO[]>("GET", "/api/comments", config, undefined, {
    query: { entityType, entityId },
  });
}

export async function deleteComment(config: CliConfig, commentId: number) {
  return request<void>("DELETE", `/api/comments/${commentId}`, config);
}
