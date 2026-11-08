// Domain logic, deliberately free of MCP imports.
//
// This module is imported once, so the notes live for the lifetime of the
// process. That matters: the MCP server factory runs once per request, so
// anything stored on the server instance would be discarded between calls and
// notes_create would never be visible to a later notes_list.
//
// Replace this with your own data layer. Keep the seam: tools stay thin, the
// logic stays testable without a transport.
//
// example: every function takes an `owner` (the signed-in user's id), and each
// owner only ever sees their own notes. The store does not know about OAuth;
// it just partitions by a string the tools hand it.

export interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
}

export interface ListResult {
  /** The page of notes, capped by `limit`. */
  rows: Note[];
  /** How many notes matched the filter in total, before the cap was applied. */
  total: number;
}

export class UnknownTagError extends Error {
  constructor(readonly tag: string) {
    super(`Unknown tag: ${tag}`);
    this.name = 'UnknownTagError';
  }
}

export const MAX_TITLE_LENGTH = 120;

const notesByOwner = new Map<string, Map<string, Note>>();

function notesOf(owner: string): Map<string, Note> {
  let notes = notesByOwner.get(owner);
  if (!notes) {
    notes = new Map();
    notesByOwner.set(owner, notes);
  }
  return notes;
}

let counter = 0;

function nextId(): string {
  counter += 1;
  return `note_${counter.toString(16).padStart(8, '0')}`;
}

/** Every tag currently in use, so callers can tell a typo from an empty result. */
export function knownTags(owner: string): string[] {
  const tags = new Set<string>();
  for (const note of notesOf(owner).values()) {
    for (const tag of note.tags) tags.add(tag);
  }
  return [...tags].sort();
}

/**
 * Returns a page of notes plus the unfiltered match count.
 *
 * `total` is the number of matches, not the number returned - the caller needs
 * both to tell the agent honestly that a result was truncated.
 */
export function list(owner: string, options: { tag?: string; limit: number }): ListResult {
  const { tag, limit } = options;

  if (tag !== undefined && !knownTags(owner).includes(tag)) {
    throw new UnknownTagError(tag);
  }

  const matches = [...notesOf(owner).values()]
    .filter((note) => tag === undefined || note.tags.includes(tag))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { rows: matches.slice(0, limit), total: matches.length };
}

export function get(owner: string, id: string): Note | undefined {
  return notesOf(owner).get(id);
}

export function create(
  owner: string,
  input: { title: string; body: string; tags?: string[] }
): Note {
  const title = input.title.trim();

  if (title.length === 0) {
    throw new RangeError('title must not be empty');
  }
  if (title.length > MAX_TITLE_LENGTH) {
    throw new RangeError(`title must be ${MAX_TITLE_LENGTH} characters or fewer`);
  }

  const note: Note = {
    id: nextId(),
    title,
    body: input.body,
    tags: input.tags ?? [],
    createdAt: new Date().toISOString(),
  };

  notesOf(owner).set(note.id, note);
  return note;
}

/** Test helper: clears every owner's notes, then seeds one owner. */
export function seedForTests(seed: Note[], owner = 'local'): void {
  notesByOwner.clear();
  counter = 0;
  for (const note of seed) notesOf(owner).set(note.id, note);
}
