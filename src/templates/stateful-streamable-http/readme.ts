export function getReadmeTemplate(projectName: string): string {
  return `# ${projectName}

A stateful streamable HTTP MCP (Model Context Protocol) server with session management.

## About

This project was created with [@agentailor/create-mcp-server](https://www.npmjs.com/package/@agentailor/create-mcp-server).

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Build and run in development
npm run dev

# Or build and start separately
npm run build
npm start
\`\`\`

The server will start on port 3000 by default. You can change this by setting the \`PORT\` environment variable.

## API Endpoints

- **POST /mcp** - Main MCP endpoint for JSON-RPC messages
  - First request must be an initialization request (no session ID required)
  - Subsequent requests must include \`mcp-session-id\` header
- **GET /mcp** - Server-Sent Events (SSE) stream for server-initiated messages
  - Requires \`mcp-session-id\` header
- **DELETE /mcp** - Terminate a session
  - Requires \`mcp-session-id\` header

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

\`\`\`
${projectName}/
├── src/
│   ├── server.ts     # MCP server definition (tools, prompts, resources)
│   └── index.ts      # Express app and stateful HTTP transport setup
├── package.json
├── tsconfig.json
└── README.md
\`\`\`

## Customization

- Add new tools, prompts, and resources in \`src/server.ts\`
- Modify the HTTP transport configuration in \`src/index.ts\`

## Learn More

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
`;
}
