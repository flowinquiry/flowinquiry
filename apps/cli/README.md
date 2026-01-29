# FlowInquiry CLI (fi)

Minimal Bun + TypeScript CLI for the FlowInquiry HTTP API.

## Requirements

- Bun
- `FLOWINQUIRY_TOKEN` environment variable (JWT)
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

### Auth

```bash
bun apps/cli/src/index.ts auth whoami
```

### Teams

```bash
bun apps/cli/src/index.ts team list
bun apps/cli/src/index.ts team users --team-id 1
```

### Workflows

```bash
bun apps/cli/src/index.ts workflow list --team-id 1
bun apps/cli/src/index.ts workflow states --workflow-id 4
```

### Projects

```bash
bun apps/cli/src/index.ts project list
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
└── commands/
    ├── auth.ts       # whoami
    ├── teams.ts      # list, users
    ├── workflows.ts  # list, states
    ├── projects.ts   # list
    └── tickets.ts    # create
```
