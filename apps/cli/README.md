# FlowInquiry CLI (fi)

Minimal Bun + TypeScript CLI for the FlowInquiry HTTP API.

## Requirements

- Bun
- `FLOWINQUIRY_TOKEN` environment variable (JWT) for authenticated commands
- Optional: `FLOWINQUIRY_BASE_URL` (defaults to `http://localhost:8080`)

## Getting a Token

```bash
curl -s -X POST http://localhost:1234/api/authenticate \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@flowinquiry.io","password":"admin"}'
# Returns: {"id_token":"eyJ..."}
```

## Usage

```bash
export FLOWINQUIRY_TOKEN="your_jwt_token"
export FLOWINQUIRY_BASE_URL="http://localhost:1234"  # if using Caddy proxy

bun apps/cli/src/index.ts <command>
```

## Command Groups

- auth
- user
- authority
- authority-permission
- resource
- team
- org
- workflow
- project
- iteration
- epic
- project-setting
- ticket
- report
- comment
- notification
- activity
- watcher
- setting
- file
- timezone
- version
- ai
- sse

### Auth

```bash
bun apps/cli/src/index.ts auth authenticate --email admin@flowinquiry.io --password admin
bun apps/cli/src/index.ts auth whoami
bun apps/cli/src/index.ts auth change-password --current oldpass --new newpass
```

### Teams

```bash
bun apps/cli/src/index.ts team list --page 1 --size 20
bun apps/cli/src/index.ts team users --team-id 1
bun apps/cli/src/index.ts team add-users --team-id 1 --user-ids 2,3 --role MEMBER
```

### Workflows

```bash
bun apps/cli/src/index.ts workflow list --team-id 1
bun apps/cli/src/index.ts workflow details --workflow-id 4
bun apps/cli/src/index.ts workflow transitions --workflow-id 4 --state-id 12
```

### Projects

```bash
bun apps/cli/src/index.ts project search --page 1 --size 20
bun apps/cli/src/index.ts project export --format csv --out /tmp/projects.csv
```

### Tickets

```bash
bun apps/cli/src/index.ts ticket create \
  --team-id 1 \
  --workflow-id 4 \
  --state-id 13 \
  --requester-id 1 \
  --priority High \
  --title "Login issue" \
  --description "User cannot login"

bun apps/cli/src/index.ts ticket search --filter "priority:eq:High" --page 1 --size 20
bun apps/cli/src/index.ts ticket update-state --ticket-id 1 --new-state-id 10
```

### Files

```bash
bun apps/cli/src/index.ts file upload --path ./logo.png --type images
bun apps/cli/src/index.ts file download --remote-path images/logo.png --out /tmp/logo.png
```

### SSE

```bash
bun apps/cli/src/index.ts sse listen --user-id 1
```

## Filters & Pagination

- Pagination: `--page`, `--size`, `--sort-field`, `--sort-direction`
- Filters: `--filter "field:op:value"` (repeatable) or `--filter-json '<QueryDTO JSON>'`

## OpenAPI Types

Generate client types from a running backend (dev profile):

```bash
cd apps/cli
bun run gen:api
```

## Project Structure

```
src/
├── index.ts          # Entry point
├── cli.ts            # Command definitions (Commander.js)
├── config.ts         # Config loader (env vars)
├── http.ts           # HTTP client wrapper
├── output.ts         # JSON/error output
├── utils.ts          # Priority parser
└── commands/         # endpoint wrappers per domain
```
