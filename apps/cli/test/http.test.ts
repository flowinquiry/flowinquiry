import { afterEach, describe, expect, it } from "bun:test";
import { request } from "../src/http";

const ORIGINAL_FETCH = globalThis.fetch;

function mockFetch(handler: typeof fetch) {
  globalThis.fetch = handler;
}

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
});

describe("request", () => {
  it("returns json for ok response", async () => {
    mockFetch(async () => {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });

    const result = await request("GET", "/path", {
      baseUrl: "http://example.com",
      token: "token",
    });

    expect(result).toEqual({ ok: true });
  });

  it("throws on non-ok response", async () => {
    mockFetch(async () => {
      return new Response(JSON.stringify({ error: "bad" }), {
        status: 400,
        statusText: "Bad Request",
        headers: { "content-type": "application/json" },
      });
    });

    await expect(
      request("GET", "/path", {
        baseUrl: "http://example.com",
        token: "token",
      }),
    ).rejects.toThrow("HTTP 400 Bad Request");
  });

  it("returns text response when requested", async () => {
    mockFetch(async () => {
      return new Response("ok", {
        status: 200,
        headers: { "content-type": "text/plain" },
      });
    });

    const result = await request(
      "GET",
      "/path",
      { baseUrl: "http://example.com", token: "token" },
      undefined,
      { responseType: "text" },
    );

    expect(result).toBe("ok");
  });

  it("omits authorization header when token is missing", async () => {
    let authHeader: string | undefined;
    mockFetch(async (_input, init) => {
      const headers = init?.headers as Record<string, string> | undefined;
      authHeader = headers?.Authorization;
      return new Response("ok", {
        status: 200,
        headers: { "content-type": "text/plain" },
      });
    });

    await request(
      "GET",
      "/path",
      { baseUrl: "http://example.com" },
      undefined,
      { responseType: "text" },
    );

    expect(authHeader).toBeUndefined();
  });
});
