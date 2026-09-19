import type { CommonTemplateOptions } from './types.js';
import { SKILLS_UPDATE_COMMAND, SKILLS_INSTALL_HINT, SKILLS_DIR } from '../../skills.js';

/**
 * AGENTS.md for the generated project.
 *
 * Deliberately not a second README. The README explains how to run the server;
 * this explains the things that are not obvious from reading the code, and that
 * someone changing it will otherwise get wrong.
 */
export function getAgentsMdTemplate(projectName: string, options?: CommonTemplateOptions): string {
  const framework = options?.framework ?? 'sdk';
  const transport = options?.transport ?? 'http';
  const withOAuth = options?.withOAuth ?? false;
  const packageManager = options?.packageManager ?? 'npm';

  const isSdk = framework === 'sdk';
  const isStdio = transport === 'stdio';

  const run = {
    npm: { build: 'npm run build', test: 'npm test', dev: 'npm run dev' },
    pnpm: { build: 'pnpm build', test: 'pnpm test', dev: 'pnpm dev' },
    yarn: { build: 'yarn build', test: 'yarn test', dev: 'yarn dev' },
  }[packageManager];

  const layout = isSdk
    ? `- \`src/server.ts\` — creates the \`McpServer\` and registers the primitives. It
  should stay a composition root; definitions do not belong here.
- \`src/tools.ts\`, \`src/prompts.ts\`, \`src/resources.ts\` — one file per MCP
  primitive, each exporting a \`register*(server)\` function.
- Your data layer — the shipped example keeps this in its own module with **no
  MCP imports**, so it can be tested without a server. Keep that seam.
- \`src/index.ts\` — ${isStdio ? 'stdio transport startup' : 'Express app and HTTP handler wiring'}.${
        withOAuth ? '\n- `src/auth.ts` — OAuth middleware and token verification.' : ''
      }

The project is generated with a small example so nothing starts empty. It is
meant to be replaced — delete it once your own tools exist. The guidance below
applies to whatever replaces it.`
    : `- \`src/server.ts\` — the FastMCP server and its tools, prompts and resources.
- \`src/index.ts\` — transport startup.

The project is generated with a small example so nothing starts empty. It is
meant to be replaced — delete it once your own tools exist.`;

  const perRequestSection =
    isSdk && !isStdio
      ? `
## State lives in the module, not the server

\`createMcpHandler\` runs the server factory **once per request**. A fresh
\`McpServer\` serves every call, so anything you store on the server instance is
discarded when the request ends.

This is the most common way to break this project. If you add state — a cache, a
connection pool, a counter — put it at module scope, in its own module. State
created inside \`getServer()\` will silently vanish between calls: a tool that
writes will appear to work, and a later read will return nothing.
`
      : '';

  const stdioSection = isStdio
    ? `
## stdout belongs to the protocol

This server speaks MCP over stdio, so **stdout carries JSON-RPC and nothing
else**. A stray \`console.log\`, a banner from a library, or a debug print will
corrupt the stream and the client will fail to parse it.

Log to \`console.error\` instead. The same rule is why this project does not load
\`dotenv\` — its startup summary is noise on a channel that has to stay clean.
`
    : '';

  const oauthSection = withOAuth
    ? `
## OAuth: throw OAuthError, never a plain Error

\`requireBearerAuth\` maps only \`OAuthError\` to a \`401\` with a
\`WWW-Authenticate\` challenge. Any other thrown error becomes a \`500\` with no
challenge header, which leaves the client no signal that it should
re-authenticate — it just sees a broken server.

So every token rejection in \`src/auth.ts\` — bad signature, expired, wrong
issuer or audience — is converted into \`OAuthError\`. The one deliberate
exception is the missing-JWKS guard, which stays a plain \`Error\`: that is a
server misconfiguration and belongs in the 500 bucket.

\`OAuthError\` and \`OAuthErrorCode\` are **value** exports of
\`@modelcontextprotocol/server\`, so import them alongside the \`import type\`
line, not inside it.
`
    : '';

  const testingSection = isSdk
    ? `
## Adding a tool means adding a test

\`${run.test}\` runs two layers:

- Data-layer tests — your logic on its own, no server and no transport.
- \`src/server.test.ts\` — a real MCP client over an in-memory transport,
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
`
    : `
## Testing

This project ships without a test setup. If you add one, assert on the **payload
a tool returns** rather than on internal function calls — that is the surface an
agent reads, and a tool can be internally correct while returning something
misleading.
`;

  const toolDesignSection = isSdk
    ? `
## Writing a good tool

A tool is a contract with a non-deterministic caller. It cannot ask what you
meant, so the description and the payload have to carry everything.

When adding one:

- **Name it for the action, with its noun** — \`list_invoices\`, not a bare
  \`list\` and not \`invoices_list\`. Most MCP clients prepend the server name, so a
  hardcoded namespace becomes \`${projectName}_invoices_list\`; a bare verb collides
  with every other server's \`list\` on the clients that do not prefix.
- **Describe what it does, when to reach for it, and what it returns.** Include
  example queries — this text is prompt engineering, not documentation.
- **Document every parameter with a format, an example and its constraints.**
  \`'Invoice id as returned by list_invoices. Example: "inv_4821"'\` beats
  \`id: string\`.
- **Bound anything that returns a collection.** Give it a default limit, and when
  you truncate, *say so and say how to continue*. A silently capped list is a
  tool that lies: the caller cannot tell a complete answer from a partial one.
- **Return errors as \`isError\` with a next move**, not thrown exceptions and not
  bare codes. "No invoice has id X — call list_invoices to see the ids" is
  actionable; "not found" is not.
- **Do not let two different situations produce the same payload.** An unknown
  filter and a genuinely empty result must read differently, or the agent will
  confidently report "you have none" when the truth is "you misspelled it".
- **Return what the next call needs.** If a create returns the new id, the agent
  can chain straight into a read without a lookup.

### Organizing tools as they grow

The flat layout here suits a handful of tools. It is not meant to be permanent:

- **A few tools** — keep them in \`src/tools.ts\`, as now.
- **Enough that the file is hard to scan** — split into \`src/tools/\`, one file
  per tool, with an \`index.ts\` that re-exports a single \`registerTools\`. Do the
  same for prompts and resources when they earn it.
- **Several unrelated domains** — group by feature instead of by primitive:
  \`src/invoices/{tools,resources,store}.ts\`, \`src/search/...\`, each exposing its
  own register function that \`server.ts\` calls.

Whichever shape you land on, keep two things: \`server.ts\` stays a composition
root, and domain logic stays free of MCP imports so it remains testable on its
own.
`
    : '';

  const skillSection = `
## The tool-design skill

\`${SKILLS_DIR}/skills/tool-design/SKILL.md\` is the long form of the guidance above,
with worked examples under \`references/\`. Read it before designing a tool
surface, not after.

It was copied in when this project was scaffolded, so it is the version that
shipped with the CLI you used — no network needed, and it will not change
underneath you. The skill does get updated upstream. To pull a newer copy when
you want one:

\`\`\`bash
${SKILLS_UPDATE_COMMAND}
\`\`\`

That is yours to run, not something this project does for you. If the directory
is missing entirely, add it with \`${SKILLS_INSTALL_HINT}\`.

Commit \`${SKILLS_DIR}/\` so everyone working on this project gets the same copy.
`;

  const conventions = isSdk
    ? `
## Conventions worth keeping

- This project uses the **MCP TypeScript SDK v2** split packages
  (\`@modelcontextprotocol/server\`, \`/express\`, \`/node\`). Do not add the v1
  \`@modelcontextprotocol/sdk\` monolith — it is a different package line.
- Schemas are **Standard Schema** objects: \`inputSchema: z.object({ ... })\`, not
  a raw shape. This needs zod ≥ 4.2; zod 3 fails silently on \`tools/list\`.
- A tool handler's second argument is \`ctx\` (\`ctx.mcpReq.signal\`,
  \`ctx.http?.authInfo\`), not the v1 \`extra\`.
- Logging, sampling and roots are deprecated in v2 — avoid \`sendLoggingMessage\`.
`
    : '';

  const commands: Array<[string, string]> = [
    [run.dev, 'build and run'],
    ...(isSdk ? ([[run.test, 'run the tests']] as Array<[string, string]>) : []),
    [run.build, 'type-check and compile'],
  ];
  const commandWidth = Math.max(...commands.map(([cmd]) => cmd.length));
  const commandLines = commands
    .map(([cmd, note]) => `${cmd.padEnd(commandWidth)}  # ${note}`)
    .join('\n');

  return `# ${projectName}

Notes for anyone — human or coding agent — working on this project. The
[README](README.md) covers running it; this covers what is not obvious from the
code.

## Layout

${layout}
${perRequestSection}${stdioSection}${toolDesignSection}${testingSection}${skillSection}${oauthSection}${conventions}
## Commands

\`\`\`bash
${commandLines}
\`\`\`
`;
}
