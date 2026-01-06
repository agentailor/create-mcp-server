# @agentailor/create-mcp-server

Scaffold production-ready MCP servers in seconds.

## Quick Start

```bash
npx @agentailor/create-mcp-server
```

## Features

- **Two templates** — stateless or stateful with session management
- **Optional OAuth** — OIDC-compliant authentication ([setup guide](docs/oauth-setup.md))
- **Package manager choice** — npm, pnpm, or yarn
- **TypeScript + Express.js** — ready to customize

## Templates

| Feature | Stateless (default) | Stateful |
|---------|---------------------|----------|
| Session management | — | ✓ |
| SSE support | — | ✓ |
| OAuth option | — | ✓ |
| Endpoints | POST /mcp | POST, GET, DELETE /mcp |

**Stateless**: Simple HTTP server — each request creates a new transport instance.

**Stateful**: Session-based server with transport reuse, Server-Sent Events for real-time updates, and optional OAuth authentication.

## Generated Project

```
my-mcp-server/
├── src/
│   ├── server.ts     # MCP server (tools, prompts, resources)
│   ├── index.ts      # Express app and transport setup
│   └── auth.ts       # OAuth middleware (if enabled)
├── package.json
├── tsconfig.json
├── .gitignore
├── .env.example
└── README.md
```

## What is MCP?

The [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) is an open protocol that enables AI assistants to interact with external tools, data sources, and services.

## Built by agentailor

Built by [agentailor](https://agentailor.com/?utm_source=github&utm_medium=readme&utm_campaign=create-mcp-server) — your launchpad for production-ready MCP servers and scalable AI agents. We provide the tools, templates, and expertise to ship AI-powered applications faster.
