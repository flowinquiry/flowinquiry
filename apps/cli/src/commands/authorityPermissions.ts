import { request } from "../http";
import { CliConfig } from "../config";

export async function getAuthorityPermissions(
  config: CliConfig,
  authorityName: string,
) {
  return request(
    "GET",
    `/api/authority-permissions/${encodeURIComponent(authorityName)}`,
    config,
  );
}

export async function saveAuthorityPermissions(
  config: CliConfig,
  payload: unknown,
) {
  return request(
    "POST",
    "/api/authority-permissions/batchSave",
    config,
    payload,
  );
}
