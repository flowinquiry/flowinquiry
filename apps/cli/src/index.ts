#!/usr/bin/env bun

import { Command } from "commander";
import { loadConfig } from "./config";
import { printError, printJson } from "./output";
import { whoami } from "./commands/auth";
import { listTeams, listTeamUsers } from "./commands/teams";
import { listWorkflowsForTeam, getWorkflowDetail } from "./commands/workflows";
import { listProjects } from "./commands/projects";
import { createTicket } from "./commands/tickets";
import { TicketPriority } from "./types";

const program = new Command();
const allowedPriorities: TicketPriority[] = [
  "Critical",
  "High",
  "Medium",
  "Low",
  "Trivial",
];

function parsePriority(value: string): TicketPriority {
  if (allowedPriorities.includes(value as TicketPriority)) {
    return value as TicketPriority;
  }
  throw new Error(
    `Invalid priority. Use one of: ${allowedPriorities.join(", ")}`,
  );
}

program
  .name("fi")
  .description("FlowInquiry CLI")
  .option("--base-url <url>", "FlowInquiry API base URL");

const auth = program.command("auth").description("Authentication helpers");

auth
  .command("whoami")
  .description("Validate token and return current user")
  .action(async () => {
    try {
      const config = loadConfig(program.opts().baseUrl);
      const result = await whoami(config);
      printJson(result);
    } catch (error) {
      printError(error);
      process.exitCode = 1;
    }
  });

const team = program.command("team").description("Team operations");
team
  .command("list")
  .description("List teams")
  .option("--page <number>", "Page number", "1")
  .option("--size <number>", "Page size", "20")
  .option("--sort-field <field>", "Sort field", "name")
  .option("--sort-direction <direction>", "Sort direction", "asc")
  .action(async (options) => {
    try {
      const config = loadConfig(program.opts().baseUrl);
      const result = await listTeams(
        config,
        {
          page: Number(options.page),
          size: Number(options.size),
          sort: [{ field: options.sortField, direction: options.sortDirection }],
        },
        { filters: [] },
      );
      printJson(result);
    } catch (error) {
      printError(error);
      process.exitCode = 1;
    }
  });

team
  .command("users")
  .description("List users for a team")
  .requiredOption("--team-id <id>", "Team id")
  .action(async (options) => {
    try {
      const config = loadConfig(program.opts().baseUrl);
      const result = await listTeamUsers(config, Number(options.teamId));
      printJson(result);
    } catch (error) {
      printError(error);
      process.exitCode = 1;
    }
  });

const workflow = program.command("workflow").description("Workflow operations");

workflow
  .command("list")
  .description("List workflows for a team")
  .requiredOption("--team-id <id>", "Team id")
  .action(async (options) => {
    try {
      const config = loadConfig(program.opts().baseUrl);
      const result = await listWorkflowsForTeam(
        config,
        Number(options.teamId),
      );
      printJson(result);
    } catch (error) {
      printError(error);
      process.exitCode = 1;
    }
  });

workflow
  .command("states")
  .description("List states for a workflow")
  .requiredOption("--workflow-id <id>", "Workflow id")
  .action(async (options) => {
    try {
      const config = loadConfig(program.opts().baseUrl);
      const result = await getWorkflowDetail(
        config,
        Number(options.workflowId),
      );
      const states = (result as { states?: unknown[] }).states ?? [];
      printJson(states);
    } catch (error) {
      printError(error);
      process.exitCode = 1;
    }
  });

const project = program.command("project").description("Project operations");

project
  .command("list")
  .description("List projects")
  .option("--page <number>", "Page number", "1")
  .option("--size <number>", "Page size", "20")
  .option("--sort-field <field>", "Sort field", "name")
  .option("--sort-direction <direction>", "Sort direction", "asc")
  .action(async (options) => {
    try {
      const config = loadConfig(program.opts().baseUrl);
      const result = await listProjects(
        config,
        {
          page: Number(options.page),
          size: Number(options.size),
          sort: [{ field: options.sortField, direction: options.sortDirection }],
        },
        { filters: [] },
      );
      printJson(result);
    } catch (error) {
      printError(error);
      process.exitCode = 1;
    }
  });

const ticket = program.command("ticket").description("Ticket operations");

ticket
  .command("create")
  .description("Create a ticket")
  .requiredOption("--team-id <id>", "Team id")
  .requiredOption("--workflow-id <id>", "Workflow id")
  .requiredOption("--state-id <id>", "Workflow state id")
  .requiredOption("--requester-id <id>", "Requester user id")
  .requiredOption("--priority <priority>", "Priority")
  .requiredOption("--title <title>", "Ticket title")
  .requiredOption("--description <description>", "Ticket description")
  .action(async (options) => {
    try {
      const config = loadConfig(program.opts().baseUrl);
      const priority = parsePriority(options.priority);
      const result = await createTicket(config, {
        teamId: Number(options.teamId),
        workflowId: Number(options.workflowId),
        stateId: Number(options.stateId),
        requesterId: Number(options.requesterId),
        priority,
        title: options.title,
        description: options.description,
      });
      printJson(result);
    } catch (error) {
      printError(error);
      process.exitCode = 1;
    }
  });

program.parseAsync(process.argv).catch((error) => {
  printError(error);
  process.exitCode = 1;
});
