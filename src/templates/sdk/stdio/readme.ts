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
      test: 'npm test',
    },
    pnpm: {
      install: 'pnpm install',
      dev: 'pnpm dev',
      build: 'pnpm build',
      start: 'pnpm start',
      inspectTools: 'pnpm inspect:tools',
      inspectPrompts: 'pnpm inspect:prompts',
      inspectResources: 'pnpm inspect:resources',
      test: 'pnpm test',
    },
    yarn: {
      install: 'yarn',
      dev: 'yarn dev',
      build: 'yarn build',
      start: 'yarn start',
      inspectTools: 'yarn inspect:tools',
      inspectPrompts: 'yarn inspect:prompts',
      inspectResources: 'yarn inspect:resources',
      test: 'yarn test',
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
npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/call --tool-name create_note --tool-arg title="Ship v2" --tool-arg body="Draft the checklist"
\`\`\`

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

\`\`\`
${projectName}/
├── src/
│   ├── server.ts        # Creates the McpServer and registers the primitives
│   ├── tools.ts         # Tool definitions
│   ├── prompts.ts       # Prompt definitions
│   ├── resources.ts     # Resource definitions
│   ├── notes-store.ts   # Example data layer, no MCP imports
│   └── index.ts         # stdio transport startup
├── package.json
├── tsconfig.json
└── README.md
\`\`\`

## Customization

- Add tools in \`src/tools.ts\`, prompts in \`src/prompts.ts\`, resources in
  \`src/resources.ts\`. \`src/server.ts\` only wires them together.
- Replace the example's data layer in \`src/notes-store.ts\`. Keep it free of MCP
  imports so it stays testable on its own.
- Modify transport configuration in \`src/index.ts\`

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
