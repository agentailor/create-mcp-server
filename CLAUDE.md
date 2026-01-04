# @agentailor/create-mcp-server

A CLI tool to scaffold new MCP (Model Context Protocol) server projects.

## Project Structure

```
create-mcp-server/
├── src/
│   ├── index.ts                    # CLI entry point
│   └── templates/
│       └── streamable-http/        # Stateless streamable HTTP template
│           ├── server.ts           # MCP server definition template
│           ├── index.ts            # Entry point template
│           ├── package.json.ts     # package.json template
│           ├── tsconfig.json.ts    # tsconfig.json template
│           ├── gitignore.ts        # .gitignore template
│           ├── env.example.ts      # .env.example template
│           └── readme.ts           # README.md template
├── dist/                           # Compiled output (generated)
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

### streamable-http (default)

A stateless streamable HTTP MCP server based on the official example. Includes:

- Express.js with `StreamableHTTPServerTransport`
- Example prompt (`greeting-template`)
- Example tool (`start-notification-stream`)
- Example resource (`greeting-resource`)
- TypeScript configuration
- Environment variable support for PORT

Generated project structure:
```
{project-name}/
├── src/
│   ├── server.ts     # MCP server with tools/prompts/resources
│   └── index.ts      # Express app and transport setup
├── package.json
├── tsconfig.json
├── .gitignore
├── .env.example
└── README.md
```

## Future Enhancements

- Template selection (stateless/stateful MCP server)
- Git initialization option
- Additional templates (stdio, SSE)
