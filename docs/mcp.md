# PacStac MCP server (read-only)

PacStac can also be accessed via an MCP server that exposes read-only tools for:

- `verify`
- `attestations`
- `jwks`
- `binding events`

If you are building an agent-based integration, prefer MCP for structured access patterns; otherwise use the HTTP endpoints in `docs/api-developer.md`.

