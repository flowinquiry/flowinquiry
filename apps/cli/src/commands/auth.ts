import { request } from "../http";
import { CliConfig } from "../config";

export async function whoami(config: CliConfig) {
  return request("GET", "/api/authenticate", config);
}
