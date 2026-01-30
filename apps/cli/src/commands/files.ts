import { request } from "../http";
import { CliConfig } from "../config";
import { appendFile, appendFiles } from "../multipart";

export async function uploadFile(
  config: CliConfig,
  filePath: string,
  type: string,
  parentPath?: string,
) {
  const form = new FormData();
  await appendFile(form, "file", filePath);
  form.append("type", type);
  if (parentPath) {
    form.append("parentPath", parentPath);
  }
  return request("POST", "/api/files/singleUpload", config, form, {
    responseType: "text",
  });
}

export async function uploadEntityAttachments(
  config: CliConfig,
  entityType: string,
  entityId: number,
  files: string[],
) {
  const form = new FormData();
  form.append("entityType", entityType);
  form.append("entityId", String(entityId));
  await appendFiles(form, "files", files);
  return request("POST", "/api/entity-attachments", config, form);
}

export async function listEntityAttachments(
  config: CliConfig,
  entityType: string,
  entityId: number,
) {
  return request(
    "GET",
    "/api/entity-attachments",
    config,
    undefined,
    { query: { entityType, entityId } },
  );
}

export async function deleteAttachment(
  config: CliConfig,
  attachmentId: number,
) {
  return request<void>(
    "DELETE",
    `/api/entity-attachments/${attachmentId}`,
    config,
  );
}

export async function downloadFile(
  config: CliConfig,
  path: string,
  outputPath: string,
) {
  return request(
    "GET",
    `/api/files/${path.replace(/^\//, "")}`,
    config,
    undefined,
    { downloadTo: outputPath },
  );
}
