export function getReadmeTemplate(projectName: string): string {
  return `# ${projectName}

A stateless streamable HTTP MCP (Model Context Protocol) server.

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

## API Endpoint

- **POST /mcp** - Main MCP endpoint for JSON-RPC messages

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
│   └── index.ts      # Express app and HTTP transport setup
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
