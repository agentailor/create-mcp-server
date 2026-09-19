# @agentailor/create-mcp-server

A CLI tool to scaffold new MCP (Model Context Protocol) server projects.

Working notes for anyone — human or coding agent — changing this repo. The [README](README.md) covers using the CLI; this file covers the invariants that are not obvious from the code.

## Project Structure

```
create-mcp-server/
├── src/
│   ├── index.ts                    # CLI entry point
│   ├── cli.ts                      # CLI argument parsing (Commander.js)
│   ├── cli.test.ts                 # Tests for CLI argument parsing
│   ├── skills.ts                   # Copies the vendored tool-design skill
│   ├── skills.test.ts              # Tests for the skill copy
│   ├── assets/                     # Non-TS files copied into dist/ at build
│   │   └── skills/tool-design/     # Vendored skill (verbatim from upstream)
│   ├── interactive.ts              # Interactive prompt flow (prompts library)
│   ├── project-generator.ts        # Shared project generation logic
│   └── templates/
│       ├── common/                 # Shared template files
│       │   ├── package.json.ts     # package.json template (framework-aware)
│       │   ├── tsconfig.json.ts    # tsconfig.json template
│       │   ├── gitignore.ts        # .gitignore template
│       │   ├── env.example.ts      # .env.example template
│       │   ├── agents.md.ts        # AGENTS.md template (per-variant guidance)
│       │   ├── agents.md.test.ts   # Tests for the AGENTS.md template
│       │   └── templates.test.ts   # Tests for common templates
│       ├── deployment/             # Deployment configuration templates
│       │   ├── dockerfile.ts       # Dockerfile template
│       │   ├── dockerignore.ts     # .dockerignore template
│       │   ├── index.ts            # Barrel exports
│       │   └── templates.test.ts   # Tests for deployment templates
│       ├── sdk/                    # Official MCP SDK v2 templates
│       │   ├── stateless/          # Shared SDK templates (source of truth)
│       │   │   ├── server.ts       # Composition root (registers the primitives)
│       │   │   ├── tools.ts        # Tool definitions template
│       │   │   ├── prompts.ts      # Prompt definitions template
│       │   │   ├── resources.ts    # Resource definitions template
│       │   │   ├── store.ts        # notes-store.ts template (no MCP imports)
│       │   │   ├── store-test.ts   # notes-store.test.ts template
│       │   │   ├── server-test.ts  # server.test.ts template
│       │   │   ├── index.ts        # getIndexTemplate (createMcpHandler + toNodeHandler)
│       │   │   ├── readme.ts       # README.md template (OAuth-aware)
│       │   │   └── templates.test.ts
│       │   ├── stateful/           # Compatibility shim - re-exports stateless
│       │   │   ├── server.ts       # Re-exports from stateless
│       │   │   ├── index.ts        # Re-exports getIndexTemplate from stateless
│       │   │   ├── readme.ts       # Re-exports from stateless
│       │   │   ├── auth.ts         # OAuth authentication template (owned here)
│       │   │   ├── auth.test.ts    # Tests for auth template
│       │   │   └── templates.test.ts
│       │   └── stdio/              # stdio transport template
│       │       ├── server.ts       # Re-exports from stateless
│       │       ├── index.ts        # Barrel export + getIndexTemplate (serveStdio)
│       │       ├── readme.ts       # README.md template (for local clients)
│       │       └── templates.test.ts
│       └── fastmcp/                # FastMCP templates
│           ├── server.ts           # FastMCP server definition template
│           ├── index.ts            # Barrel export + getIndexTemplate
│           ├── readme.ts           # README.md template
│           └── templates.test.ts
├── vitest.config.ts                # Scopes the test run; excludes generated/
├── dist/                           # Compiled output (generated)
├── docs/
│   └── oauth-setup.md              # OAuth setup guide for various providers
├── official-examples/              # Reference MCP server examples
├── package.json
├── tsconfig.json
└── README.md
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test locally (interactive mode)
node dist/index.js

# Test locally (CLI mode)
node dist/index.js --name=test-server
node dist/index.js --name=test-server --package-manager=pnpm --framework=fastmcp

# Run tests
npm test
npm run test:watch

# Lint
npm run lint
npm run lint:fix

# Format
npm run format
npm run format:check
```

## Template dependencies

