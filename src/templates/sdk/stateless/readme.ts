import type { TemplateOptions } from './index.js';

/**
 * Shared README template, used by both SDK HTTP template types.
 * Varies only by `options.withOAuth`.
 */
export function getReadmeTemplate(projectName: string, options?: TemplateOptions): string {
  const withOAuth = options?.withOAuth ?? false;
  const packageManager = options?.packageManager ?? 'npm';

  const commands = {
    npm: {
      install: 'npm install',
      dev: 'npm run dev',
      build: 'npm run build',
      start: 'npm start',
      inspect: 'npm run inspect',
    },
    pnpm: {
      install: 'pnpm install',
      dev: 'pnpm dev',
      build: 'pnpm build',
      start: 'pnpm start',
      inspect: 'pnpm inspect',
    },
    yarn: {
      install: 'yarn',
      dev: 'yarn dev',
      build: 'yarn build',
      start: 'yarn start',
      inspect: 'yarn inspect',
    },
  }[packageManager];

  const description = withOAuth
    ? 'A streamable HTTP MCP (Model Context Protocol) server with OAuth authentication, built on the official MCP TypeScript SDK v2.'
    : 'A streamable HTTP MCP (Model Context Protocol) server built on the official MCP TypeScript SDK v2.';

  const oauthSection = withOAuth
    ? `
## OAuth Authentication

This server uses OAuth 2.0 with JWT tokens for authentication. It works with any OIDC-compliant provider including:
- Auth0
- Keycloak
- Azure AD / Entra ID
- Okta
- And more...

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| \`OAUTH_ISSUER_URL\` | Base URL of your OAuth provider | \`https://your-tenant.auth0.com\` |
| \`OAUTH_AUDIENCE\` | API identifier / audience claim (optional) | \`https://your-api.com\` |

### Provider-Specific Issuer URLs

| Provider | Issuer URL Format |
|----------|-------------------|
| Auth0 | \`https://{tenant}.auth0.com\` |
| Keycloak | \`http://{host}:{port}/realms/{realm}\` |
| Azure AD | \`https://login.microsoftonline.com/{tenant}/v2.0\` |
| Okta | \`https://{domain}.okta.com/oauth2/default\` |

### How It Works

1. The server fetches public keys from \`{OAUTH_ISSUER_URL}/.well-known/jwks.json\`
2. Incoming JWT tokens are verified locally using these keys
3. The token's \`iss\` (issuer) and optionally \`aud\` (audience) claims are validated
4. The validated token is attached to \`req.auth\` and surfaced to MCP handlers as \`ctx.http.authInfo\`

### Protected Resource Metadata

- **GET /.well-known/oauth-protected-resource** - OAuth protected resource metadata

### Token Requirements

- All MCP endpoints require a valid JWT Bearer token in the \`Authorization\` header
- Tokens must be signed by the configured OAuth provider
- If \`OAUTH_AUDIENCE\` is set, the token's \`aud\` claim must match
`
    : '';

  const apiEndpointsOAuthNote = withOAuth
    ? '\n  - Requires valid Bearer token in Authorization header'
    : '';

  const projectStructure = withOAuth
    ? `\`\`\`
${projectName}/
├── src/
│   ├── server.ts     # MCP server definition (tools, prompts, resources)
│   ├── index.ts      # Express app and MCP HTTP handler setup
│   └── auth.ts       # OAuth configuration and middleware
├── Dockerfile        # Multi-stage Docker build
├── package.json
├── tsconfig.json
└── README.md
\`\`\``
    : `\`\`\`
${projectName}/
├── src/
│   ├── server.ts     # MCP server definition (tools, prompts, resources)
│   └── index.ts      # Express app and MCP HTTP handler setup
├── Dockerfile        # Multi-stage Docker build
├── package.json
├── tsconfig.json
└── README.md
\`\`\``;

  const customizationOAuthNote = withOAuth
    ? '\n- Configure OAuth scopes and token verification in `src/auth.ts`'
    : '';

  return `# ${projectName}

${description}

## About

This project was created with [@agentailor/create-mcp-server](https://www.npmjs.com/package/@agentailor/create-mcp-server).

The server is built on \`createMcpHandler\`, which runs the server factory once per request — a fresh \`McpServer\` serves every call, so the server is stateless and scales horizontally without sticky sessions.

It serves MCP protocol revision **2026-07-28** and also accepts 2025-era clients through the same per-request path.

## Getting Started

\`\`\`bash
# Install dependencies
${commands.install}

# Build and run in development
${commands.dev}

# Or build and start separately
${commands.build}
${commands.start}
\`\`\`

The server will start on port 3000 by default. You can change this by setting the \`PORT\` environment variable. To allow additional hosts (e.g. when deploying behind a reverse proxy), set \`ALLOWED_HOSTS\` as a comma-separated list.

## Testing with MCP Inspector

This project includes [MCP Inspector](https://github.com/modelcontextprotocol/inspector) as a dev dependency for testing and debugging.

First, start the server in one terminal:

\`\`\`bash
${commands.dev}
\`\`\`

Then, in another terminal, launch the inspector:

\`\`\`bash
${commands.inspect}
\`\`\`
${oauthSection}
## API Endpoints

- **/mcp** - Main MCP endpoint. The SDK handler owns method dispatch, so the route is mounted with \`app.all\`.${apiEndpointsOAuthNote}
- **GET /health** - Health check endpoint (returns 200 OK)

## Included Examples

This server comes with example implementations to help you get started:

### Prompts

- **greeting-template** - A simple greeting prompt that takes a name parameter

### Tools

- **greet** - Greets a user by name. Parameters:
  - \`name\`: Name of the person to greet

### Resources

- **greeting-resource** - A simple text resource at \`https://example.com/greetings/default\`

## Project Structure

${projectStructure}

## Deployment

### Docker

Build and run the Docker container:

\`\`\`bash
docker build -t ${projectName} .
docker run -p 3000:3000 ${projectName}
\`\`\`

## Customization

- Add new tools, prompts, and resources in \`src/server.ts\`
- Modify the HTTP handler and Express configuration in \`src/index.ts\`${customizationOAuthNote}

## Learn More

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK v2](https://ts.sdk.modelcontextprotocol.io/v2/)
`;
}
