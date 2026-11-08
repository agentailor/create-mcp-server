# notes-oauth-keycloak

A notes MCP server protected by OAuth, with a local Keycloak that is already configured. Each signed-in user gets their own notes.

It starts as the plain output of `create-mcp-server --oauth`, plus a small set of changes listed in [What changed after scaffolding](#what-changed-after-scaffolding). Follow the steps below and you have a working OAuth-protected MCP server in a few minutes, with no Keycloak console clicks.

## What you need

- Node.js 22.19 or later
- Docker with Compose

## Run it

```bash
docker compose up -d --wait     # Keycloak on :8080, realm imported
cp .env.example .env
npm install
npm run dev                     # MCP server on :3000
```

Then, in a second terminal:

```bash
npm run smoke
```

`smoke` checks the whole chain: the server rejects missing and forged tokens with `401`, Alice's identity reaches the tools, and Bob cannot see Alice's notes. If it ends with `All checks passed.`, everything is wired up.

`docker compose down` throws Keycloak's state away. The next `up` imports the realm again from scratch.

## Demo accounts

| What           | Username | Password |
| -------------- | -------- | -------- |
| Demo user      | `alice`  | `alice`  |
| Demo user      | `bob`    | `bob`    |
| Keycloak admin | `admin`  | `admin`  |

The Keycloak admin console is at http://localhost:8080/admin. All of these exist for local development only.

## Connect a client

The server lives at `http://localhost:3000/mcp`. When you connect, the client finds Keycloak through the server's `401` response, opens a browser so you can sign in as `alice` or `bob`, and then calls the tools with that token. Ask it to run `whoami` to confirm who you are signed in as.

**MCP Inspector**

```bash
npm run inspect
```

The Inspector registers itself with Keycloak automatically (Dynamic Client Registration).

**VS Code** (`.vscode/mcp.json`)

```json
{
  "servers": {
    "notes": { "type": "http", "url": "http://localhost:3000/mcp" }
  }
}
```

**Cursor**

```json
{
  "mcpServers": {
    "notes": {
      "url": "http://localhost:3000/mcp",
      "auth": { "CLIENT_ID": "mcp-server-client", "scopes": ["mcp:tools"] }
    }
  }
}
```

`mcp-server-client` is a public client, so Cursor needs no secret.

**curl**

```bash
TOKEN=$(npm run --silent token)          # alice; use `npm run --silent token -- bob` for bob
curl -i -X POST http://localhost:3000/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## What is in the realm

[`keycloak/mcp-realm-realm.json`](keycloak/mcp-realm-realm.json) is imported on startup. It holds the configuration that the blog guide walks through in the Keycloak console:

| Item                       | Why it is there                                                                                                                                                                  |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Realm `mcp-realm`          | Issuer is `http://localhost:8080/realms/mcp-realm`.                                                                                                                              |
| Client scope `mcp:tools`   | A realm default scope with "Include in token scope" on. The server requires it (`requiredScopes` in `src/auth.ts`).                                                              |
| Client `mcp-server-client` | Public client with PKCE, for clients that use a preset client ID (such as Cursor). Its redirect URIs cover VS Code, Cursor and loopback.                                         |
| Client `mcp-dev-cli`       | Allows the password grant only. `npm run token` and `npm run smoke` use it to get a token without a browser. **Never put this on a real deployment.**                            |
| Trusted Hosts policy       | Lets clients register themselves (Dynamic Client Registration) from your machine. Includes `172.29.248.1`, the Docker network gateway; see the comment in `docker-compose.yml`. |
| Users `alice`, `bob`       | Two users, so you can see that notes are kept per user. Both are given `default-roles-mcp-realm` explicitly, because users imported from a file get no roles otherwise. |
| `offline_access` mapping   | Links the `offline_access` scope to the `offline_access` role. Self-registered clients (Inspector) have full scope disabled and ask for refresh tokens; without this link the token exchange fails with "Offline tokens not allowed". |

The file name has to be `<realm>-realm.json`, or Keycloak refuses to import it.

## What changed after scaffolding

The first commit that added this folder is the unmodified output of:

```bash
npx @agentailor/create-mcp-server@0.11.0 --name=notes-oauth-keycloak --oauth --no-git --no-skills
```

Each change made after that is marked in the code with an `// example:` comment:

| File                                                          | Change                                                                                                          |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `src/auth.ts`                                                 | Puts the token's `sub` and `preferred_username` into `AuthInfo.extra`, and requires the `mcp:tools` scope.      |
| `src/identity.ts` (new)                                       | `callerFrom(ctx)` reads `ctx.http.authInfo` and returns the caller. On stdio and in tests, the owner is `local`. |
| `src/notes-store.ts`                                          | Each function takes an `owner`, and notes are partitioned by it.                                                |
| `src/tools.ts`, `src/resources.ts`                            | Pass the caller's owner into the store. Adds a `whoami` tool.                                                   |
| `scripts/`, `docker-compose.yml`, `keycloak/`, `.env.example` | Local Keycloak, the token helper and the smoke test.                                                            |

### Why notes are keyed by `sub`, not `clientId`

`clientId` identifies the app (VS Code, Cursor), not the person using it. Two people signing in through VS Code get the same `clientId`, so keying by it would give them one shared set of notes. `sub` is the user's stable ID in Keycloak. That is why `auth.ts` has to forward it explicitly: the generated verifier only fills in `clientId` and `scopes`.

## Troubleshooting

- **Port 8080 is taken.** Run `KEYCLOAK_PORT=18080 docker compose up -d --wait`, and set `OAUTH_ISSUER_URL=http://localhost:18080/realms/mcp-realm` in `.env`. The issuer has to match the port exactly, because it is part of every token.
- **Port 3000 is taken.** Set `PORT` in `.env`. `npm run inspect` always connects to port 3000, so pass the URL to the Inspector yourself.
- **`403` / `Host not trusted` when a client registers itself.** Your Docker setup reaches Keycloak from a different address. Find it in `docker compose logs keycloak` (`Failed to verify remote host : <ip>`) and add it under Clients, Client registration, Trusted Hosts.
- **Keycloak shows "Client not found" instead of the sign-in page.** Restarting Keycloak (`docker compose down` / `up`) deletes every client that registered itself, but the MCP client still has the old client ID saved and keeps using it. The Inspector saves it on disk, not in the browser, so a private window does not help: delete `~/.mcp-inspector/storage/oauth.json` (it only holds the Inspector's saved sign-ins) and connect again. Other clients have their own equivalent, such as signing out of the server in VS Code.
- **`401` with a valid-looking token.** The reason is in the server log as `[auth] JWT verification failed: <reason>`. The most common cause is an issuer mismatch: the token was issued at a different URL (host or port) than `OAUTH_ISSUER_URL`.

## Not for production

This setup is tuned for running locally: Keycloak in dev mode with in-memory storage, HTTP everywhere, default admin credentials, a password-grant client, and notes kept in memory. Before deploying, use HTTPS, a persistent Keycloak database, a real data store keyed by `sub`, and an audience (`OAUTH_AUDIENCE`) so that tokens issued for other apps are rejected.

## Learn more

- [Securing MCP Servers: A Practical Guide with Keycloak](https://blog.agentailor.com/posts/oauth-for-mcp-servers-practical-guide-keycloak): the concepts, and the console steps this realm file replaces
- [Securing an MCP v2 Server with OAuth and Keycloak](https://blog.agentailor.com/posts/mcp-v2-oauth-keycloak): what changed in the v2 SDK
- [OAuth setup guide](../../docs/oauth-setup.md): how the generated `auth.ts` validates tokens
