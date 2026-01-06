# @agentailor/create-mcp-server

A CLI tool to scaffold new MCP (Model Context Protocol) server projects.

## Project Structure

```
create-mcp-server/
├── src/
│   ├── index.ts                    # CLI entry point
│   └── templates/
│       ├── common/                 # Shared template files
│       │   ├── package.json.ts     # package.json template
│       │   ├── tsconfig.json.ts    # tsconfig.json template
│       │   ├── gitignore.ts        # .gitignore template
│       │   ├── env.example.ts      # .env.example template
│       │   └── templates.test.ts   # Tests for common templates
│       ├── streamable-http/        # Stateless streamable HTTP template
│       │   ├── server.ts           # MCP server definition template
│       │   ├── index.ts            # Barrel export + getIndexTemplate
│       │   ├── readme.ts           # README.md template
│       │   └── templates.test.ts   # Tests for stateless template
│       └── stateful-streamable-http/  # Stateful streamable HTTP template
│           ├── server.ts           # Re-exports from streamable-http
│           ├── index.ts            # Barrel export + getIndexTemplate
│           ├── readme.ts           # README.md template
│           ├── auth.ts             # OAuth authentication template
│           └── templates.test.ts   # Tests for stateful template
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

## Templates

### streamable-http (stateless, default)

A stateless streamable HTTP MCP server. Each request creates a new transport and server instance.

Features:
- Express.js with `StreamableHTTPServerTransport`
- No session management (new transport per request)
- Example prompt (`greeting-template`)
- Example tool (`start-notification-stream`)
- Example resource (`greeting-resource`)
- TypeScript configuration
- Environment variable support for PORT

### stateful-streamable-http

A stateful streamable HTTP MCP server with session management.

Features:
- Session tracking via `mcp-session-id` header
- Transport reuse across requests within a session
- SSE stream support (GET /mcp)
- Session termination (DELETE /mcp)
- Same example prompt, tool, and resource as stateless
- Graceful shutdown with transport cleanup
- **Optional OAuth authentication** (enabled via CLI prompt)

#### OAuth Option

When OAuth is enabled for the stateful template:
- Generates `src/auth.ts` with JWKS/JWT-based OAuth middleware
- Uses any OIDC-compliant provider (Auth0, Keycloak, Azure AD, Okta, etc.)
- Environment variables: `OAUTH_ISSUER_URL`, `OAUTH_AUDIENCE` (optional)
- Token verification via JWKS (fetches public keys from `{issuer}/.well-known/jwks.json`)
- Protected resource metadata endpoint at `/.well-known/oauth-protected-resource`
- Server startup validation ensures OAuth provider is reachable
- See [docs/oauth-setup.md](docs/oauth-setup.md) for provider-specific setup instructions

Generated project structure (same for both templates, +auth.ts when OAuth enabled):
```
{project-name}/
├── src/
│   ├── server.ts     # MCP server with tools/prompts/resources
│   ├── index.ts      # Express app and transport setup
│   └── auth.ts       # OAuth middleware (only when OAuth enabled)
├── package.json
├── tsconfig.json
├── .gitignore
├── .env.example
└── README.md
```

## Future Enhancements

- Git initialization option
