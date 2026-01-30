## Project Structure
- Flowinquiery is an OSS for ticket mgmt written in java spring, next js
- apps (root level folder)
    - backend
    - cli (we are working on this)
    - docs (use when need quick info about project)
    - mcp (we are working on this)
    - ops (docker, k8s scripts for deploying)

## GOAL
- Add CLI to it's backend (see .specs/cli-api-parity.md)
- Enable the app to be used by AI agents like (Claude Desktop) via mcp
- AI agnets should be abel to do every action via mcp
- Flow expected
    Claude --> MCP --> CLI --> Backend <--> DB


