export function getPromptsTemplate(): string {
  return `import type { GetPromptResult, McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';

export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    'summarize-notes',
    {
      description: 'Summarize the notes carrying a given tag',
      argsSchema: z.object({
        tag: z.string().describe('Tag to summarize, e.g. "release"'),
      }),
    },
    async ({ tag }): Promise<GetPromptResult> => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text:
                \`Call list_notes with tag "\${tag}", then summarize those notes \` +
                'in a short paragraph. Mention how many there are.',
            },
          },
        ],
      };
    }
  );
}
`;
}
