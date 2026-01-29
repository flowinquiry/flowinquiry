# FlowInquiry CLI (fi)

Minimal Bun + TypeScript CLI for the FlowInquiry HTTP API.

## Requirements
- Bun
- `FLOWINQUIRY_TOKEN` environment variable (JWT)
- Optional: `FLOWINQUIRY_BASE_URL` (defaults to `http://localhost:8080`)

## Usage

```bash
FLOWINQUIRY_TOKEN=... bun apps/flowinquiry-cli/src/index.ts auth whoami
```

### Teams

```bash
FLOWINQUIRY_TOKEN=... bun apps/flowinquiry-cli/src/index.ts team list
FLOWINQUIRY_TOKEN=... bun apps/flowinquiry-cli/src/index.ts team users --team-id 1
```

### Workflows

```bash
FLOWINQUIRY_TOKEN=... bun apps/flowinquiry-cli/src/index.ts workflow list --team-id 1
FLOWINQUIRY_TOKEN=... bun apps/flowinquiry-cli/src/index.ts workflow states --workflow-id 10
```

### Projects

```bash
FLOWINQUIRY_TOKEN=... bun apps/flowinquiry-cli/src/index.ts project list
```

### Tickets

```bash
FLOWINQUIRY_TOKEN=... bun apps/flowinquiry-cli/src/index.ts ticket create \
  --team-id 1 \
  --workflow-id 10 \
  --state-id 100 \
  --requester-id 55 \
  --priority High \
  --title "Login issue" \
  --description "User cannot login"
```
