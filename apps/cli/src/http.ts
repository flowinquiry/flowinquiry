export type HttpMethod = "GET" | "POST";

export type RequestOptions = {
  baseUrl: string;
  token: string;
};

export async function request<TResponse>(
  method: HttpMethod,
  path: string,
  options: RequestOptions,
  body?: unknown,
): Promise<TResponse> {
  const url = `${options.baseUrl}${path}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${options.token}`,
  };

  const init: RequestInit = { method, headers };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    const errorPayload = isJson ? await response.json() : await response.text();
    throw new Error(
      `HTTP ${response.status} ${response.statusText} ${JSON.stringify(errorPayload)}`,
    );
  }

  if (!isJson) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}
