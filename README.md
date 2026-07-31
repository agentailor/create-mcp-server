# @agentailor/create-mcp-server

[![npm version](https://img.shields.io/npm/v/@agentailor/create-mcp-server.svg)](https://www.npmjs.com/package/@agentailor/create-mcp-server)
[![Test](https://github.com/agentailor/create-mcp-server/actions/workflows/test.yml/badge.svg)](https://github.com/agentailor/create-mcp-server/actions/workflows/test.yml)
[![npm downloads](https://img.shields.io/npm/dt/@agentailor/create-mcp-server.svg)](https://www.npmjs.com/package/@agentailor/create-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@agentailor/create-mcp-server.svg)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/agentailor/create-mcp-server/pulls)

Scaffold production-ready MCP servers in seconds.

## Quick Start

**Interactive mode** (guided prompts):

```bash
npx @agentailor/create-mcp-server
```

**CLI mode** (all options via arguments):

```bash
npx @agentailor/create-mcp-server --name=my-server
```

## CLI Options

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--name` | `-n` | — | Project name (required in CLI mode) |
| `--package-manager` | `-p` | `npm` | Package manager: npm, pnpm, yarn |
| `--framework` | `-f` | `sdk` | Framework: sdk, fastmcp |
| `--stdio` | — | `false` | Use stdio transport (for local clients) |
| `--template` | `-t` | `stateless` | Accepted for compatibility; SDK v2 serves both modes through one per-request idiom |
| `--oauth` | — | `false` | Enable OAuth (sdk HTTP only, incompatible with --stdio) |
| `--no-git` | — | `false` | Skip git initialization |
| `--help` | `-h` | — | Show help |
| `--version` | `-V` | — | Show version |

**Examples:**

```bash
# Minimal - uses all defaults (HTTP streamable)
npx @agentailor/create-mcp-server --name=my-server

# stdio server (for local clients)
npx @agentailor/create-mcp-server --name=my-server --stdio

# stdio with FastMCP
npx @agentailor/create-mcp-server --name=my-server --stdio --framework=fastmcp

# Full HTTP options
npx @agentailor/create-mcp-server \
  --name=my-auth-server \
  --package-manager=pnpm \
  --framework=sdk \
  --oauth

# Short flags
npx @agentailor/create-mcp-server -n my-server -p yarn -f fastmcp
```

## Features

- **MCP SDK v2** — SDK projects serve protocol revision `2026-07-28` and still accept 2025-era clients
- **Two frameworks** — Official MCP SDK or FastMCP
- **Two transport types** — HTTP (streamable) or stdio (for local clients)
- **Stateless by design** — the SDK handler builds a fresh server per request, so HTTP servers scale without sticky sessions
- **Optional OAuth** — OIDC-compliant authentication (SDK HTTP only) ([setup guide](docs/oauth-setup.md))
- **Package manager choice** — npm, pnpm, or yarn
- **TypeScript ready** — ready to customize
- **Docker ready** — production Dockerfile included (HTTP transport)
- **MCP Inspector** — built-in debugging with `npm run inspect`

## Frameworks

| Framework | Description |
|-----------|-------------|
| **Official MCP SDK** (default) | SDK v2, full control with Express.js, supports OAuth |
| **FastMCP** | Simpler API with less boilerplate (still on SDK v1) |

### Official MCP SDK

SDK projects are generated against the [MCP TypeScript SDK v2](https://ts.sdk.modelcontextprotocol.io/v2/) — the split `@modelcontextprotocol/server`, `@modelcontextprotocol/express`, and `@modelcontextprotocol/node` packages, rather than the v1 `@modelcontextprotocol/sdk` monolith.

HTTP servers are built on `createMcpHandler`, which runs the server factory once per request. They serve protocol revision `2026-07-28` and also accept 2025-era clients. stdio servers use `serveStdio`, which negotiates the era per connection.

### FastMCP

[FastMCP](https://github.com/punkpeye/fastmcp) is a TypeScript framework built on top of the official MCP SDK that provides a simpler, more intuitive API for building MCP servers.

> **Note:** FastMCP has not migrated to SDK v2 — it still depends on `@modelcontextprotocol/sdk` v1 internally, so FastMCP projects speak the 2025-era protocol. Choose the Official MCP SDK if you need protocol revision `2026-07-28`.

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

## Transport Types

| Feature | HTTP (Streamable HTTP) | stdio |
|---------|------------------------|-------|
| Use case | Remote access, cloud deployment | Local clients (Claude Desktop) |
| Protocol | HTTP | stdin/stdout |
| OAuth support | ✓ (SDK only) | — |
| Docker deployment | ✓ | — |
| Port configuration | ✓ | — |

**HTTP**: Deploy as an HTTP server accessible remotely.

**stdio**: Run as a local process. Communicates over stdin/stdout. Ideal for local clients. No HTTP server, no port, no Dockerfile generated.

## Server Modes (HTTP only)

SDK v2 serves every HTTP request through a single per-request idiom: `createMcpHandler` builds a fresh `McpServer` for each call, and 2025-era clients are served through the same path. The `stateless`/`stateful` distinction that v1 required no longer changes the generated project.

`--template` is still accepted so existing invocations keep working, but both values produce the same output. If you need session-based serving with SSE resumability, the SDK still offers `NodeStreamableHTTPServerTransport` — see the [SDK v2 sessions guide](https://ts.sdk.modelcontextprotocol.io/v2/serving/sessions-state-scaling.html).

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

## Learning Resources

| Guide | Description |
|-------|-------------|
| [Create Your First MCP Server in 5 Minutes](https://blog.agentailor.com/posts/create-your-first-mcp-server-in-5-minutes?utm_source=github&utm_medium=readme&utm_campaign=create-mcp-server) | Build your first production-ready MCP server. A complete beginner guide to scaffolding a Fetch MCP server with TypeScript. |
| [Securing MCP Servers with Keycloak](https://blog.agentailor.com/posts/oauth-for-mcp-servers-practical-guide-keycloak?utm_source=github&utm_medium=readme&utm_campaign=create-mcp-server) | Learn how to secure your MCP servers with OAuth authentication using Keycloak. |
| [Getting Started with FastMCP](https://blog.agentailor.com/posts/getting-started-with-fastmcp?utm_source=github&utm_medium=readme&utm_campaign=create-mcp-server) | Build MCP servers faster with FastMCP — the TypeScript framework inspired by Python's most popular MCP library. |
| [OAuth for MCP Clients (Next.js + LangGraph.js)](https://blog.agentailor.com/posts/mcp-client-oauth-nextjs-langgraph?utm_source=github&utm_medium=readme&utm_campaign=create-mcp-server) | Implement OAuth authentication in your MCP client using Next.js and the MCP SDK. |

## Need help building MCP servers or agent infrastructure?

I help teams design and ship production-ready AI agent systems (MCP, LangGraph, RAG, memory, performance).

If you’re building something serious on top of this:

→ [DM me on LinkedIn](https://www.linkedin.com/in/ali-ibrahim-junior/)

Happy to jump on a short call.

## What is MCP?

The [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) is an open protocol that enables AI assistants to interact with external tools, data sources, and services.

## Built by Agentailor

Built by [Agentailor](https://agentailor.com/?utm_source=github&utm_medium=readme&utm_campaign=create-mcp-server) — your launchpad for production-ready MCP servers and scalable AI agents. We provide the tools, templates, and expertise to ship AI-powered applications faster.
