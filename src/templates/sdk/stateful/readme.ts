import type { TemplateOptions } from './index.js';

export function getReadmeTemplate(projectName: string, options?: TemplateOptions): string {
  const withOAuth = options?.withOAuth ?? false;
  const packageManager = options?.packageManager ?? 'npm';

  const commands = {
    npm: { install: 'npm install', dev: 'npm run dev', build: 'npm run build', start: 'npm start' },
    pnpm: { install: 'pnpm install', dev: 'pnpm dev', build: 'pnpm build', start: 'pnpm start' },
    yarn: { install: 'yarn', dev: 'yarn dev', build: 'yarn build', start: 'yarn start' },
  }[packageManager];

  const description = withOAuth
    ? 'A stateful streamable HTTP MCP (Model Context Protocol) server with session management and OAuth authentication.'
    : 'A stateful streamable HTTP MCP (Model Context Protocol) server with session management.';

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
│   ├── index.ts      # Express app and stateful HTTP transport setup
│   └── auth.ts       # OAuth configuration and middleware
├── package.json
├── tsconfig.json
└── README.md
\`\`\``
    : `\`\`\`
${projectName}/
├── src/
│   ├── server.ts     # MCP server definition (tools, prompts, resources)
│   └── index.ts      # Express app and stateful HTTP transport setup
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

The server will start on port 3000 by default. You can change this by setting the \`PORT\` environment variable.
${oauthSection}
## API Endpoints

- **POST /mcp** - Main MCP endpoint for JSON-RPC messages
  - First request must be an initialization request (no session ID required)
  - Subsequent requests must include \`mcp-session-id\` header${apiEndpointsOAuthNote}
- **GET /mcp** - Server-Sent Events (SSE) stream for server-initiated messages
  - Requires \`mcp-session-id\` header${apiEndpointsOAuthNote}
- **DELETE /mcp** - Terminate a session
  - Requires \`mcp-session-id\` header${apiEndpointsOAuthNote}

## Session Management

This server maintains stateful sessions:

1. **Initialize**: Send a POST request without a session ID to start a new session
2. **Session ID**: The server returns an \`mcp-session-id\` header in the response
3. **Subsequent requests**: Include the session ID in the \`mcp-session-id\` header
4. **SSE Stream**: Use GET /mcp with your session ID to receive server-initiated messages
5. **Terminate**: Send DELETE /mcp with your session ID to end the session

## Included Examples

This server comes with example implementations to help you get started:

### Prompts

- **greeting-template** - A simple greeting prompt that takes a name parameter

### Tools

- **start-notification-stream** - Sends periodic notifications for testing. Parameters:
  - \`interval\`: Milliseconds between notifications (default: 100)
  - \`count\`: Number of notifications to send (default: 10, use 0 for unlimited)

### Resources

- **greeting-resource** - A simple text resource at \`https://example.com/greetings/default\`

## Project Structure

${projectStructure}

## Customization

- Add new tools, prompts, and resources in \`src/server.ts\`
- Modify the HTTP transport configuration in \`src/index.ts\`${customizationOAuthNote}

## Learn More

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
`;
}
