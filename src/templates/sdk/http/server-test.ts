export function getServerTestTemplate(): string {
  return `import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import { Client } from '@modelcontextprotocol/client';
import type { CallToolResult } from '@modelcontextprotocol/server';
import { getServer } from './server.js';
import * as notes from './notes-store.js';

// A worked example of testing a tool, not a target to match. Each test below
// pins something a tool's description promises but nothing else checks - that
// is the bar worth copying. Adding a tool is worth one such test; it does not
// oblige you to cover every branch of your own code here.
//
// The assertions run against the payload the tool returns, driven through a
// real client over an in-memory transport - no HTTP, no subprocess. That is
// the surface an agent reads, and a tool can be internally correct while still
// returning something misleading.

async function connect(): Promise<Client> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test', version: '1.0.0' });
  await Promise.all([getServer().connect(serverTransport), client.connect(clientTransport)]);
  return client;
}

/** Tools return JSON as text; parse it rather than asserting on the wrapper. */
function payload(result: CallToolResult): Record<string, any> {
  const [first] = result.content as Array<{ type: string; text: string }>;
  return JSON.parse(first.text);
}

function text(result: CallToolResult): string {
  const [first] = result.content as Array<{ type: string; text: string }>;
  return first.text;
}

describe('server', () => {
  let client: Client;

  beforeEach(async () => {
    notes.seedForTests([]);
    client = await connect();
  });

  // Generic on purpose: this keeps holding once you replace the notes example
  // with your own tools. An undescribed parameter is a common reason an agent
  // calls a tool wrongly.
  it('documents every tool and every parameter', async () => {
    const { tools } = await client.listTools();

    expect(tools.length).toBeGreaterThan(0);

    for (const tool of tools) {
      expect(tool.description, tool.name + ' has no description').toBeTruthy();

      const properties = (tool.inputSchema?.properties ?? {}) as Record<
        string,
        { description?: string }
      >;
      for (const [name, schema] of Object.entries(properties)) {
        expect(schema.description, tool.name + '.' + name + ' has no description').toBeTruthy();
      }
    }
  });

  it('says so when a result is truncated, and how to narrow it', async () => {
    // The headline contract: a capped list must not look complete.
    for (let i = 0; i < 30; i++) {
      await client.callTool({
        name: 'create_note',
        arguments: { title: 'note ' + i, body: '' },
      });
    }

    const result = payload(
      (await client.callTool({
        name: 'list_notes',
        arguments: { limit: 5 },
      })) as CallToolResult
    );

    expect(result.returned).toBe(5);
    expect(result.matched).toBe(30);
    expect(result.truncated).toBe(true);
    expect(result.hint).toContain('5 of 30');
  });

  it('does not claim truncation when everything fits', async () => {
    // The inverse case, so "truncated" means something rather than being
    // hardcoded true.
    await client.callTool({ name: 'create_note', arguments: { title: 'only', body: '' } });

    const result = payload(
      (await client.callTool({ name: 'list_notes', arguments: {} })) as CallToolResult
    );

    expect(result.truncated).toBe(false);
    expect(result.hint).toBeUndefined();
  });

  it('distinguishes an unknown tag from a tag with no notes', async () => {
    await client.callTool({
      name: 'create_note',
      arguments: { title: 'tagged', body: '', tags: ['release'] },
    });

    const unknown = (await client.callTool({
      name: 'list_notes',
      arguments: { tag: 'nope' },
    })) as CallToolResult;

    expect(unknown.isError).toBe(true);
    expect(text(unknown)).toContain('release');

    const known = payload(
      (await client.callTool({
        name: 'list_notes',
        arguments: { tag: 'release' },
      })) as CallToolResult
    );

    expect(known.matched).toBe(1);
  });

  it('returns an actionable error rather than throwing', async () => {
    const result = (await client.callTool({
      name: 'get_note',
      arguments: { id: 'note_zzzzzzzz' },
    })) as CallToolResult;

    expect(result.isError).toBe(true);
    // The message has to give the agent a next move, not just say "not found".
    expect(text(result)).toContain('list_notes');
  });

  it('returns an id the next call can use', async () => {
    // Chaining without a lookup only works if create hands back the id.
    const created = payload(
      (await client.callTool({
        name: 'create_note',
        arguments: { title: 'Ship v2', body: 'draft' },
      })) as CallToolResult
    );

    const read = payload(
      (await client.callTool({
        name: 'get_note',
        arguments: { id: created.id },
      })) as CallToolResult
    );

    expect(read.title).toBe('Ship v2');
  });

  it('lists the resources it can read', async () => {
    // A ResourceTemplate needs both halves wired up: list enumerates, and the
    // read callback resolves the same uri. Easy to get one without the other.
    const created = payload(
      (await client.callTool({
        name: 'create_note',
        arguments: { title: 'Ship v2', body: 'draft' },
      })) as CallToolResult
    );

    const uri = 'notes://' + created.id;

    const { resources } = await client.listResources();
    expect(resources.map((r) => r.uri)).toContain(uri);

    const read = await client.readResource({ uri });
    expect(JSON.parse(read.contents[0].text as string).title).toBe('Ship v2');
  });
});
`;
}
