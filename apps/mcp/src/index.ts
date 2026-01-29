#!/usr/bin/env bun

import { whoami } from "../../cli/src/commands/auth";
import { listTeams, listTeamUsers } from "../../cli/src/commands/teams";
import { listWorkflowsForTeam, getWorkflowDetail } from "../../cli/src/commands/workflows";
import { listProjects } from "../../cli/src/commands/projects";
import { createTicket } from "../../cli/src/commands/tickets";
import { parsePriority } from "../../cli/src/utils";
import type { CliConfig } from "../../cli/src/config";
import type { TicketPriority } from "../../cli/src/types";

const encoder = new TextEncoder();
const PORT = Number.parseInt(process.env.MCP_PORT || "3001", 10);

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
    name: "fi.auth.whoami",
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
    name: "fi.team.list",
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
    name: "fi.team.users",
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
    name: "fi.workflow.list",
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
    name: "fi.workflow.states",
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
    name: "fi.project.list",
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
    name: "fi.ticket.create",
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
    case "fi.auth.whoami": {
      return whoami(config);
    }
    case "fi.team.list": {
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
    case "fi.team.users": {
      const teamId = asNumber(args.teamId, "teamId", true) as number;
      return listTeamUsers(config, teamId);
    }
    case "fi.workflow.list": {
      const teamId = asNumber(args.teamId, "teamId", true) as number;
      return listWorkflowsForTeam(config, teamId);
    }
    case "fi.workflow.states": {
      const workflowId = asNumber(args.workflowId, "workflowId", true) as number;
      const detail = await getWorkflowDetail(config, workflowId);
      return (detail as { states?: unknown[] }).states ?? [];
    }
    case "fi.project.list": {
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
    case "fi.ticket.create": {
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
          protocolVersion: "0.1.0",
          serverInfo: { name: "flowinquiry-mcp", version: "1.0.0" },
          capabilities: { tools: {} },
        });
      case "tools/list":
        return jsonRpcResult(id, { tools });
      case "tools/call": {
        const params = asObject(message.params ?? {}, "tools/call params");
        const name = asString(params.name, "name", true) as string;
        const args = params.arguments ? asObject(params.arguments, "arguments") : {};
        const result = await handleToolCall(name, args);
        return jsonRpcResult(id, result);
      }
      case "shutdown": {
        const response = jsonRpcResult(id, { ok: true });
        setTimeout(() => {
          process.exit(0);
        }, 25);
        return response;
      }
      default:
        return jsonRpcError(id, new McpError(-32601, `Method not found: ${message.method}`));
    }
  } catch (error) {
    return jsonRpcError(id, error as Error);
  }
}

type Client = {
  id: string;
  send: (payload: JsonRpcResponse) => void;
  sendRaw: (payload: string) => void;
  close: () => void;
};

const clients = new Map<string, Client>();

function formatSse(data: string, event?: string) {
  const eventLine = event ? `event: ${event}\n` : "";
  return `${eventLine}data: ${data}\n\n`;
}

function handleSseRequest(req: Request): Response {
  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId") ?? crypto.randomUUID();

  let closed = false;
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller;
    },
    cancel() {
      closed = true;
      clients.delete(clientId);
    },
  });

  const sendRaw = (payload: string) => {
    if (closed || !controllerRef) return;
    controllerRef.enqueue(encoder.encode(payload));
  };

  const client: Client = {
    id: clientId,
    send: (payload) => {
      sendRaw(formatSse(JSON.stringify(payload)));
    },
    sendRaw,
    close: () => {
      if (closed || !controllerRef) return;
      closed = true;
      controllerRef.close();
    },
  };

  clients.set(clientId, client);

  sendRaw(formatSse(JSON.stringify({ clientId }), "ready"));

  const keepAlive = setInterval(() => {
    sendRaw(": ping\n\n");
  }, 25000);

  const cleanup = () => {
    clearInterval(keepAlive);
    clients.delete(clientId);
  };

  stream.pipeTo(
    new WritableStream({
      close: cleanup,
      abort: cleanup,
    }),
  ).catch(() => {
    cleanup();
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function handleMessageRequest(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch (error) {
    console.error("Failed to parse JSON payload", error);
    return new Response("Invalid JSON", { status: 400 });
  }

  const url = new URL(req.url);
  const payloadObject = payload as Record<string, unknown>;
  const clientId =
    asString(payloadObject.clientId, "clientId") ||
    url.searchParams.get("clientId") ||
    undefined;

  if (!clientId) {
    return new Response("Missing clientId", { status: 400 });
  }

  const client = clients.get(clientId);
  if (!client) {
    return new Response("Unknown clientId", { status: 404 });
  }

  const message = payloadObject.message ?? payload;
  const requests = Array.isArray(message) ? message : [message];

  for (const request of requests) {
    const response = await handleRpcMessage(request as JsonRpcRequest);
    if (response && request && (request as JsonRpcRequest).id !== undefined) {
      client.send(response);
    }
  }

  return new Response(null, { status: 202 });
}

const server = Bun.serve({
  port: Number.isFinite(PORT) ? PORT : 3001,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/sse") {
      return handleSseRequest(req);
    }

    if (url.pathname === "/message") {
      return handleMessageRequest(req);
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.error(`MCP server listening on :${server.port}`);
