# FlowInquiry CLI + MCP Plan

## Goals
- Provide a minimal Bun + TypeScript CLI (`fi`) that calls the existing FlowInquiry HTTP API.
- Keep MCP context small by delegating logic to the CLI.
- Enable Claude/Desktop (via MCP) to create tickets and perform related operations without using the web UI.

## Decisions
- **No backend conversion**: keep the Spring Boot backend as-is; CLI is a client of the existing HTTP API.
- **Auth model**: use a single environment variable `FLOWINQUIRY_TOKEN` (JWT). No email/password flow.
- **Transport**: CLI always calls HTTP API to avoid data/permission disparity.
- **CLI language/runtime**: Bun + TypeScript.
- **CLI name**: `fi`.
- **Config cache**: allowed to store cached auth/config in `~/.config/flowinquiry/config.json` (if needed later).

## Intended UX
- MCP tools call the CLI with `FLOWINQUIRY_TOKEN` set in the environment.
- CLI outputs JSON by default to be machine-readable for MCP.
- CLI should be non-interactive by default; flags provide all required inputs.

## Initial Scope (Phase 1)
- Authentication validation: `fi auth whoami` (calls `/api/authenticate`).
- Read-only data needed for ticket creation:
  - list teams
  - list workflows for a team
  - list workflow states
  - list users for a team
  - list projects
- Ticket creation:
  - `fi ticket create --team-id --workflow-id --state-id --requester-id --priority --title --description`

## API Notes Observed (From Repo)
- Login/auth endpoints exist at `/api/authenticate` and `/api/login`.
- Tickets endpoint: `POST /api/tickets` with `TicketDTO` payload.
- Ticket payload requires `teamId`, `workflowId`, `requestUserId`, `priority`, `currentStateId`.

## Output Format
- Default: JSON only (machine-first).
- Optional `--human` for formatted output if we decide to add later.

## Next Steps
- Add a new workspace package (proposed: `packages/flowinquiry-cli`).
- Implement HTTP client with base URL + bearer token headers.
- Add command scaffolding and first commands from Phase 1.
- Add minimal docs/README for CLI usage and MCP wiring.
