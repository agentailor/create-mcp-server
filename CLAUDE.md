# @agentailor/create-mcp-server

A CLI tool to scaffold new MCP (Model Context Protocol) server projects.

## Project Structure

```
create-mcp-server/
├── src/
│   └── index.ts          # CLI entry point
├── dist/                  # Compiled output (generated)
├── official-examples/      # Reference MCP server examples
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

## Future Enhancements

- Template selection (stateless/stateful MCP server)
- Full TypeScript project scaffolding
- Example tool/prompt/resource generation
- Git initialization option
