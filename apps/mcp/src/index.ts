#!/usr/bin/env bun

import { whoami } from "../../cli/src/commands/auth";
import { listTeams, listTeamUsers } from "../../cli/src/commands/teams";
import { listWorkflowsForTeam, getWorkflowDetail } from "../../cli/src/commands/workflows";
import { listProjects } from "../../cli/src/commands/projects";
import { createTicket } from "../../cli/src/commands/tickets";
import { parsePriority } from "../../cli/src/utils";
import type { CliConfig } from "../../cli/src/config";
import type { TicketPriority } from "../../cli/src/types";

const DEFAULT_BASE_URL = "http://localhost:8080";

type JsonRpcId = string | number | null;

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: unknown;
};

type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
};

class McpError extends Error {
  code: number;
  data?: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

const tools: ToolDefinition[] = [
  {
    name: "fi_get_current_user",
    description: "Validate token and return current user",
    inputSchema: {
      type: "object",
      properties: {
        baseUrl: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "fi_list_teams",
    description: "List teams",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "number", default: 1 },
        size: { type: "number", default: 20 },
        sortField: { type: "string", default: "name" },
        sortDirection: { type: "string", enum: ["asc", "desc"], default: "asc" },
        baseUrl: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "fi_list_team_members",
    description: "List users for a team",
    inputSchema: {
      type: "object",
      properties: {
        teamId: { type: "number" },
        baseUrl: { type: "string" },
      },
      required: ["teamId"],
      additionalProperties: false,
    },
  },
  {
    name: "fi_list_workflows",
    description: "List workflows for a team",
    inputSchema: {
      type: "object",
      properties: {
        teamId: { type: "number" },
        baseUrl: { type: "string" },
      },
      required: ["teamId"],
      additionalProperties: false,
    },
  },
  {
    name: "fi_get_workflow_states",
    description: "List states for a workflow",
    inputSchema: {
      type: "object",
      properties: {
        workflowId: { type: "number" },
        baseUrl: { type: "string" },
      },
      required: ["workflowId"],
      additionalProperties: false,
    },
  },
  {
    name: "fi_list_projects",
    description: "List projects",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "number", default: 1 },
        size: { type: "number", default: 20 },
        sortField: { type: "string", default: "name" },
        sortDirection: { type: "string", enum: ["asc", "desc"], default: "asc" },
        baseUrl: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "fi_create_ticket",
    description: "Create a ticket",
    inputSchema: {
      type: "object",
      properties: {
        teamId: { type: "number" },
        workflowId: { type: "number" },
        stateId: { type: "number" },
        requesterId: { type: "number" },
        priority: {
          type: "string",
          enum: ["Critical", "High", "Medium", "Low", "Trivial"],
        },
        title: { type: "string" },
        description: { type: "string" },
        baseUrl: { type: "string" },
      },
      required: [
        "teamId",
        "workflowId",
        "stateId",
        "requesterId",
        "priority",
        "title",
        "description",
      ],
      additionalProperties: false,
    },
  },
];

function resolveConfig(baseUrl?: string): CliConfig {
  const token = process.env.FLOWINQUIRY_TOKEN;
  if (!token) {
    throw new McpError(-32001, "Missing FLOWINQUIRY_TOKEN");
  }

  const resolvedBaseUrl = baseUrl || process.env.FLOWINQUIRY_BASE_URL || DEFAULT_BASE_URL;

  return { baseUrl: resolvedBaseUrl, token };
}

function asObject(value: unknown, context: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new McpError(-32602, `${context} must be an object`);
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown, field: string, required = false): string | undefined {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new McpError(-32602, `Missing required field: ${field}`);
    }
    return undefined;
  }
  if (typeof value === "string") {
    return value;
  }
  throw new McpError(-32602, `Field ${field} must be a string`);
}

function asNumber(value: unknown, field: string, required = false): number | undefined {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new McpError(-32602, `Missing required field: ${field}`);
    }
    return undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  throw new McpError(-32602, `Field ${field} must be a number`);
}

function asPriority(value: unknown): TicketPriority {
  const parsed = asString(value, "priority", true);
  return parsePriority(parsed as string);
}

function asSortDirection(value: unknown): "asc" | "desc" | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (value === "asc" || value === "desc") {
    return value;
  }
  throw new McpError(-32602, "sortDirection must be 'asc' or 'desc'");
}

