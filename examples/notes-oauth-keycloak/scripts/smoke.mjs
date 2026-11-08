// example: added. End-to-end check against a running Keycloak and server:
//
//   docker compose up -d --wait && npm run build && npm start   # in one terminal
//   npm run smoke                                               # in another
//
// Exits non-zero on the first failed check.
import { config } from 'dotenv';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { getToken } from './get-token.mjs';

config({ quiet: true });

const SERVER = process.env.MCP_SERVER_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
const ISSUER = (process.env.OAUTH_ISSUER_URL ?? '').replace(/\/$/, '');

function check(condition, message) {
  if (!condition) {
    console.error(`FAIL  ${message}`);
    process.exit(1);
  }
  console.log(`ok    ${message}`);
}

async function connectAs(username) {
  const token = await getToken(username);
  const client = new Client({ name: 'smoke', version: '1.0.0' });
  await client.connect(
    new StreamableHTTPClientTransport(new URL(`${SERVER}/mcp`), {
      requestInit: { headers: { Authorization: `Bearer ${token}` } },
    })
  );
  return client;
}

async function call(client, name, args = {}) {
  const result = await client.callTool({ name, arguments: args });
  return JSON.parse(result.content[0].text);
}

// 1. The server advertises Keycloak as its authorization server.
const metadata = await fetch(`${SERVER}/.well-known/oauth-protected-resource`).then((r) =>
  r.json()
);
check(
  metadata.authorization_servers?.includes(ISSUER),
  `metadata points at ${ISSUER}`
);

// 2. No token: 401 with a challenge that tells the client where to sign in.
const anonymous = await fetch(`${SERVER}/mcp`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
});
check(anonymous.status === 401, 'request without a token is rejected with 401');
check(
  anonymous.headers.get('www-authenticate')?.includes('resource_metadata='),
  'the 401 carries a WWW-Authenticate challenge with resource_metadata'
);

// 3. A forged token is also a 401, not a 500.
const forged = await fetch(`${SERVER}/mcp`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
    Authorization: 'Bearer aaa.bbb.ccc',
  },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
});
check(forged.status === 401, 'a forged token is rejected with 401');

// 4. Users can get offline (refresh) tokens, which the Inspector and other
// clients request. mcp-dev-cli has full scope disabled, like self-registered
// clients, so this fails if the user lacks the offline_access role or the
// offline_access scope is not mapped to it.
try {
  await getToken('alice', 'alice', 'openid offline_access');
  check(true, 'a demo user can get an offline token');
} catch (error) {
  check(false, `a demo user can get an offline token (${error.message})`);
}

// 5. Alice's identity reaches the tools.
const alice = await connectAs('alice');
const me = await call(alice, 'whoami');
check(me.user === 'alice', 'whoami reports alice');
check(me.scopes.includes('mcp:tools'), 'the token carries the mcp:tools scope');

const note = await call(alice, 'create_note', { title: 'Smoke test', body: 'from alice' });
const aliceNotes = await call(alice, 'list_notes');
check(
  aliceNotes.notes.some((n) => n.id === note.id),
  'alice sees the note she created'
);

// 6. Bob cannot see or read it.
const bob = await connectAs('bob');
const bobNotes = await call(bob, 'list_notes');
check(!bobNotes.notes.some((n) => n.id === note.id), "bob's list does not include alice's note");
const peek = await bob.callTool({ name: 'get_note', arguments: { id: note.id } });
check(peek.isError === true, "bob cannot read alice's note by id");

await Promise.all([alice.close(), bob.close()]);
console.log('\nAll checks passed.');
