# FlowInquiry CLI ↔️ Backend API Parity Spec

Owner: Sandip Wane

Context: Current CLI (`apps/cli`) only exposes a few read/search commands and ticket creation, while backend Java controllers expose a broad API surface. This spec describes the work needed to reach near-complete parity so another agent can implement without re-discovery.

## Goals
- Expose CLI commands for all meaningful backend endpoints under `/api/**`, matching auth requirements, payloads, and pagination/sorting semantics.
- Keep CLI ergonomics consistent with existing patterns (Commander, `request` helper, `QueryDTO` + Pageable for searches, JSON output).
- Generate or define typed request/response models to avoid drift.

## Non-Goals
- Frontend changes.
- Backend API changes (read-only discovery; consume as-is).

## Constraints
- Keep ASCII; follow repo coding guidelines.
- Prefer generated client from OpenAPI (`/v3/api-docs` or static schema) to reduce manual typing.

## Deliverables
1) Expanded CLI command tree covering endpoints below.
2) Typed API client layer reused by commands.
3) Updated `apps/cli/README.md` with examples.
4) Tests for each command (mock HTTP where possible).

## Backend Endpoint Inventory → Required CLI Surface
Source: `apps/backend/commons/src/main/java/**/controller/*.java`.

### Auth & Users
- `POST /api/authenticate` (login), `GET /api/authenticate` (session check).
- Account: register, resend activation, activate, get/update account, change password, reset password init/finish.
  - (`UserAccountController`: `/api/register`, `/api/{email}/resend-activation-email`, `/api/activate`, `/api/account` GET/POST, `/api/account/change-password`, `/api/account/reset-password/init`, `/api/account/reset-password/finish`).
- Public users CRUD/search and profile update (multipart avatar): `POST /api/users/search`, `PUT /api/users` (multipart), `GET /api/users/{id}`, `DELETE /api/users/{id}`, permissions, hierarchy, org chart, search-by-term, direct reports, create user.
- Authorities and permissions: `POST /api/authorities`, `GET /api/authorities`, `GET /api/authorities/{name}`, `DELETE /api/authorities/{id}`, list users, search users not in authority, add users, remove user. Authority-resource permission: `GET /api/authority-resource-permission/{authorityName}`, `POST /api/authority-resource-permission/batchSave`.
- Resources listing: `GET /api/resources`.

### Teams & Organizations
- Teams CRUD (multipart logo) and bulk delete: `POST /api/teams`, `PUT /api/teams`, `DELETE /api/teams/{id}`, `DELETE /api/teams` (ids body).
- Team queries: `GET /api/teams/{id}`, `POST /api/teams/search`.
- Membership: list members, get teams by user, add-users (body ids+role), searchUsersNotInTeam, remove user, get user role, has-manager.
- Organizations CRUD/search: `POST /api/organizations`, `PUT /api/organizations/{id}`, `DELETE /api/organizations/{id}`, `GET /api/organizations/{id}`, `POST /api/organizations/search`.

### Workflows
- Search: `POST /api/workflows/search`.
- CRUD: `GET /api/workflows/{id}`, `PUT /api/workflows/{id}`, `DELETE /api/workflows/{id}`.
- Team link ops: `DELETE /api/workflows/{workflowId}/teams/{teamId}`, `GET /api/workflows/teams/{teamId}`, `GET /api/workflows/teams/{teamId}/global-workflows-not-linked-yet`.
- States/transitions helpers: `GET /api/workflows/{workflowId}/transitions?workflowStateId=&includeSelf=`, `GET /api/workflows/{workflowId}/initial-states`, `GET /api/workflows/teams/{teamId}/project-workflow`.
- Detailed workflow CRUD: `GET /api/workflows/details/{workflowId}`, `POST /api/workflows/details`, `PUT /api/workflows/details/{workflowId}`.
- Copy/reference: `POST /api/workflows/{refId}/teams/{teamId}/create-workflow-reference`, `POST /api/workflows/{cloneId}/teams/{teamId}/create-workflow-clone`.

### Projects, Epics, Iterations, Settings
- Projects: `POST /api/projects`, `GET /api/projects/{id}`, `POST /api/projects/search`, `POST /api/projects/export` (csv/xlsx via Accept), `PUT /api/projects/{projectId}`, `DELETE /api/projects/{projectId}`, `GET /api/projects/{projectId}/iterations`, `/epics`, `GET /api/projects/short-name/{shortName}`, `GET /api/projects/by-user/{userId}`.
- Project iterations: `GET /api/project-iterations/{id}`, `POST /api/project-iterations`, `PUT /api/project-iterations/{id}`, `DELETE /api/project-iterations/{id}`, `POST /api/project-iterations/{id}/close`.
- Project epics: `GET /api/project-epics/{id}`, `POST /api/project-epics`, `PUT /api/project-epics/{id}`, `DELETE /api/project-epics/{id}`.
- Project settings: `GET /api/project-settings/project/{projectId}`, `POST /api/project-settings`, `PUT /api/project-settings/project/{projectId}`.