Versions emitted into generated projects are hardcoded in `src/templates/common/package.json.ts` and refreshed by `npm run update-template-deps` (`scripts/update-template-deps.mjs`), which resolves `latest` for every entry in `TEMPLATE_PACKAGES`.

Things to know before editing that list:

- **`@modelcontextprotocol/sdk` is deliberately absent.** No template declares it any more — SDK templates use the split v2 packages, and FastMCP depends on it transitively rather than directly. Do not add it back, and never point it at `2.x`: the v2 packages are a different package line, and the v1 monolith's own `latest` is still `1.x`.
- **`hono` is required for SDK HTTP projects.** It is a peer dependency of `@modelcontextprotocol/node`, so the generated project must declare it explicitly even though no template code imports it.
- **Major bumps are flagged, not blocked.** The script tags any bump that crosses a major with `[MAJOR]` and repeats it in an end-of-run summary. Treat that as a required step, not a warning: generate each variant and run install + build before merging.
- **The script only matches versions written as `^X.Y.Z`.** An exactly-pinned version is invisible to it and will rot silently, so write new entries with the caret.

Generated projects are on **TypeScript 7** (the Go-native compiler); this repo stays on TypeScript 6 for now.

### dotenv

Generated projects use dotenv 18, which logs a summary line on load (`quiet` defaults to `false`). It writes to stderr, so it cannot corrupt the MCP protocol stream, but templates still call `config({ quiet: true })` explicitly rather than importing `dotenv/config`.

Two rules follow from that:

- **`auth.ts` loads the env itself.** ES imports are hoisted, so `auth.ts` is evaluated before `index.ts` runs `config()`. Without its own load, its module-scope `CONFIG` reads empty values and OAuth breaks silently. Keep the `config()` call above `CONFIG`.
- **The stdio template must never load dotenv.** stdout is the protocol channel there. A test asserts the emitted index contains no `dotenv`.

## Generated project tests

SDK projects ship a working test setup; FastMCP does not yet. Two layers, from
`src/templates/sdk/stateless/store-test.ts` and `server-test.ts`:

- **`notes-store.test.ts`** exercises the store with no MCP involved — fast, no transport.
- **`server.test.ts`** drives a real `Client` over `InMemoryTransport.createLinkedPair()` and asserts on the **parsed tool payload**, which is the surface an agent actually reads. A tool can be internally correct and still return something misleading.

**Keep the emitted suite small and exemplary.** It is a template people copy, so its size sets an expectation. Every test must pin something a tool's *description* promises and nothing else checks — truncation signalled, errors actionable, an unknown filter distinguishable from an empty result. Do not add tests that exercise the example's own data structures: a test that a `Map` stores things teaches nothing about tool design and inflates what a reader thinks is required. Nine tests is the current budget, and adding one should mean retiring one.

Notes for editing these:

- **No `vitest.config.ts` is emitted, and none is needed.** Vitest discovers `src/**/*.test.ts` and handles TypeScript out of the box.
- **`tsconfig.json` excludes `src/**/*.test.ts`.** Without it the tests compile into `dist/` and ship in the Docker production image. `getTsconfigTemplate({ withTests })` controls this; it is on for SDK projects only.
- **The emitted test code avoids template literals entirely**, using string concatenation instead. Nesting a template literal inside the template literal that generates it needs `\\\`` and `\\\${`, and getting that wrong emits a stray backslash that fails to parse. A test asserts no escaped template-literal syntax reaches the output.
- **`@modelcontextprotocol/client` must track `@modelcontextprotocol/server`'s major.** Both are in `TEMPLATE_PACKAGES`, but the update script cannot enforce the pairing — check it whenever a major is flagged.

## Generated AGENTS.md

`src/templates/common/agents.md.ts` writes an `AGENTS.md` into every generated
project. It is **not** a second README: the README says how to run the project,
this says what someone changing it will otherwise get wrong.

**It must stay example-agnostic.** The shipped notes example is meant to be
deleted once real tools exist, but `AGENTS.md` stays — so anything naming
`notes-store`, `list_notes` and friends rots the moment the example goes. The
guidance uses a neutral illustration (`list_invoices`) instead, and a test
asserts no example-specific name reaches the output.

It branches per variant, and the branching is the point:

