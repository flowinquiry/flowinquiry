import { describe, expect, it } from "bun:test";
import { loadConfig } from "../src/config";

const ORIGINAL_ENV = { ...process.env };

function resetEnv() {
  process.env = { ...ORIGINAL_ENV };
}

describe("loadConfig", () => {
  it("throws when FLOWINQUIRY_TOKEN is missing", () => {
    resetEnv();
    delete process.env.FLOWINQUIRY_TOKEN;

    expect(() => loadConfig()).toThrow(
      "FLOWINQUIRY_TOKEN is required. Set it in the environment.",
    );
  });

  it("uses baseUrl flag over env", () => {
    resetEnv();
    process.env.FLOWINQUIRY_TOKEN = "token";
    process.env.FLOWINQUIRY_BASE_URL = "http://env";

    const config = loadConfig("http://flag");

    expect(config.baseUrl).toBe("http://flag");
    expect(config.token).toBe("token");
  });

  it("falls back to default baseUrl", () => {
    resetEnv();
    process.env.FLOWINQUIRY_TOKEN = "token";
    delete process.env.FLOWINQUIRY_BASE_URL;

    const config = loadConfig();

    expect(config.baseUrl).toBe("http://localhost:8080");
  });

  it("allows missing token when requireToken is false", () => {
    resetEnv();
    delete process.env.FLOWINQUIRY_TOKEN;

    const config = loadConfig(undefined, { requireToken: false });

    expect(config.token).toBeUndefined();
  });
});
