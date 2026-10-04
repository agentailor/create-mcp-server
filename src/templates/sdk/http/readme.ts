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
      test: 'npm test',
    },
    pnpm: {
      install: 'pnpm install',
      dev: 'pnpm dev',
      build: 'pnpm build',
      start: 'pnpm start',
      inspect: 'pnpm inspect',
      test: 'pnpm test',
    },
    yarn: {
      install: 'yarn',
      dev: 'yarn dev',
      build: 'yarn build',
      start: 'yarn start',
      inspect: 'yarn inspect',
      test: 'yarn test',
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
│   ├── server.ts        # Creates the McpServer and registers the primitives
│   ├── tools.ts         # Tool definitions
│   ├── prompts.ts       # Prompt definitions
│   ├── resources.ts     # Resource definitions
│   ├── notes-store.ts   # Example data layer, no MCP imports
│   ├── index.ts         # Express app and MCP HTTP handler setup
│   └── auth.ts          # OAuth configuration and middleware
├── Dockerfile        # Multi-stage Docker build
├── package.json
├── tsconfig.json
└── README.md
\`\`\``
    : `\`\`\`
${projectName}/
├── src/
│   ├── server.ts        # Creates the McpServer and registers the primitives
│   ├── tools.ts         # Tool definitions
│   ├── prompts.ts       # Prompt definitions
│   ├── resources.ts     # Resource definitions
│   ├── notes-store.ts   # Example data layer, no MCP imports
│   └── index.ts         # Express app and MCP HTTP handler setup
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

A small notes server, included as a worked example of tools an agent can use
well. Notes are held in memory, so they last until the process restarts.

### Tools

- **list_notes** - List notes, newest first, optionally filtered by tag.
  - \`tag\` (optional): Only return notes carrying this tag
  - \`limit\` (optional): Maximum to return, 1-100, defaults to 20

  Returns the page plus \`matched\`, \`returned\` and \`truncated\`, so a capped
  result says so and suggests how to narrow it. An unknown tag is reported as
  an error listing the tags that do exist, rather than as an empty list.

- **get_note** - Read one note in full by its id.
  - \`id\`: Note id as returned by \`list_notes\` or \`create_note\`

- **create_note** - Save a note and return it, including its new id.
  - \`title\`: Non-empty, at most 120 characters
  - \`body\`: Plain text
  - \`tags\` (optional): Tags used to filter in \`list_notes\`

### Resources

- **notes://{id}** - A single note as JSON. Listing the resource enumerates
  the saved notes.

### Prompts

- **summarize-notes** - Summarize the notes carrying a given tag

## Tests

\`\`\`bash
${commands.test}
\`\`\`

Two layers: \`src/notes-store.test.ts\` covers the data layer on its own, and
\`src/server.test.ts\` drives a real MCP client over an in-memory transport and
asserts on the payload a tool actually returns.

These are a worked example, not a quota. Each one pins something a tool's
description promises but nothing else checks - that a truncated list says so,
that an error names a next step, that an unknown filter is distinguishable from
an empty result. When you add a tool, one test in that spirit is enough.

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

- Add tools in \`src/tools.ts\`, prompts in \`src/prompts.ts\`, resources in
  \`src/resources.ts\`. \`src/server.ts\` only wires them together.
- Replace the example's data layer in \`src/notes-store.ts\`. Keep it free of MCP
  imports so it stays testable on its own, and keep its state at module scope:
  the server factory runs once per request, so anything held on the server
  instance is discarded between calls.
- Modify the HTTP handler and Express configuration in \`src/index.ts\`${customizationOAuthNote}

## Tool design skill

Agentailor's [tool-design](https://github.com/agentailor/skills) skill is
included at \`.agents/skills/tool-design/\`, so a coding agent working here has
the guidance on hand. Commit it so the whole team gets the same copy.

It is the version that shipped with the scaffolding CLI. To check for a newer
one — your call, not automatic:

\`\`\`bash
npx skills update -p -y
\`\`\`

## Learn More

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK v2](https://ts.sdk.modelcontextprotocol.io/v2/)
`;
}
