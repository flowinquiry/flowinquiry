export type CliConfig = {
  baseUrl: string;
  token?: string;
};

type LoadConfigOptions = {
  requireToken?: boolean;
};

export function loadConfig(
  baseUrlFlag?: string,
  options: LoadConfigOptions = {},
): CliConfig {
  const requireToken = options.requireToken ?? true;
  const token = process.env.FLOWINQUIRY_TOKEN;

  if (requireToken && !token) {
    throw new Error(
      "FLOWINQUIRY_TOKEN is required. Set it in the environment.",
    );
  }

  const baseUrl =
    baseUrlFlag || process.env.FLOWINQUIRY_BASE_URL || "http://localhost:8080";

  return { baseUrl, token };
}
