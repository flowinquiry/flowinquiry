import { request } from "../http";
import { CliConfig } from "../config";
import { AppSettingDTO } from "../types";

export async function getSetting(config: CliConfig, key: string) {
  return request<AppSettingDTO>(
    "GET",
    `/api/settings/${encodeURIComponent(key)}`,
    config,
  );
}

export async function listSettings(config: CliConfig, group?: string) {
  return request<AppSettingDTO[]>("GET", "/api/settings", config, undefined, {
    query: { group },
  });
}

export async function updateSettings(config: CliConfig, payload: unknown) {
  return request<void>("PUT", "/api/settings", config, payload);
}

export async function updateSetting(
  config: CliConfig,
  key: string,
  payload: unknown,
) {
  return request<void>(
    "PUT",
    `/api/settings/${encodeURIComponent(key)}`,
    config,
    payload,
  );
}
