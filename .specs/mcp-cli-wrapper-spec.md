# FlowInquiry MCP Wrapper (Bun Binary) Spec

## Purpose
Provide a Model Context Protocol (MCP) server as a Bun-compiled binary that exposes the FlowInquiry CLI capabilities to AI agents. The MCP server should be stateless, non-interactive, and reuse existing CLI HTTP logic for correctness and parity with the REST API.

## Scope
Phase 1 exposes the same operations as the current CLI:
- auth.whoami
- team.list
- team.users
- workflow.list
- workflow.states
- project.list
- ticket.create

## Location
- New app: `apps/mcp`
- Output binary: `apps/mcp/dist/fi-mcp` (built via Bun)

## Runtime + Build
- Runtime: Bun
- Build: `bun build apps/mcp/src/index.ts --compile --outfile apps/mcp/dist/fi-mcp` 
- Minify the build 
- Entry point: `apps/mcp/src/index.ts`
- No dynamic network calls at build time.

## Dependencies
- Reuse HTTP and types from `apps/cli/src` (import directly) or extract to shared module if needed later.
- Use a minimal MCP server implementation for JSON-RPC 2.0 over SSE (Server-Sent Events) for remote access.

## Environment / Config
Required:
- `FLOWINQUIRY_TOKEN` (JWT)
Optional:
- `FLOWINQUIRY_BASE_URL` (default: `http://localhost:8080`)
- `MCP_PORT` (default: `3001`) - port for MCP SSE server

Config resolution precedence:
1. MCP tool input `baseUrl` (optional field on each tool)
2. `FLOWINQUIRY_BASE_URL` env
3. default `http://localhost:8080`

Token resolution:
- Always from `FLOWINQUIRY_TOKEN` env.
- If missing, MCP server returns a structured error for the tool call.

## MCP Protocol
Transport: SSE (Server-Sent Events)
Protocol: JSON-RPC 2.0 compatible with MCP

Endpoints:
- `GET /sse` - SSE connection for server→client messages
- `POST /message` - client→server requests

Server capabilities:
- `initialize`
- `tools/list`
- `tools/call`
- `shutdown`

## Tool List (Phase 1)
All tool names are prefixed with `fi.`.

1) `fi.auth.whoami`
Input: {}
Output: current user JSON object from `/api/account`

2) `fi.team.list`
Input:
{
  "page": number (default 1),
  "size": number (default 20),
  "sortField": string (default "name"),
  "sortDirection": "asc" | "desc" (default "asc"),
  "baseUrl"?: string
}
Output: pageable list of teams

3) `fi.team.users`
Input:
{
  "teamId": number (required),
  "baseUrl"?: string
}
Output: array of users for the team

4) `fi.workflow.list`
Input:
{
  "teamId": number (required),
  "baseUrl"?: string
}
Output: array of workflows

5) `fi.workflow.states`
Input:
{
  "workflowId": number (required),
  "baseUrl"?: string
}
Output: array of workflow states

6) `fi.project.list`
Input:
{
  "page": number (default 1),
  "size": number (default 20),
  "sortField": string (default "name"),
  "sortDirection": "asc" | "desc" (default "asc"),
  "baseUrl"?: string
}
Output: pageable list of projects

7) `fi.ticket.create`
Input:
{
  "teamId": number (required),
  "workflowId": number (required),
  "stateId": number (required),
  "requesterId": number (required),
  "priority": "Critical" | "High" | "Medium" | "Low" | "Trivial" (required),
  "title": string (required),
  "description": string (required),
  "baseUrl"?: string
}
Output: created ticket JSON object

## Error Handling
- MCP errors follow JSON-RPC error shape with `code`, `message`, `data`.
- Validation errors: `code = -32602` with a clear message.
- Missing token: `code = -32001` ("Missing FLOWINQUIRY_TOKEN").
- HTTP errors bubble up with `code = -32002` and include status + response summary.
- Unexpected exceptions: `code = -32099`.

## Output Rules
- Tool results are returned under `result`.
- No logging to stdout; diagnostics go to stderr only.
- Tool results are raw JSON returned by the API (no additional formatting).

## Security
- Token is only read from environment.
- No token is echoed to output or logs.

## Testing / Smoke Checks
Manual:
1. Run MCP binary with `FLOWINQUIRY_TOKEN` set.
2. Send `tools/list` over stdio to confirm tool registration.
3. Call `fi.auth.whoami` to validate auth.

Optional scripted smoke test (future):
- Use a small script to send JSON-RPC messages to stdio and validate responses.

## Documentation
Add `apps/mcp/README.md` with:
- How to build the binary
- Env vars
- Example MCP JSON-RPC requests
- Common troubleshooting steps
