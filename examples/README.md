# Examples

Complete MCP servers built with `create-mcp-server`. Each one starts as the unmodified output of the CLI, so its git history shows exactly what was added on top.

| Example                                         | What it shows                                                                               | CLI version |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------- |
| [notes-oauth-keycloak](./notes-oauth-keycloak/) | `--oauth` end to end: a local Keycloak with the realm already set up, and notes kept per user | 0.11.0      |

Every example is self-contained: `cd` into it and follow its README. CI runs each example's tests and smoke check (see `.github/workflows/examples.yml`).
