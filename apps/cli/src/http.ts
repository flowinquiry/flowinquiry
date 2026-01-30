export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestOptions = {
  baseUrl: string;
  token?: string;
};

export type RequestConfig = {
  headers?: Record<string, string>;
  query?:
    | URLSearchParams
    | Record<string, string | number | boolean | undefined | null>;
  accept?: string;
  responseType?: "json" | "text" | "arrayBuffer" | "stream";
  downloadTo?: string;
};

export type DownloadResult = {
  path: string;
  contentType: string | null;
};

function buildUrl(
  baseUrl: string,
  path: string,
  query?: RequestConfig["query"],
) {
  const url = new URL(path, baseUrl);
  if (query) {
    const params =
      query instanceof URLSearchParams ? query : new URLSearchParams();
    if (!(query instanceof URLSearchParams)) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue;
        params.set(key, String(value));
      }
    }
    for (const [key, value] of params.entries()) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

function withAuthHeader(
  headers: Record<string, string>,
  token?: string,
) {
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
}

function isJsonResponse(contentType: string) {
  return (
    contentType.includes("application/json") ||
    contentType.includes("+json")
  );
}

function isFormDataBody(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

export async function request<TResponse>(
  method: HttpMethod,
  path: string,
  options: RequestOptions,
  body?: unknown,
  config: RequestConfig = {},
): Promise<TResponse> {
  const url = buildUrl(options.baseUrl, path, config.query);
  const headers: Record<string, string> = {
    Accept: config.accept ?? "application/json",
    ...config.headers,
  };
  withAuthHeader(headers, options.token);

  const init: RequestInit = { method, headers };

  if (body !== undefined) {
    if (isFormDataBody(body)) {
      init.body = body;
    } else if (
      typeof body === "string" ||
      body instanceof Blob ||
      body instanceof ArrayBuffer ||
      body instanceof URLSearchParams
    ) {
      init.body = body as BodyInit;
      if (!headers["Content-Type"] && !(body instanceof Blob)) {
        headers["Content-Type"] =
          body instanceof URLSearchParams
            ? "application/x-www-form-urlencoded"
            : "text/plain";
      }
    } else {
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
      init.body = JSON.stringify(body);
    }
  }

  const response = await fetch(url, init);
  const contentType = response.headers.get("content-type") || "";
  const isJson = isJsonResponse(contentType);

  if (!response.ok) {
    const errorPayload = isJson ? await response.json() : await response.text();
    throw new Error(
      `HTTP ${response.status} ${response.statusText} ${JSON.stringify(errorPayload)}`,
    );
  }

  if (config.downloadTo) {
    const buffer = await response.arrayBuffer();
    await Bun.write(config.downloadTo, buffer);
    return {
      path: config.downloadTo,
      contentType: contentType || null,
    } as TResponse;
  }

  if (config.responseType === "stream") {
    return response as TResponse;
  }

  if (config.responseType === "text") {
    return (await response.text()) as TResponse;
  }

  if (config.responseType === "arrayBuffer") {
    return (await response.arrayBuffer()) as TResponse;
  }

  if (!isJson) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}

export async function streamSse(
  path: string,
  options: RequestOptions,
  config: Omit<RequestConfig, "responseType" | "downloadTo"> & {
    onMessage: (data: string) => void;
  },
) {
  const response = await request<Response>(
    "GET",
    path,
    options,
    undefined,
    {
      ...config,
      accept: "text/event-stream",
      responseType: "stream",
    },
  );

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trimEnd();
      if (!trimmed) continue;
      if (trimmed.startsWith("data:")) {
        config.onMessage(trimmed.slice(5).trimStart());
      } else {
        config.onMessage(trimmed);
      }
    }
  }
}