- **HTTP** gets the per-request factory warning (state belongs at module scope).
- **stdio** gets the stdout rule instead, since the factory warning does not apply.
- **OAuth** adds the `OAuthError`-not-`Error` rule.
- **FastMCP** gets a trimmed version that says plainly it ships without tests,
  rather than leaving a silent gap.

SDK variants also carry the tool-design guidance and a section on organizing
tools as they grow — flat files, then `src/tools/` per tool, then feature
folders. The scaffold ships the flat layout because it suits a handful of tools;
the advice on outgrowing it belongs here rather than in a directory structure
the example has not earned.

Keep this file honest: if the templates change what they emit, this changes too.

## The tool-design skill

Generated projects get Agentailor's [tool-design](https://github.com/agentailor/skills)
skill at `.agents/skills/tool-design/`, unless `--no-skills` is passed.

**`.agents/`, not `.claude/`.** The ecosystem is converging on tool-agnostic
locations, the same way `AGENTS.md` replaced `CLAUDE.md`. Agents that only look
in `.claude/` today are expected to follow. The directory is a single constant,
`SKILLS_DIR` in `src/skills.ts`, so moving it again is a one-line change.

**It is vendored, not fetched.** The four markdown files live in
`src/assets/skills/tool-design/` and are copied verbatim into the project by
`src/skills.ts`. That keeps scaffolding offline and instant, and means a given
version of this CLI always emits a known version of the skill rather than
whatever upstream happens to be that day.

The trade is that the vendored copy ages. Generated projects are told so, and
given `npx skills update -p -y` to pull a newer one — their choice to run, not
something the scaffold does for them.

Two mechanics to know:

- **`tsc` does not copy markdown.** `npm run build` runs `scripts/copy-assets.mjs`
  after it, which mirrors `src/assets` into `dist/assets`. `files: ["dist"]`
  then carries them into the published package. If assets ever go missing from a
  release, that script is the first place to look.
- **The vendored files are excluded from formatting and normalisation.**
  `.gitattributes` marks `src/assets/**` as binary (`-text`) so checkout does not
  rewrite line endings, and `.prettierignore` excludes `src/assets/` so
  `format:check` does not try to reformat someone else's markdown. Both are
  required: without the second, CI fails on four files it should never touch. A
  test asserts the frontmatter survives.

### Refreshing the vendored skill

When the skill changes upstream, re-run the skills CLI into a scratch directory
and copy the result over `src/assets/skills/tool-design/`:

```bash
cd $(mktemp -d)
npx -y skills@latest add agentailor/skills --skill tool-design -a universal -y
cp -r .agents/skills/tool-design <repo>/src/assets/skills/
```

Then `git diff` to review what changed before committing. Two notes on that
command: `-a universal` is what writes to `.agents/` rather than a tool-specific
directory, and an unrecognised slug is rejected while the CLI still exits 0 and
writes nothing — so check the files landed rather than trusting the exit code.

`.agents/` is deliberately **not** in the generated `.gitignore`: the skill is
meant to be committed so the whole team gets the same copy.

## Publishing

```bash
npm publish --access public
```

## CLI Modes

The CLI supports two modes:

### Interactive Mode (default)
When run without arguments, prompts the user for all options:
```bash
npx @agentailor/create-mcp-server
```

### CLI Mode
When any `--arg` is provided, all options must be specified via arguments (or use defaults):
```bash
npx @agentailor/create-mcp-server --name=my-server [options]
```

**CLI Options:**
| Option | Short | Default | Values |
|--------|-------|---------|--------|
| `--name` | `-n` | (required) | alphanumeric, hyphens, underscores |
| `--package-manager` | `-p` | `npm` | npm, pnpm, yarn |
| `--framework` | `-f` | `sdk` | sdk, fastmcp |
| `--stdio` | — | `false` | flag; uses stdio transport instead of HTTP |
| `--template` | `-t` | `stateless` | stateless, stateful — accepted for compatibility; both produce the same SDK v2 project |
| `--oauth` | — | `false` | flag (sdk HTTP only, incompatible with --stdio) |
| `--no-git` | — | `false` | flag |
| `--no-skills` | — | `false` | flag; skips writing the tool-design skill |

## Frameworks

### Official MCP SDK (default) — v2

Uses the **MCP TypeScript SDK v2** split packages with Express.js for full control:

