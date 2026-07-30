export function getServerTemplate(projectName: string): string {
  return `import type {
  CallToolResult,
  GetPromptResult,
  ReadResourceResult,
} from '@modelcontextprotocol/server';
import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';

export function getServer() {
  // Create an MCP server with implementation details
  const server = new McpServer({
    name: '${projectName}',
    version: '1.0.0',
  });

  // Register a simple prompt
  server.registerPrompt(
    'greeting-template',
    {
      description: 'A simple greeting prompt template',
      argsSchema: z.object({
        name: z.string().describe('Name to include in greeting'),
      }),
    },
    async ({ name }): Promise<GetPromptResult> => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: \`Please greet \${name} in a friendly manner.\`,
            },
          },
        ],
      };
    }
  );

  server.registerTool(
    'greet',
    {
      description: 'Greet a user by name',
      inputSchema: z.object({
        name: z.string().describe('Name of the person to greet'),
      }),
    },
    async ({ name }): Promise<CallToolResult> => {
      return {
        content: [
          {
            type: 'text',
            text: \`Hello, \${name}!\`,
          },
        ],
      };
    }
  );

  // Create a simple resource at a fixed URI
  server.registerResource(
    'greeting-resource',
    'https://example.com/greetings/default',
    { mimeType: 'text/plain' },
    async (): Promise<ReadResourceResult> => {
      return {
        contents: [
          {
            uri: 'https://example.com/greetings/default',
            text: 'Hello, world!',
          },
        ],
      };
    }
  );

  return server;
}
`;
}
