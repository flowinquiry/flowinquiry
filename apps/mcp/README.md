# FlowInquiry MCP Server (fi-mcp)

Bun-based MCP server that exposes FlowInquiry CLI operations over SSE.

## Build

```bash
cd apps/mcp
bun run build
```

Binary output:

```
apps/mcp/dist/fi-mcp
```

## Run

```bash
export FLOWINQUIRY_TOKEN="your_jwt_token"
export FLOWINQUIRY_BASE_URL="http://localhost:8080"  # optional
export MCP_PORT=3001  # optional

./apps/mcp/dist/fi-mcp
```

## SSE Endpoints

- `GET /sse` - opens SSE stream
- `POST /message` - sends JSON-RPC requests

The SSE connection returns a `ready` event containing a `clientId` that must be included in POSTs to `/message` (either in the JSON body or as `?clientId=` query param).

## Example

Open SSE (client receives `clientId`):

```bash
curl -N http://localhost:3001/sse
```

Send a JSON-RPC request (replace `CLIENT_ID`):

```bash
curl -s -X POST http://localhost:3001/message \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "CLIENT_ID",
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

## Tool Calls

Example `fi.auth.whoami`:

```json
{
  "clientId": "CLIENT_ID",
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "fi.auth.whoami",
    "arguments": {}
  }
}
```

## Troubleshooting

- Missing token: set `FLOWINQUIRY_TOKEN` before starting the server.
- API base URL: set `FLOWINQUIRY_BASE_URL` if the API is not on `http://localhost:8080`.
- If you receive `Unknown clientId`, reconnect to `/sse` to get a fresh id.
