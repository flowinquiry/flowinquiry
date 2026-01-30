import { request } from "../http";
import { CliConfig } from "../config";
import { ResourceDTO } from "../types";

export async function listResources(config: CliConfig) {
  return request<ResourceDTO[]>("GET", "/api/resources", config);
}
