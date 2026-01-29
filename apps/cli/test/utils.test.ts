import { describe, expect, it } from "bun:test";
import { parsePriority } from "../src/utils";

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
