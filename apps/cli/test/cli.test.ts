import { describe, expect, it } from "bun:test";
import { createProgram } from "../src/cli";

function applyExitOverride(command: ReturnType<typeof createProgram>) {
  command.exitOverride();
  for (const sub of command.commands) {
    applyExitOverride(sub as ReturnType<typeof createProgram>);
  }
}

function captureHelp(args: string[]) {
  let output = "";
  const program = createProgram();
  applyExitOverride(program);
  program.configureOutput({
    writeOut: (str) => {
      output += str;
    },
    writeErr: (str) => {
      output += str;
    },
  });

  try {
    program.parse(args, { from: "user" });
  } catch {
    // Commander throws on help with exitOverride; ignore to inspect output.
  }
  process.exitCode = undefined;
  return output;
}

describe("cli help", () => {
  it("shows help output for alias", () => {
    const output = captureHelp(["help"]);
    expect(output).toContain("FlowInquiry CLI");
    expect(output).toContain("Commands:");
    expect(output).toContain("auth");
  });

  it("shows help output for --help", () => {
    const output = captureHelp(["--help"]);
    expect(output).toContain("FlowInquiry CLI");
    expect(output).toContain("team");
  });

  it("shows help output for subcommand", () => {
    const output = captureHelp(["team", "--help"]);
    expect(output).toContain("Team operations");
    expect(output).toContain("list");
    expect(output).toContain("users");
  });
});

describe("cli required options", () => {
  it("errors when ticket create is missing required options", () => {
    const output = captureHelp(["ticket", "create"]);
    expect(output).toContain("error: required option");
    expect(output).toContain("--team-id");
  });
});
