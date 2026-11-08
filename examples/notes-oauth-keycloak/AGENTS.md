# notes-oauth-keycloak

Notes for anyone — human or coding agent — working on this project. The
[README](README.md) covers running it; this covers what is not obvious from the
code.

## Layout

- `src/server.ts` — creates the `McpServer` and registers the primitives. It
  should stay a composition root; definitions do not belong here.
- `src/tools.ts`, `src/prompts.ts`, `src/resources.ts` — one file per MCP
  primitive, each exporting a `register*(server)` function.
- Your data layer — the shipped example keeps this in its own module with **no
  MCP imports**, so it can be tested without a server. Keep that seam.
- `src/index.ts` — Express app and HTTP handler wiring.
- `src/auth.ts` — OAuth middleware and token verification.

The project is generated with a small example so nothing starts empty. It is
meant to be replaced — delete it once your own tools exist. The guidance below
applies to whatever replaces it.

## State lives in the module, not the server

`createMcpHandler` runs the server factory **once per request**. A fresh
`McpServer` serves every call, so anything you store on the server instance is
discarded when the request ends.

This is the most common way to break this project. If you add state — a cache, a
connection pool, a counter — put it at module scope, in its own module. State
created inside `getServer()` will silently vanish between calls: a tool that
writes will appear to work, and a later read will return nothing.

## Writing a good tool

A tool is a contract with a non-deterministic caller. It cannot ask what you
meant, so the description and the payload have to carry everything.

When adding one:

- **Name it for the action, with its noun** — `list_invoices`, not a bare
  `list` and not `invoices_list`. Most MCP clients prepend the server name, so a
  hardcoded namespace becomes `notes-oauth-keycloak_invoices_list`; a bare verb collides
  with every other server's `list` on the clients that do not prefix.
- **Describe what it does, when to reach for it, and what it returns.** Include
  example queries — this text is prompt engineering, not documentation.
- **Document every parameter with a format, an example and its constraints.**
  `'Invoice id as returned by list_invoices. Example: "inv_4821"'` beats
  `id: string`.
- **Bound anything that returns a collection.** Give it a default limit, and when
  you truncate, *say so and say how to continue*. A silently capped list is a
  tool that lies: the caller cannot tell a complete answer from a partial one.
- **Return errors as `isError` with a next move**, not thrown exceptions and not
  bare codes. "No invoice has id X — call list_invoices to see the ids" is
  actionable; "not found" is not.
- **Do not let two different situations produce the same payload.** An unknown
  filter and a genuinely empty result must read differently, or the agent will
  confidently report "you have none" when the truth is "you misspelled it".
- **Return what the next call needs.** If a create returns the new id, the agent
  can chain straight into a read without a lookup.

### Organizing tools as they grow

The flat layout here suits a handful of tools. It is not meant to be permanent:

- **A few tools** — keep them in `src/tools.ts`, as now.
- **Enough that the file is hard to scan** — split into `src/tools/`, one file
  per tool, with an `index.ts` that re-exports a single `registerTools`. Do the
  same for prompts and resources when they earn it.
- **Several unrelated domains** — group by feature instead of by primitive:
  `src/invoices/{tools,resources,store}.ts`, `src/search/...`, each exposing its
  own register function that `server.ts` calls.

Whichever shape you land on, keep two things: `server.ts` stays a composition
root, and domain logic stays free of MCP imports so it remains testable on its
own.

## Adding a tool means adding a test

`npm test` runs two layers:

- Data-layer tests — your logic on its own, no server and no transport.
- `src/server.test.ts` — a real MCP client over an in-memory transport,
  asserting on the **payload a tool actually returns**.

A tool description is a contract with a caller that cannot read your code. If
nothing checks that contract, the implementation drifts and the agent keeps
believing the description. That is the failure these tests exist to prevent.

**One test per tool, in that spirit, is enough.** The existing tests are a worked
example, not a quota to match: each pins something a description promises and
nothing else verifies — that a truncated list says so, that an error names a next
step, that an unknown filter is distinguishable from an empty result. Do not add
tests that exercise your data structures; those teach nothing about the tool.

Assert on the parsed payload rather than on internal calls. It is the surface the
agent sees, and it survives refactoring underneath.

## The tool-design skill

`.agents/skills/tool-design/SKILL.md` is the long form of the guidance above,
with worked examples under `references/`. Read it before designing a tool
surface, not after.

It was copied in when this project was scaffolded, so it is the version that
shipped with the CLI you used — no network needed, and it will not change
underneath you. The skill does get updated upstream. To pull a newer copy when
you want one:

```bash
npx skills update -p -y
```

That is yours to run, not something this project does for you. If the directory
is missing entirely, add it with `npx skills add agentailor/skills --skill tool-design -a universal`.

Commit `.agents/` so everyone working on this project gets the same copy.

## OAuth: throw OAuthError, never a plain Error

`requireBearerAuth` maps only `OAuthError` to a `401` with a
`WWW-Authenticate` challenge. Any other thrown error becomes a `500` with no
challenge header, which leaves the client no signal that it should
re-authenticate — it just sees a broken server.

So every token rejection in `src/auth.ts` — bad signature, expired, wrong
issuer or audience — is converted into `OAuthError`. The one deliberate
exception is the missing-JWKS guard, which stays a plain `Error`: that is a
server misconfiguration and belongs in the 500 bucket.

`OAuthError` and `OAuthErrorCode` are **value** exports of
`@modelcontextprotocol/server`, so import them alongside the `import type`
line, not inside it.

## Conventions worth keeping

- This project uses the **MCP TypeScript SDK v2** split packages
  (`@modelcontextprotocol/server`, `/express`, `/node`). Do not add the v1
  `@modelcontextprotocol/sdk` monolith — it is a different package line.
- Schemas are **Standard Schema** objects: `inputSchema: z.object({ ... })`, not
  a raw shape. This needs zod ≥ 4.2; zod 3 fails silently on `tools/list`.
- A tool handler's second argument is `ctx` (`ctx.mcpReq.signal`,
  `ctx.http?.authInfo`), not the v1 `extra`.
- Logging, sampling and roots are deprecated in v2 — avoid `sendLoggingMessage`.

## Commands

```bash
npm run dev    # build and run
npm test       # run the tests
npm run build  # type-check and compile
```