### Tickets & Reports
- Tickets: `POST /api/tickets/search`, `GET /api/tickets/{id}`, `POST /api/tickets`, `PUT /api/tickets/{id}`, `DELETE /api/tickets/{id}`.
- Navigation: `GET /api/tickets/{currentId}/next`, `/previous` (optional projectId).
- Team analytics: ticket distribution, priority distribution, statistics, overdue list/count, unassigned list, creation time series (`/teams/{teamId}/ticket-distribution`, `/priority-distribution`, `/statistics`, `/overdue-tickets`, `/overdue-tickets/count`, `/unassigned-tickets`, `/ticket-creations-day-series`).
- User analytics: overdue tickets by user, team ticket priority distribution (`/users/{userId}/overdue-tickets`, `/team-tickets-priority-distribution`).
- State history: `GET /api/tickets/{ticketId}/states-history`.
- State update: `PATCH /api/tickets/{ticketId}/state` body `{newStateId}`.
- Reports: `GET /api/reports/tickets/ageing` (query params via `TicketQueryParams`).

### Collaboration
- Comments: create/update (`POST /api/comments`), get by id, list by entity (entityType/entityId), delete.
- Notifications: list by user, mark-read (`POST /api/notifications/mark-read`), unread list (`/unread`).
- Activity logs: list all, list by user (`/api/activity-logs`, `/api/activity-logs/user/{userId}`).
- Watchers: add/remove (`/api/entity-watcher/add`, `/remove`), list, list by user (`/user`).
- App settings: get by key, list, upsert, update by key (`/api/app-settings` variants).

### Files
- Upload single file: `POST /api/files/singleUpload` (multipart).
- Entity attachments: upload (multipart), list, delete (`/api/entity-attachments`).
- Download: `GET /api/files/**` (stream to disk).

### Shared/AI/Utils
- Timezones: `GET /api/timezones`.
- Version: `GET /api/version`, `GET /api/version/check`.
- SSE events: `GET /api/sse/events/{userId}` (stream).
- AI chat: `POST /api/ai` (ticket summary from description) if available.

## CLI Design Notes
- Keep existing groups; add new groups/subcommands mirroring modules (auth, user, authority, team, org, workflow, project, iteration, epic, project-setting, ticket, report, comment, notification, activity, watcher, file, timezone, version, ai).
- Pagination/sorting flags: reuse `--page --size --sort-field --sort-direction`; for searches accept `--filter` flag(s) that map to `QueryDTO` (consider JSON or `field:op:value` parsing).
- Date/time params: accept ISO strings; for range convenience accept `--range` (passes through).
- Multipart helpers: implement minimal file reading from path for logo/avatar/upload endpoints.
- Exports/downloads: allow `--out <file>` to write response body; detect content-type.
- Streaming SSE: optional `--since-id` not needed; just open stream and pipe lines.

## Implementation Steps (sequenced)
1) Generate API types/client (preferred path confirmed)
   - Backend exposes OpenAPI at `/v3/api-docs` (JSON) and `/v3/api-docs.yaml` when running with `dev` profile (see `apps/backend/server/src/main/resources/config/application-dev.yml`).
   - Add Bun script `gen:api` that:
     1) curls `http://localhost:8080/v3/api-docs` to `apps/cli/.openapi/flowinquiry.json` (ensure backend is running with `spring.profiles.active=dev`).
     2) runs `openapi-typescript apps/cli/.openapi/flowinquiry.json -o apps/cli/src/gen/api.ts` (or `swagger-typescript-api` if preferred for client functions).
   - Commands consume generated types/client; avoid manual drift. If OpenAPI unavailable, fall back to minimal handwritten wrappers under `apps/cli/src/api/`.
2) Refactor `request` helper to support:
   - multipart (FormData in Bun),
   - stream download to file,
   - SSE consumption,
   - content-type negotiation for exports.
3) Add command groups incrementally (auth → users → teams → workflows → projects → tickets → collab → files → shared).
4) Tests: add HTTP-mocked tests per group using existing test setup; cover happy path and required flags.
5) Docs: update `apps/cli/README.md` with examples for each group.

## Acceptance Criteria
- Every endpoint above is reachable via a CLI command with sensible naming and required parameters.
- CLI supports pagination/sorting and basic filtering for all search endpoints.
- File upload/download and multipart endpoints work locally (manual smoke).
- Tests exist for each new command (mocked HTTP).
- README documents new commands and auth flow.

## Open Questions
- Is OpenAPI schema accessible locally? If not, fallback to manual endpoint typing.
- Expected auth token source? (env, config file) Keep `loadConfig` behavior; extend if needed.