- `@modelcontextprotocol/server` — `McpServer`, `createMcpHandler`, types, OAuth types; `/stdio` subpath exports `serveStdio`
- `@modelcontextprotocol/express` — `createMcpExpressApp`, `requireBearerAuth`, `mcpAuthMetadataRouter`, `getOAuthProtectedResourceMetadataUrl`
- `@modelcontextprotocol/node` — `toNodeHandler` (peer-depends on `hono`, so generated HTTP projects declare `hono` explicitly)

Generated SDK projects serve protocol revision **`2026-07-28`** and also accept 2025-era clients.

Key v2 API notes:
- `registerTool`/`registerPrompt` take a **Standard Schema** (`inputSchema: z.object({...})`), not a raw shape. Requires zod ≥ 4.2.0 — zod 3.x fails silently on `tools/list`.
- Handler second argument is `ctx`, not `extra` (`ctx.mcpReq.signal`, `ctx.http?.authInfo`).
- Logging/sampling/roots are deprecated (SEP-2577); templates avoid `sendLoggingMessage`.
- Nothing in v2 puts `2026-07-28` on the wire by default — it is an explicit opt-in via `createMcpHandler` / `serveStdio`.

### FastMCP

Uses [FastMCP](https://github.com/punkpeye/fastmcp), a TypeScript framework built on top of the official SDK that provides a simpler, more intuitive API.

**FastMCP has not migrated to SDK v2** — it still depends on `@modelcontextprotocol/sdk` v1 internally, so FastMCP templates intentionally remain on v1 and speak the 2025-era protocol. Revisit when FastMCP ships v2 support.

## Templates

### SDK Templates

#### sdk/stateless — the shared HTTP template

A streamable HTTP MCP server using SDK v2. `createMcpHandler` runs the server factory once per request, so a fresh `McpServer` serves every call.

This directory holds the **shared** HTTP implementation: `server.ts`, `index.ts`, and `readme.ts` here are re-exported by `sdk/stateful`.

Features:
- Express.js via `createMcpExpressApp` + `toNodeHandler`
- Single `app.all('/mcp', ...)` route — the handler owns method dispatch
- Serves protocol `2026-07-28`; 2025-era clients handled via the default `legacy: 'stateless'`
- The notes example: `list_notes` / `get_note` / `create_note`, a `notes://{id}` resource template, and a `summarize-notes` prompt
- Health check at `GET /health`
- Environment variable support for PORT and ALLOWED_HOSTS
- **Optional OAuth authentication** (`withOAuth`)

#### sdk/stateful

Retained only for CLI compatibility. SDK v2 collapsed the stateless/stateful distinction, so this directory re-exports the stateless template's `server.ts`, `index.ts`, and `readme.ts` verbatim. It still owns `auth.ts` (the OAuth template).

If a session-based variant is ever needed again, it would be built on `NodeStreamableHTTPServerTransport` from `@modelcontextprotocol/node`.

##### Why stateless and stateful are identical

`createMcpHandler` runs the server factory **once per request**, so a fresh `McpServer` serves every call, and its default `legacy: 'stateless'` serves 2025-era clients through that same per-request path. There is no session state left for a "stateful" variant to hold, so both template types generate the same project.

Consequences to keep in mind when editing:

- `sdk/stateless/` is the source of truth for the HTTP templates. `sdk/stateful/` is a re-export shim — change behaviour in `stateless/`.
- `--template` no longer affects SDK output. It is still parsed so existing invocations keep working, and the interactive flow no longer prompts for it.
- OAuth is **orthogonal** to the template type. It applies to any SDK HTTP project and is keyed off `withOAuth`, never off `templateType`. `project-generator.ts` previously resolved `getAuthTemplate` through the template-type map; once both types converged that silently produced no `auth.ts`.

##### OAuth Option

OAuth is orthogonal to the template type and applies to any SDK HTTP project. When enabled:
- Generates `src/auth.ts` with JWKS/JWT-based OAuth middleware
- Uses any OIDC-compliant provider (Auth0, Keycloak, Azure AD, Okta, etc.)
- Environment variables: `OAUTH_ISSUER_URL`, `OAUTH_AUDIENCE` (optional)
- Token verification via JWKS (fetches public keys from `{issuer}/.well-known/jwks.json`)
- Protected resource metadata endpoint at `/.well-known/oauth-protected-resource`
- Server startup validation ensures OAuth provider is reachable
- `requireBearerAuth` attaches `AuthInfo` to `req.auth`; `toNodeHandler` forwards it to handlers as `ctx.http.authInfo`
- **The verifier must throw `OAuthError`, never a plain `Error`.** `requireBearerAuth` maps only `OAuthError` to a `401` + `WWW-Authenticate` challenge; anything else becomes a `500 server_error` with no challenge header, leaving clients no signal to re-authenticate. `auth.ts` therefore converts every `jose` failure (bad signature, expired, wrong issuer/audience) into `new OAuthError(OAuthErrorCode.InvalidToken, ...)`. Note `OAuthError`/`OAuthErrorCode` are **value** exports of `@modelcontextprotocol/server` — import them alongside, not inside, the existing `import type` line.
- The 401 body is a fixed `'Token verification failed'` rather than the `jose` message, so callers can't probe *why* a token was rejected; the specific reason still goes to the server log. The `!JWKS` guard stays a plain `Error` on purpose — that is a server misconfiguration and belongs in the 500 bucket.
- See [docs/oauth-setup.md](docs/oauth-setup.md) for provider-specific setup instructions

#### sdk/stdio

A stdio MCP server using SDK v2. Uses `serveStdio` — for local clients like Claude Desktop.

Features:
- `serveStdio(() => getServer())` from `@modelcontextprotocol/server/stdio` (no HTTP server, no Express)
- Pins one server instance per connection; negotiates protocol era from the opening exchange
- Same example tools, prompt, and resource as the shared HTTP template
- No PORT/ALLOWED_HOSTS environment variables
- No Dockerfile generated (stdio servers are run directly)
- MCP Inspector CLI mode (`mcp-inspector --cli node dist/index.js`)
- stdout is reserved for the MCP protocol — log to stderr only

### FastMCP Templates

A single template that supports both stateless and stateful HTTP modes via the `stateless` configuration option, plus stdio transport. Uses the FastMCP framework for simpler server setup.

Features:
- Declarative tool/prompt/resource registration
- Built-in HTTP server (no Express setup required) or stdio transport
- Supports stateless/stateful HTTP modes and stdio via config
- Example prompt, tool, and resource

Generated project structure for HTTP templates (+auth.ts when OAuth enabled for SDK):
```
{project-name}/
├── src/
│   ├── server.ts             # Creates the McpServer, registers the primitives
│   ├── tools.ts              # Tool definitions            (SDK only)
│   ├── prompts.ts            # Prompt definitions          (SDK only)
│   ├── resources.ts          # Resource definitions        (SDK only)
│   ├── notes-store.ts        # Example data layer          (SDK only)
│   ├── notes-store.test.ts   # Store unit tests            (SDK only)
│   ├── server.test.ts        # Payload-level tests         (SDK only)
│   ├── index.ts              # Server startup configuration
│   └── auth.ts               # OAuth middleware (SDK HTTP + OAuth only)
├── Dockerfile        # Multi-stage Docker build
├── .dockerignore     # Docker ignore file
├── package.json
├── tsconfig.json
├── .gitignore
├── .env.example
├── AGENTS.md
└── README.md
```

Generated project structure for stdio templates (no Dockerfile):
```
{project-name}/
├── src/
│   ├── server.ts             # Creates the McpServer, registers the primitives
│   ├── tools.ts              # Tool definitions            (SDK only)
│   ├── prompts.ts            # Prompt definitions          (SDK only)
│   ├── resources.ts          # Resource definitions        (SDK only)
│   ├── notes-store.ts        # Example data layer          (SDK only)
│   ├── notes-store.test.ts   # Store unit tests            (SDK only)
│   ├── server.test.ts        # Payload-level tests         (SDK only)
│   └── index.ts              # stdio transport startup
├── package.json
├── tsconfig.json
├── .gitignore
├── .env.example
├── AGENTS.md
└── README.md
```

## Deployment

All generated projects include deployment configuration by default:

### Dockerfile

Multi-stage build for production:
- Uses Node 22 Alpine as base image
- Builds TypeScript in builder stage
- Copies only production dependencies and dist to final image
- Exposes port 3000

### Health Check Endpoint

All templates include a `GET /health` endpoint:
- SDK templates: Express route added in `index.ts`
- FastMCP: Built-in health check support (enabled by default with httpStream transport)
