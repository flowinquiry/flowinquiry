import { request } from "../http";
import { CliConfig } from "../config";
import { VersionDTO } from "../types";

export async function listTimezones(config: CliConfig) {
  return request("GET", "/api/timezones", config);
}

export async function getVersion(config: CliConfig) {
  return request<VersionDTO>("GET", "/api/versions", config);
}

export async function checkVersion(config: CliConfig) {
  return request("GET", "/api/versions/check", config);
}

export async function aiSummary(config: CliConfig, description: string) {
  return request<string>(
    "POST",
    "/api/ai",
    config,
    description,
    { headers: { "Content-Type": "text/plain" }, responseType: "text" },
  );
}
