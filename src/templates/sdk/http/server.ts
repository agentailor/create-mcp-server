export function getServerTemplate(projectName: string): string {
  return `import { McpServer } from '@modelcontextprotocol/server';
import { registerTools } from './tools.js';
import { registerPrompts } from './prompts.js';
import { registerResources } from './resources.js';

/**
 * Builds the MCP server.
 *
 * Called once per request on HTTP, so keep this cheap and keep state out of it:
 * anything stored on the server instance is discarded when the request ends.
 * Durable state belongs at module scope, as in notes-store.ts.
 */
export function getServer() {
  const server = new McpServer({
    name: '${projectName}',
    version: '1.0.0',
  });

  registerTools(server);
  registerPrompts(server);
  registerResources(server);

  return server;
}
`;
}
