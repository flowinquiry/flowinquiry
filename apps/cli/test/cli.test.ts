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

function listCommandPaths(
  command: ReturnType<typeof createProgram>,
  prefix = "",
): string[] {
  const paths: string[] = [];
  for (const sub of command.commands) {
    const name = sub.name();
    const full = prefix ? `${prefix} ${name}` : name;
    paths.push(full);
    paths.push(...listCommandPaths(sub as ReturnType<typeof createProgram>, full));
  }
  return paths;
}

describe("cli command surface", () => {
  it("exposes expected commands", () => {
    const program = createProgram();
    const commands = listCommandPaths(program);

    const expected = [
      "help",
      "auth authenticate",
      "auth login",
      "auth session",
      "auth register",
      "auth resend-activation",
      "auth activate",
      "auth whoami",
      "auth account-update",
      "auth change-password",
      "auth reset-password-init",
      "auth reset-password-finish",
      "user search",
      "user get",
      "user create",
      "user update",
      "user delete",
      "user permissions",
      "user direct-reports",
      "user hierarchy",
      "user org-chart",
      "user search-term",
      "user locale",
      "authority create",
      "authority list",
      "authority get",
      "authority delete",
      "authority users",
      "authority search-not-in",
      "authority add-users",
      "authority remove-user",
      "authority-permission get",
      "authority-permission batch-save",
      "resource list",
      "team list",
      "team get",
      "team create",
      "team update",
      "team delete",
      "team delete-bulk",
      "team users",
      "team by-user",
      "team add-users",
      "team search-users-not-in",
      "team remove-user",
      "team user-role",
      "team has-manager",
      "org create",
      "org update",
      "org delete",
      "org get",
      "org search",
      "workflow search",
      "workflow get",
      "workflow update",
      "workflow delete",
      "workflow list",
      "workflow remove-team",
      "workflow global-not-linked",
      "workflow transitions",
      "workflow initial-states",
      "workflow project",
      "workflow details",
      "workflow details-create",
      "workflow details-update",
      "workflow create-reference",
      "workflow create-clone",
      "project search",
      "project get",
      "project create",
      "project update",
      "project delete",
      "project export",
      "project iterations",
      "project epics",
      "project short-name",
      "project by-user",
      "iteration get",
      "iteration create",
      "iteration update",
      "iteration delete",
      "iteration close",
      "epic get",
      "epic create",
      "epic update",
      "epic delete",
      "project-setting get",
      "project-setting create",
      "project-setting update",
      "ticket create",
      "ticket search",
      "ticket get",
      "ticket update",
      "ticket delete",
      "ticket next",
      "ticket previous",
      "ticket team distribution",
      "ticket team priority-distribution",
      "ticket team statistics",
      "ticket team overdue",
      "ticket team overdue-count",
      "ticket team unassigned",
      "ticket team creation-series",
      "ticket user overdue",
      "ticket user team-priority-distribution",
      "ticket state-history",
      "ticket update-state",
      "report ticket-ageing",
      "comment save",
      "comment get",
      "comment list",
      "comment delete",
      "notification list",
      "notification mark-read",
      "notification unread",
      "activity list",
      "activity user",
      "watcher add",
      "watcher remove",
      "watcher remove-one",
      "watcher list",
      "watcher user",
      "setting get",
      "setting list",
      "setting update",
      "setting update-key",
      "file upload",
      "file attach",
      "file attachments",
      "file delete-attachment",
      "file download",
      "timezone list",
      "version get",
      "version check",
      "ai summary",
      "sse listen",
    ];

    for (const expectedCommand of expected) {
      expect(commands).toContain(expectedCommand);
    }
  });
});

describe("cli required options", () => {
  it("errors when ticket create is missing required options", () => {
    const output = captureHelp(["ticket", "create"]);
    expect(output).toContain("error: required option");
    expect(output).toContain("--team-id");
  });
});
