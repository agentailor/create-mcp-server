import { describe, it, expect, beforeEach } from 'vitest';
import * as notes from './notes-store.js';

const OWNER = 'user-a';

// The store has no MCP imports, so these run without a server or a transport.
// Only two tests live here, and both exist because a tool contract depends on
// them - the rest of the store is ordinary code that needs no demonstration.

describe('notes-store', () => {
  beforeEach(() => {
    notes.seedForTests([]);
  });

  it('reports the full match count, not the size of the page', () => {
    // list_notes can only say "showing 5 of 30" because the store reports both.
    // A store that returned rows.length as the total would make every truncated
    // result look complete - the tool would lie without anything failing.
    for (let i = 0; i < 30; i++) {
      notes.create(OWNER, { title: 'note ' + i, body: '' });
    }

    const result = notes.list(OWNER, { limit: 5 });

    expect(result.rows).toHaveLength(5);
    expect(result.total).toBe(30);
  });

  it('distinguishes an unknown tag from a tag with no notes', () => {
    // Both would otherwise return an empty list, and the agent would report
    // "you have no notes" when the truth is "that tag does not exist".
    notes.create(OWNER, { title: 'tagged', body: '', tags: ['release'] });

    expect(() => notes.list(OWNER, { tag: 'nope', limit: 10 })).toThrow(notes.UnknownTagError);
    expect(notes.list(OWNER, { tag: 'release', limit: 10 }).total).toBe(1);
  });

  // example: added. The reason the example scopes notes by owner at all.
  it("keeps each owner's notes invisible to everyone else", () => {
    const mine = notes.create('alice', { title: 'mine', body: '', tags: ['private'] });

    expect(notes.list('bob', { limit: 10 }).total).toBe(0);
    expect(notes.get('bob', mine.id)).toBeUndefined();
    // Bob cannot even learn that Alice uses a tag.
    expect(() => notes.list('bob', { tag: 'private', limit: 10 })).toThrow(notes.UnknownTagError);
    expect(notes.get('alice', mine.id)?.title).toBe('mine');
  });
});