function jsonRpcResult(id: JsonRpcId, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function jsonRpcError(id: JsonRpcId, error: McpError | Error): JsonRpcResponse {
  if (error instanceof McpError) {
    return {
      jsonrpc: "2.0",
      id,
      error: {
        code: error.code,
        message: error.message,
        data: error.data,
      },
    };
  }

  return {
    jsonrpc: "2.0",
    id,
    error: {
      code: -32099,
      message: error.message || "Unexpected error",
    },
  };
}

async function handleToolCall(name: string, args: Record<string, unknown>) {
  const baseUrl = asString(args.baseUrl, "baseUrl");
  const config = resolveConfig(baseUrl);

  switch (name) {
    case "fi_get_current_user": {
      return whoami(config);
    }
    case "fi_list_teams": {
      const page = asNumber(args.page, "page") ?? 1;
      const size = asNumber(args.size, "size") ?? 20;
      const sortField = asString(args.sortField, "sortField") ?? "name";
      const sortDirection = asSortDirection(args.sortDirection) ?? "asc";
      return listTeams(
        config,
        {
          page,
          size,
          sort: [{ field: sortField, direction: sortDirection }],
        },
        { filters: [] },
      );
    }
    case "fi_list_team_members": {
      const teamId = asNumber(args.teamId, "teamId", true) as number;
      return listTeamUsers(config, teamId);
    }
    case "fi_list_workflows": {
      const teamId = asNumber(args.teamId, "teamId", true) as number;
      return listWorkflowsForTeam(config, teamId);
    }
    case "fi_get_workflow_states": {
      const workflowId = asNumber(args.workflowId, "workflowId", true) as number;
      const detail = await getWorkflowDetail(config, workflowId);
      return (detail as { states?: unknown[] }).states ?? [];
    }
    case "fi_list_projects": {
      const page = asNumber(args.page, "page") ?? 1;
      const size = asNumber(args.size, "size") ?? 20;
      const sortField = asString(args.sortField, "sortField") ?? "name";
      const sortDirection = asSortDirection(args.sortDirection) ?? "asc";
      return listProjects(
        config,
        {
          page,
          size,
          sort: [{ field: sortField, direction: sortDirection }],
        },
        { filters: [] },
      );
    }
    case "fi_create_ticket": {
      const teamId = asNumber(args.teamId, "teamId", true) as number;
      const workflowId = asNumber(args.workflowId, "workflowId", true) as number;
      const stateId = asNumber(args.stateId, "stateId", true) as number;
      const requesterId = asNumber(args.requesterId, "requesterId", true) as number;
      const priority = asPriority(args.priority);
      const title = asString(args.title, "title", true) as string;
      const description = asString(args.description, "description", true) as string;

      return createTicket(config, {
        teamId,
        workflowId,
        stateId,
        requesterId,
        priority,
        title,
        description,
      });
    }
    default:
      throw new McpError(-32601, `Unknown tool: ${name}`);
  }
}

async function handleRpcMessage(message: JsonRpcRequest): Promise<JsonRpcResponse | undefined> {
  if (!message || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    const id = (message && "id" in message) ? (message.id ?? null) : null;
    return jsonRpcError(id, new McpError(-32600, "Invalid JSON-RPC request"));
  }

  const id = message.id ?? null;

  try {
    switch (message.method) {
      case "initialize":
        return jsonRpcResult(id, {
          protocolVersion: "2024-11-05",
          serverInfo: { name: "flowinquiry-mcp", version: "1.0.0" },
          capabilities: { tools: {} },
        });
      case "notifications/initialized":
        // Client notification - no response needed
        return undefined;
      case "tools/list":
        return jsonRpcResult(id, { tools });
      case "tools/call": {
        const params = asObject(message.params ?? {}, "tools/call params");
        const name = asString(params.name, "name", true) as string;
        const args = params.arguments ? asObject(params.arguments, "arguments") : {};
        const result = await handleToolCall(name, args);
        return jsonRpcResult(id, { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] });
      }
      case "ping":
        return jsonRpcResult(id, {});
      default:
        // Ignore unknown notifications (methods without id expecting response)
        if (message.id === undefined) {
          return undefined;
        }
        return jsonRpcError(id, new McpError(-32601, `Method not found: ${message.method}`));
    }
  } catch (error) {
    return jsonRpcError(id, error as Error);
  }
}

function write(data: string) {
  Bun.write(Bun.stdout, data);
}

// Stdio transport - read from stdin, write to stdout
let buffer = "";
const decoder = new TextDecoder();

for await (const chunk of Bun.stdin.stream()) {
  buffer += decoder.decode(chunk, { stream: true });

  let newlineIndex: number;
  while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
    const line = buffer.slice(0, newlineIndex);
    buffer = buffer.slice(newlineIndex + 1);

    if (!line.trim()) continue;

    try {
      const request = JSON.parse(line);
      const response = await handleRpcMessage(request);
      if (response) {
        write(JSON.stringify(response) + "\n");
      }
    } catch (e) {
      console.error("Parse error:", e);
    }
  }
}
