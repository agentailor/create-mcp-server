import type { TemplateOptions } from './index.js';

export function getReadmeTemplate(projectName: string, options?: TemplateOptions): string {
  const packageManager = options?.packageManager ?? 'npm';
  const stateless = options?.stateless ?? false;
  const transport = options?.transport ?? 'http';

  const commands: Record<
    string,
    {
      install: string;
      dev: string;
      build: string;
      start: string;
      inspect: string;
      inspectTools: string;
      inspectPrompts: string;
      inspectResources: string;
    }
  > = {
    npm: {
      install: 'npm install',
      dev: 'npm run dev',
      build: 'npm run build',
      start: 'npm start',
      inspect: 'npm run inspect',
      inspectTools: 'npm run inspect:tools',
      inspectPrompts: 'npm run inspect:prompts',
      inspectResources: 'npm run inspect:resources',
    },
    pnpm: {
      install: 'pnpm install',
      dev: 'pnpm dev',
      build: 'pnpm build',
      start: 'pnpm start',
      inspect: 'pnpm inspect',
      inspectTools: 'pnpm inspect:tools',
      inspectPrompts: 'pnpm inspect:prompts',
      inspectResources: 'pnpm inspect:resources',
    },
    yarn: {
      install: 'yarn',
      dev: 'yarn dev',
      build: 'yarn build',
      start: 'yarn start',
      inspect: 'yarn inspect',
      inspectTools: 'yarn inspect:tools',
      inspectPrompts: 'yarn inspect:prompts',
      inspectResources: 'yarn inspect:resources',
    },
  };

  const cmd = commands[packageManager];

  if (transport === 'stdio') {
    return `# ${projectName}

A stdio MCP server built with FastMCP.

## About

This project was created with [@agentailor/create-mcp-server](https://www.npmjs.com/package/@agentailor/create-mcp-server) using [FastMCP](https://github.com/punkpeye/fastmcp).

## Getting Started

\`\`\`bash
# Install dependencies
${cmd.install}

# Build and run
${cmd.dev}

# Or build and start separately
${cmd.build}
${cmd.start}
\`\`\`

## Testing with MCP Inspector

This project includes [MCP Inspector](https://github.com/modelcontextprotocol/inspector) as a dev dependency. Build the project first (\`${cmd.build}\`), then use the inspect scripts:

\`\`\`bash
# List tools
${cmd.inspectTools}

# List prompts
${cmd.inspectPrompts}

# List resources
${cmd.inspectResources}
\`\`\`

You can also call tools directly:

\`\`\`bash
# Call a tool
npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/call --tool-name start-notification-stream --tool-arg interval=100 --tool-arg count=5

# Call a tool with JSON arguments
npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/call --tool-name start-notification-stream --tool-arg 'options={"interval": 100, "count": 5}'
\`\`\`

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
│   ├── server.ts     # FastMCP server definition (tools, prompts, resources)
│   └── index.ts      # Server startup configuration
├── package.json
├── tsconfig.json
└── README.md
\`\`\`

## Customization

- Add new tools, prompts, and resources in \`src/server.ts\`
- Modify transport configuration in \`src/index.ts\`

## Learn More

- [FastMCP](https://github.com/punkpeye/fastmcp) - The framework powering this server
- [Model Context Protocol](https://modelcontextprotocol.io/)
`;
  }

  const modeDescription = stateless
    ? 'A stateless streamable HTTP MCP server built with FastMCP.'
    : 'A stateful streamable HTTP MCP server built with FastMCP.';

  return `# ${projectName}

${modeDescription}

## About

This project was created with [@agentailor/create-mcp-server](https://www.npmjs.com/package/@agentailor/create-mcp-server) using [FastMCP](https://github.com/punkpeye/fastmcp).

## Getting Started

\`\`\`bash
# Install dependencies
${cmd.install}

# Build and run in development
${cmd.dev}

# Or build and start separately
${cmd.build}
${cmd.start}
\`\`\`

The server will start on port 3000 by default. You can change this by setting the \`PORT\` environment variable.

## Testing with MCP Inspector

This project includes [MCP Inspector](https://github.com/modelcontextprotocol/inspector) as a dev dependency for testing and debugging.

First, start the server in one terminal:

\`\`\`bash
${cmd.dev}
\`\`\`

Then, in another terminal, launch the inspector:

\`\`\`bash
${cmd.inspect}
\`\`\`

## API Endpoints

- **POST /mcp** - Main MCP endpoint for JSON-RPC messages
- **GET /health** - Health check endpoint (returns 200 OK)

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
│   ├── server.ts     # FastMCP server definition (tools, prompts, resources)
│   └── index.ts      # Server startup configuration
├── Dockerfile        # Multi-stage Docker build
├── package.json
├── tsconfig.json
└── README.md
\`\`\`

## Deployment

### Docker

Build and run the Docker container:

\`\`\`bash
docker build -t ${projectName} .
docker run -p 3000:3000 ${projectName}
\`\`\`
## Customization

- Add new tools, prompts, and resources in \`src/server.ts\`
- Modify transport configuration in \`src/index.ts\`

## Learn More

- [FastMCP](https://github.com/punkpeye/fastmcp) - The framework powering this server
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
`;
}
