import { request } from "../http";
import { CliConfig } from "../config";
import { AuthResponseDTO, UserDTO } from "../types";

export async function authenticate(
  config: CliConfig,
  email: string,
  password: string,
) {
  return request<AuthResponseDTO>("POST", "/api/authenticate", config, {
    email,
    password,
  });
}

export async function login(config: CliConfig, email: string, password: string) {
  return request<UserDTO>("POST", "/api/login", config, { email, password });
}

export async function session(config: CliConfig) {
  return request<string>("GET", "/api/authenticate", config, undefined, {
    responseType: "text",
  });
}

export async function register(config: CliConfig, payload: unknown) {
  return request<void>("POST", "/api/register", config, payload);
}

export async function resendActivation(config: CliConfig, email: string) {
  return request<void>(
    "GET",
    `/api/${encodeURIComponent(email)}/resend-activation-email`,
    config,
    undefined,
    { responseType: "text" },
  );
}

export async function activate(config: CliConfig, key: string) {
  return request<void>("GET", "/api/activate", config, undefined, {
    query: { key },
    responseType: "text",
  });
}

export async function whoami(config: CliConfig) {
  return request<UserDTO>("GET", "/api/account", config);
}

export async function updateAccount(config: CliConfig, payload: unknown) {
  return request<void>("POST", "/api/account", config, payload);
}

export async function changePassword(
  config: CliConfig,
  currentPassword: string,
  newPassword: string,
) {
  return request<void>("POST", "/api/account/change-password", config, {
    currentPassword,
    newPassword,
  });
}

export async function resetPasswordInit(config: CliConfig, email: string) {
  return request<void>(
    "GET",
    "/api/account/reset-password/init",
    config,
    undefined,
    { query: { email }, responseType: "text" },
  );
}

export async function resetPasswordFinish(
  config: CliConfig,
  key: string,
  newPassword: string,
) {
  return request<void>("POST", "/api/account/reset-password/finish", config, {
    key,
    newPassword,
  });
}
