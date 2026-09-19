export function getToolsTemplate(): string {
  return `import type { CallToolResult, McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import * as notes from './notes-store.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Names are action-oriented and carry their noun ("list_notes", not "list").
// Most MCP clients prepend the server name, so an extra "notes_" prefix here
// would surface as "my-server_notes_list". A bare verb would collide with every
// other server's "list" on the clients that do not prefix.

export function registerTools(server: McpServer): void {
  server.registerTool(
    'list_notes',
    {
      description:
        'List saved notes, newest first, optionally filtered by tag. Use this to ' +
        'find a note before reading or referencing it - for example "what notes do ' +
        'I have?" or "show me my notes tagged release". Returns a page of notes ' +
        'plus the total number that matched, so a truncated result is explicit.',
      inputSchema: z.object({
        tag: z
          .string()
          .optional()
          .describe(
            'Only return notes carrying this tag. Exact match, case-sensitive. ' +
              'Example: "release". Omit to list every note.'
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(MAX_LIMIT)
          .optional()
          .describe(
            \`Maximum notes to return. Integer between 1 and \${MAX_LIMIT}. \` +
              \`Defaults to \${DEFAULT_LIMIT}.\`
          ),
      }),
    },
    async ({ tag, limit }): Promise<CallToolResult> => {
      const effectiveLimit = limit ?? DEFAULT_LIMIT;

      let result;
      try {
        result = notes.list({ tag, limit: effectiveLimit });
      } catch (error) {
        if (error instanceof notes.UnknownTagError) {
          // An unknown tag and a tag with no notes both produce an empty list.
          // Saying which one happened stops the agent reporting "you have no
          // notes" when the truth is "that tag does not exist".
          const available = notes.knownTags();
          return toolError(
            \`No tag "\${error.tag}" exists, so no notes could match. \` +
              (available.length > 0
                ? \`Available tags: \${available.join(', ')}.\`
                : 'No notes carry tags yet.') +
              ' Call list_notes with no tag to see every note.'
          );
        }
        throw error;
      }

      const truncated = result.total > result.rows.length;

      return toolJson({
        notes: result.rows,
        returned: result.rows.length,
        matched: result.total,
        truncated,
        ...(truncated
          ? {
              hint:
                \`Showing \${result.rows.length} of \${result.total} matches. \` +
                'Narrow the result with a tag filter, or raise limit ' +
                \`(maximum \${MAX_LIMIT}).\`,
            }
          : {}),
      });
    }
  );

  server.registerTool(
    'get_note',
    {
      description:
        'Read one note in full by its id. Use this after list_notes has given ' +
        'you an id. Returns the note including its body and tags.',
      inputSchema: z.object({
        id: z
          .string()
          .describe(
            'Note id, exactly as returned by list_notes or create_note. ' +
              'Format: "note_" followed by 8 hex characters. Example: "note_0000000a".'
          ),
      }),
    },
    async ({ id }): Promise<CallToolResult> => {
      const note = notes.get(id);

      if (!note) {
        return toolError(
          \`No note has id "\${id}". Ids look like "note_0000000a". \` +
            'Call list_notes to see the available notes and their ids.'
        );
      }

      return toolJson(note);
    }
  );

  server.registerTool(
    'create_note',
    {
      description:
        'Save a new note and return it, including the id assigned to it. Use ' +
        'the returned id to read the note back with get_note - no lookup needed.',
      inputSchema: z.object({
        title: z
          .string()
          .describe(
            'Short title. Must be non-empty and at most ' +
              \`\${notes.MAX_TITLE_LENGTH} characters. Example: "Ship v2 checklist".\`
          ),
        body: z.string().describe('Note contents as plain text. May be empty.'),
        tags: z
          .array(z.string())
          .optional()
          .describe(
            'Tags used to filter in list_notes. Lowercase, no spaces. ' +
              'Example: ["release", "checklist"]. Defaults to no tags.'
          ),
      }),
    },
    async ({ title, body, tags }): Promise<CallToolResult> => {
      try {
        return toolJson(notes.create({ title, body, tags }));
      } catch (error) {
        if (error instanceof RangeError) {
          return toolError(
            \`Could not save the note: \${error.message}. \` +
              'Retry with a corrected title, for example "Ship v2 checklist".'
          );
        }
        throw error;
      }
    }
  );
}

/** Wraps a payload as the JSON text result an agent reads. */
function toolJson(payload: unknown): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
  };
}

/**
 * An error the agent is meant to act on: it says what went wrong and what to
 * try next. isError keeps it a normal result rather than a protocol failure,
 * so the agent can recover instead of giving up.
 */
function toolError(message: string): CallToolResult {
  return {
    isError: true,
    content: [{ type: 'text', text: message }],
  };
}
`;
}
