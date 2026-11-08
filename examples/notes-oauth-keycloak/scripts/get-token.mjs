// example: added. Prints an access token for a demo user, for curl and scripts.
//
//   node scripts/get-token.mjs           # alice
//   node scripts/get-token.mjs bob
//
// Uses the password grant on the dev-only `mcp-dev-cli` client. Real MCP
// clients (VS Code, Cursor, the Inspector) use the browser-based authorization
// code flow instead; the password grant exists here only so scripts can get a
// token without a browser. Never enable it on a production client.
import { config } from 'dotenv';
import { pathToFileURL } from 'node:url';

config({ quiet: true });

export async function getToken(username = 'alice', password = username, scope = 'openid') {
  const issuer = (process.env.OAUTH_ISSUER_URL ?? '').replace(/\/$/, '');
  if (!issuer) throw new Error('OAUTH_ISSUER_URL is not set. Copy .env.example to .env.');

  const response = await fetch(`${issuer}/protocol/openid-connect/token`, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: 'mcp-dev-cli',
      username,
      password,
      scope,
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(`Token request failed (${response.status}): ${JSON.stringify(body)}`);
  }
  return body.access_token;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  getToken(process.argv[2]).then(
    (token) => console.log(token),
    (error) => {
      console.error(error.message);
      process.exit(1);
    }
  );
}
