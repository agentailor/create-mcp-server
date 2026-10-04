export function getResourcesTemplate(): string {
  return `import type { McpServer, ReadResourceResult } from '@modelcontextprotocol/server';
import { ResourceTemplate } from '@modelcontextprotocol/server';
import * as notes from './notes-store.js';

const MAX_LISTED = 100;

export function registerResources(server: McpServer): void {
  server.registerResource(
    'note',
    // \`list\` is a required key on this options object, not an optional one -
    // omitting it fails to compile. Implementing it also lets clients enumerate
    // the notes instead of only reading one by id.
    new ResourceTemplate('notes://{id}', {
      list: async () => ({
        resources: notes.list({ limit: MAX_LISTED }).rows.map((note) => ({
          uri: \`notes://\${note.id}\`,
          name: note.title,
          mimeType: 'application/json',
        })),
      }),
    }),
    {
      title: 'Note',
      description: 'A single saved note, addressed by its id.',
      mimeType: 'application/json',
    },
    async (uri, variables): Promise<ReadResourceResult> => {
      const id = String(variables.id);
      const note = notes.get(id);

      if (!note) {
        throw new Error(\`No note has id "\${id}"\`);
      }

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(note, null, 2),
          },
        ],
      };
    }
  );
}
`;
}
