import { describe, expect, it } from "bun:test";
import { parseFilters, parseJsonInput, parsePriority } from "../src/utils";

describe("parsePriority", () => {
  it("returns valid priority", () => {
    expect(parsePriority("High")).toBe("High");
  });

  it("throws for invalid priority", () => {
    expect(() => parsePriority("Urgent")).toThrow(
      "Invalid priority. Use one of: Critical, High, Medium, Low, Trivial",
    );
  });
});

describe("parseFilters", () => {
  it("parses field operator value", () => {
    const filters = parseFilters(["status:eq:Open"]);
    expect(filters).toEqual([
      { field: "status", operator: "eq", value: "Open" },
    ]);
  });

  it("defaults operator to eq", () => {
    const filters = parseFilters(["priority:High"]);
    expect(filters).toEqual([
      { field: "priority", operator: "eq", value: "High" },
    ]);
  });
});

describe("parseJsonInput", () => {
  it("parses json string", () => {
    const value = parseJsonInput<{ ok: boolean }>('{"ok":true}', "test");
    expect(value.ok).toBe(true);
  });
});
