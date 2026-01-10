export function getServerTemplate(projectName: string): string {
  return `import { FastMCP } from 'fastmcp';
import { z } from 'zod';

const server = new FastMCP({
  name: '${projectName}',
  version: '1.0.0',
});

// Register a simple prompt
server.addPrompt({
  name: 'greeting-template',
  description: 'A simple greeting prompt template',
  arguments: [
    {
      name: 'name',
      description: 'Name to include in greeting',
      required: true,
    },
  ],
  load: async ({ name }) => {
    return \`Please greet \${name} in a friendly manner.\`;
  },
});

// Register a tool for testing resumability
server.addTool({
  name: 'start-notification-stream',
  description: 'Starts sending periodic notifications for testing resumability',
  parameters: z.object({
    interval: z
      .number()
      .describe('Interval in milliseconds between notifications')
      .default(100),
    count: z.number().describe('Number of notifications to send (0 for 100)').default(10),
  }),
  execute: async ({ interval, count }) => {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    let counter = 0;

    while (count === 0 || counter < count) {
      counter++;
      console.log(\`Periodic notification #\${counter} at \${new Date().toISOString()}\`);
      await sleep(interval);
    }

    return \`Sent \${counter} periodic notifications every \${interval}ms\`;
  },
});

// Create a simple resource at a fixed URI
server.addResource({
  uri: 'https://example.com/greetings/default',
  name: 'greeting-resource',
  description: 'A simple greeting resource',
  mimeType: 'text/plain',
  load: async () => {
    return {
      text: 'Hello, world!',
    };
  },
});

export { server };
`;
}
