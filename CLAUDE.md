# @agentailor/create-mcp-server

A CLI tool to scaffold new MCP (Model Context Protocol) server projects.

## Project Structure

```
create-mcp-server/
├── src/
│   ├── index.ts                    # CLI entry point
│   └── templates/
│       ├── common/                 # Shared template files
│       │   ├── package.json.ts     # package.json template (framework-aware)
│       │   ├── tsconfig.json.ts    # tsconfig.json template
│       │   ├── gitignore.ts        # .gitignore template
│       │   ├── env.example.ts      # .env.example template
│       │   └── templates.test.ts   # Tests for common templates
│       ├── deployment/             # Deployment configuration templates
│       │   ├── dockerfile.ts       # Dockerfile template
│       │   ├── dockerignore.ts     # .dockerignore template
│       │   ├── index.ts            # Barrel exports
│       │   └── templates.test.ts   # Tests for deployment templates
│       ├── sdk/                    # Official MCP SDK templates
│       │   ├── stateless/          # Stateless HTTP template
│       │   │   ├── server.ts       # MCP server definition template
│       │   │   ├── index.ts        # Barrel export + getIndexTemplate
│       │   │   ├── readme.ts       # README.md template
│       │   │   └── templates.test.ts
│       │   └── stateful/           # Stateful HTTP template with OAuth option
│       │       ├── server.ts       # Re-exports from stateless
│       │       ├── index.ts        # Barrel export + getIndexTemplate
│       │       ├── readme.ts       # README.md template
│       │       ├── auth.ts         # OAuth authentication template
│       │       ├── auth.test.ts    # Tests for auth template
│       │       └── templates.test.ts
│       └── fastmcp/                # FastMCP templates
│           ├── server.ts           # FastMCP server definition template
│           ├── index.ts            # Barrel export + getIndexTemplate
│           ├── readme.ts           # README.md template
│           └── templates.test.ts
├── dist/                           # Compiled output (generated)
├── docs/
│   └── oauth-setup.md              # OAuth setup guide for various providers
├── official-examples/              # Reference MCP server examples
├── package.json
├── tsconfig.json
└── README.md
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test locally
node dist/index.js

# Run tests
npm test
npm run test:watch

# Lint
npm run lint
npm run lint:fix

# Format
npm run format
npm run format:check
```

## Publishing

```bash
npm publish --access public
```

## Frameworks

### Official MCP SDK (default)

Uses the official `@modelcontextprotocol/sdk` package with Express.js for full control.

### FastMCP

Uses [FastMCP](https://github.com/punkpeye/fastmcp), a TypeScript framework built on top of the official SDK that provides a simpler, more intuitive API.

## Templates

### SDK Templates

#### sdk/stateless

A stateless streamable HTTP MCP server using the official SDK. Each request creates a new transport and server instance.

Features:
- Express.js with `StreamableHTTPServerTransport`
- No session management (new transport per request)
- Example prompt (`greeting-template`)
- Example tool (`start-notification-stream`)
- Example resource (`greeting-resource`)
- TypeScript configuration
- Environment variable support for PORT

#### sdk/stateful

A stateful streamable HTTP MCP server with session management using the official SDK.

Features:
- Session tracking via `mcp-session-id` header
- Transport reuse across requests within a session
- SSE stream support (GET /mcp)
- Session termination (DELETE /mcp)
- Same example prompt, tool, and resource as stateless
- Graceful shutdown with transport cleanup
- **Optional OAuth authentication** (enabled via CLI prompt)

##### OAuth Option

When OAuth is enabled for the stateful template:
- Generates `src/auth.ts` with JWKS/JWT-based OAuth middleware
- Uses any OIDC-compliant provider (Auth0, Keycloak, Azure AD, Okta, etc.)
- Environment variables: `OAUTH_ISSUER_URL`, `OAUTH_AUDIENCE` (optional)
- Token verification via JWKS (fetches public keys from `{issuer}/.well-known/jwks.json`)
- Protected resource metadata endpoint at `/.well-known/oauth-protected-resource`
- Server startup validation ensures OAuth provider is reachable
- See [docs/oauth-setup.md](docs/oauth-setup.md) for provider-specific setup instructions

### FastMCP Templates

A single template that supports both stateless and stateful modes via the `stateless` configuration option. Uses the FastMCP framework for simpler server setup.

Features:
- Declarative tool/prompt/resource registration
- Built-in HTTP server (no Express setup required)
- Supports both stateless and stateful modes via config
- Example prompt, tool, and resource

Generated project structure (same for all templates, +auth.ts when OAuth enabled for SDK stateful):
```
{project-name}/
├── src/
│   ├── server.ts     # MCP server with tools/prompts/resources
│   ├── index.ts      # Server startup configuration
│   └── auth.ts       # OAuth middleware (SDK stateful + OAuth only)
├── Dockerfile        # Multi-stage Docker build
├── .dockerignore     # Docker ignore file
├── package.json
├── tsconfig.json
├── .gitignore
├── .env.example
└── README.md
```

## Deployment

All generated projects include deployment configuration by default:

### Dockerfile

Multi-stage build for production:
- Uses Node 20 Alpine as base image
- Builds TypeScript in builder stage
- Copies only production dependencies and dist to final image
- Exposes port 3000

### Health Check Endpoint

All templates include a `GET /health` endpoint:
- SDK templates: Express route added in `index.ts`
- FastMCP: Built-in health check support (enabled by default with httpStream transport)
