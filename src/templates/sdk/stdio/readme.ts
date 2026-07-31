import type { TemplateOptions } from './index.js';

export function getReadmeTemplate(projectName: string, options?: TemplateOptions): string {
  const packageManager = options?.packageManager ?? 'npm';

  const commands = {
    npm: {
      install: 'npm install',
      dev: 'npm run dev',
      build: 'npm run build',
      start: 'npm start',
      inspectTools: 'npm run inspect:tools',
      inspectPrompts: 'npm run inspect:prompts',
      inspectResources: 'npm run inspect:resources',
    },
    pnpm: {
      install: 'pnpm install',
      dev: 'pnpm dev',
      build: 'pnpm build',
      start: 'pnpm start',
      inspectTools: 'pnpm inspect:tools',
      inspectPrompts: 'pnpm inspect:prompts',
      inspectResources: 'pnpm inspect:resources',
    },
    yarn: {
      install: 'yarn',
      dev: 'yarn dev',
      build: 'yarn build',
      start: 'yarn start',
      inspectTools: 'yarn inspect:tools',
      inspectPrompts: 'yarn inspect:prompts',
      inspectResources: 'yarn inspect:resources',
    },
  }[packageManager];

  return `# ${projectName}

A stdio MCP (Model Context Protocol) server using the official MCP TypeScript SDK v2.

## About

This project was created with [@agentailor/create-mcp-server](https://www.npmjs.com/package/@agentailor/create-mcp-server).

The server uses \`serveStdio\`, which pins one server instance per connection and negotiates the protocol era from the opening exchange. It serves MCP protocol revision **2026-07-28** and also accepts 2025-era clients.

Note: stdout is reserved for the MCP protocol, so all logging must go to stderr.

## Getting Started

\`\`\`bash
# Install dependencies
${commands.install}

# Build and run
${commands.dev}

# Or build and start separately
${commands.build}
${commands.start}
\`\`\`

## Testing with MCP Inspector

This project includes [MCP Inspector](https://github.com/modelcontextprotocol/inspector) as a dev dependency. Build the project first (\`${commands.build}\`), then use the inspect scripts:

\`\`\`bash
# List tools
${commands.inspectTools}

# List prompts
${commands.inspectPrompts}

# List resources
${commands.inspectResources}
\`\`\`

You can also call tools directly:

\`\`\`bash
# Call a tool
npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/call --tool-name greet --tool-arg name=World
\`\`\`

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

\`\`\`
${projectName}/
├── src/
│   ├── server.ts     # MCP server definition (tools, prompts, resources)
│   └── index.ts      # stdio transport startup
├── package.json
├── tsconfig.json
└── README.md
\`\`\`

## Customization

- Add new tools, prompts, and resources in \`src/server.ts\`
- Modify transport configuration in \`src/index.ts\`

## Learn More

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK v2](https://ts.sdk.modelcontextprotocol.io/v2/)
`;
}
