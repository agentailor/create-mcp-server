# @agentailor/create-mcp-server

Scaffold production-ready MCP servers in seconds.

## Quick Start

```bash
npx @agentailor/create-mcp-server
```

## Features

- **Two frameworks** — Official MCP SDK or FastMCP
- **Two server modes** — stateless or stateful with session management
- **Optional OAuth** — OIDC-compliant authentication (SDK only) ([setup guide](docs/oauth-setup.md))
- **Package manager choice** — npm, pnpm, or yarn
- **TypeScript ready** — ready to customize
- **Docker ready** — production Dockerfile included
- **MCP Inspector** — built-in debugging with `npm run inspect`

## Frameworks

| Framework | Description |
|-----------|-------------|
| **Official MCP SDK** (default) | Full control with Express.js, supports OAuth |
| **FastMCP** | Simpler API with less boilerplate |

### FastMCP

[FastMCP](https://github.com/punkpeye/fastmcp) is a TypeScript framework built on top of the official MCP SDK that provides a simpler, more intuitive API for building MCP servers.

```typescript
import { FastMCP } from "fastmcp";
import { z } from "zod";

const server = new FastMCP({ name: "My Server", version: "1.0.0" });

server.addTool({
  name: "add",
  description: "Add two numbers",
  parameters: z.object({ a: z.number(), b: z.number() }),
  execute: async ({ a, b }) => String(a + b),
});

server.start({ transportType: "httpStream", httpStream: { port: 3000 } });
```

Learn more: [FastMCP Documentation](https://github.com/punkpeye/fastmcp)

## Server Modes

| Feature | Stateless (default) | Stateful |
|---------|---------------------|----------|
| Session management | — | ✓ |
| SSE support | — | ✓ |
| OAuth option (SDK only) | — | ✓ |
| Endpoints | POST /mcp | POST, GET, DELETE /mcp |

**Stateless**: Simple HTTP server — each request creates a new transport instance.

**Stateful**: Session-based server with transport reuse, Server-Sent Events for real-time updates, and optional OAuth authentication (SDK only).

## Generated Project

```
my-mcp-server/
├── src/
│   ├── server.ts     # MCP server (tools, prompts, resources)
│   ├── index.ts      # Express app and transport setup
│   └── auth.ts       # OAuth middleware (if enabled)
├── Dockerfile        # Production-ready Docker build
├── package.json
├── tsconfig.json
├── .gitignore
├── .env.example
└── README.md
```

**Scripts:**
- `npm run dev` — build and start the server
- `npm run inspect` — open MCP Inspector (update URL in `package.json` if needed)

## What is MCP?

The [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) is an open protocol that enables AI assistants to interact with external tools, data sources, and services.

## Built by Agentailor

Built by [Agentailor](https://agentailor.com/?utm_source=github&utm_medium=readme&utm_campaign=create-mcp-server) — your launchpad for production-ready MCP servers and scalable AI agents. We provide the tools, templates, and expertise to ship AI-powered applications faster.
