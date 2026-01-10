export function getServerTemplate(projectName: string): string {
  return `import type { CallToolResult, GetPromptResult, ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function getServer() {
  // Create an MCP server with implementation details
  const server = new McpServer(
    {
      name: '${projectName}',
      version: '1.0.0',
    },
    { capabilities: { logging: {} } }
  );

  // Register a simple prompt
  server.registerPrompt(
    'greeting-template',
    {
      description: 'A simple greeting prompt template',
      argsSchema: {
        name: z.string().describe('Name to include in greeting'),
      },
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

  // Register a tool for testing resumability
  server.registerTool(
    'start-notification-stream',
    {
      description: 'Starts sending periodic notifications for testing resumability',
      inputSchema: {
        interval: z
          .number()
          .describe('Interval in milliseconds between notifications')
          .default(100),
        count: z.number().describe('Number of notifications to send (0 for 100)').default(10),
      },
    },
    async ({ interval, count }, extra): Promise<CallToolResult> => {
      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      let counter = 0;

      while (count === 0 || counter < count) {
        counter++;
        try {
          await server.sendLoggingMessage(
            {
              level: 'info',
              data: \`Periodic notification #\${counter} at \${new Date().toISOString()}\`,
            },
            extra.sessionId
          );
        } catch (error) {
          console.error('Error sending notification:', error);
        }
        // Wait for the specified interval
        await sleep(interval);
      }

      return {
        content: [
          {
            type: 'text',
            text: \`Started sending periodic notifications every \${interval}ms\`,
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
