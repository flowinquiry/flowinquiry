export type CliConfig = {
  baseUrl: string;
  token: string;
};

export function loadConfig(baseUrlFlag?: string): CliConfig {
  const token = process.env.FLOWINQUIRY_TOKEN;
  if (!token) {
    throw new Error(
      "FLOWINQUIRY_TOKEN is required. Set it in the environment.",
    );
  }

  const baseUrl = baseUrlFlag || process.env.FLOWINQUIRY_BASE_URL || "http://localhost:8080";

  return { baseUrl, token };
}
