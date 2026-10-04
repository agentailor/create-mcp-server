import { describe, it, expect } from 'vitest';
import {
  getServerTemplate,
  getIndexTemplate,
  getReadmeTemplate,
  getStoreTemplate,
  getToolsTemplate,
  getPromptsTemplate,
  getResourcesTemplate,
  getStoreTestTemplate,
  getServerTestTemplate,
} from './index.js';

describe('sdk/http templates', () => {
  const projectName = 'test-project';

  describe('getServerTemplate', () => {
    it('should include project name in server config', () => {
      const template = getServerTemplate(projectName);
      expect(template).toContain(`name: '${projectName}'`);
    });

    it('should use SDK v2 imports', () => {
      const template = getServerTemplate(projectName);
      expect(template).toContain("from '@modelcontextprotocol/server'");
    });

    it('should not use v1 SDK import paths', () => {
      const template = getServerTemplate(projectName);
      expect(template).not.toContain('@modelcontextprotocol/sdk');
    });

    it('should compose the primitives rather than defining them inline', () => {
      const template = getServerTemplate(projectName);
      expect(template).toContain("import { registerTools } from './tools.js'");
      expect(template).toContain("import { registerPrompts } from './prompts.js'");
      expect(template).toContain("import { registerResources } from './resources.js'");
      expect(template).toContain('registerTools(server)');
      expect(template).toContain('registerPrompts(server)');
      expect(template).toContain('registerResources(server)');
    });

    it('should not register primitives directly', () => {
      const template = getServerTemplate(projectName);
      expect(template).not.toContain('server.registerTool(');
      expect(template).not.toContain('server.registerPrompt(');
      expect(template).not.toContain('server.registerResource(');
    });

    it('should not use the deprecated logging subsystem', () => {
      const template = getServerTemplate(projectName);
      expect(template).not.toContain('sendLoggingMessage');
      expect(template).not.toContain('capabilities: { logging: {} }');
    });
  });

  describe('getToolsTemplate', () => {
    it('should register the notes tools', () => {
      const template = getToolsTemplate();
      expect(template).toContain('registerTool');
      expect(template).toContain("'list_notes'");
      expect(template).toContain("'get_note'");
      expect(template).toContain("'create_note'");
    });

    // Most MCP clients prepend the server name, so a hardcoded prefix would
    // surface as "my-server_notes_list".
    it('should not hardcode a server namespace into tool names', () => {
      const template = getToolsTemplate();
      expect(template).not.toContain("'notes_list'");
      expect(template).not.toContain("'notes_get'");
      expect(template).not.toContain("'notes_create'");
    });

    it('should read its data from the store module', () => {
      const template = getToolsTemplate();
      expect(template).toContain("import * as notes from './notes-store.js'");
    });

    it('should declare schemas as Standard Schema via z.object', () => {
      const template = getToolsTemplate();
      expect(template).toContain('inputSchema: z.object(');
    });

    it('should signal truncation rather than silently capping', () => {
      const template = getToolsTemplate();
      expect(template).toContain('truncated');
      expect(template).toContain('matched');
      expect(template).toContain('hint');
      expect(template).toContain('DEFAULT_LIMIT');
    });

    it('should distinguish an unknown tag from a tag with no notes', () => {
      const template = getToolsTemplate();
      expect(template).toContain('UnknownTagError');
      expect(template).toContain('knownTags');
    });

    it('should return actionable errors as isError, not thrown exceptions', () => {
      const template = getToolsTemplate();
      expect(template).toContain('isError: true');
      expect(template).toContain('function toolError');
    });

    it('should point the agent at the sibling tool by its real name', () => {
      const template = getToolsTemplate();
      expect(template).toContain('Call list_notes');
    });
  });

  describe('getPromptsTemplate', () => {
    it('should register the example prompt', () => {
      const template = getPromptsTemplate();
      expect(template).toContain('registerPrompt');
      expect(template).toContain('summarize-notes');
      expect(template).toContain('argsSchema: z.object(');
    });

    it('should reference the tool by its unprefixed name', () => {
      const template = getPromptsTemplate();
      expect(template).toContain('list_notes');
      expect(template).not.toContain('notes_list');
    });
  });

  describe('getResourcesTemplate', () => {
    it('should register a resource template for a single note', () => {
      const template = getResourcesTemplate();
      expect(template).toContain('registerResource');
      expect(template).toContain("new ResourceTemplate('notes://{id}'");
    });

    // The v2 type declares `list` as required (not optional), so omitting it
    // fails tsc with TS2741 in the generated project.
    it('should pass list to ResourceTemplate', () => {
      const template = getResourcesTemplate();
      expect(template).toContain('list: async ()');
    });

    it('should read its data from the store module', () => {
      const template = getResourcesTemplate();
      expect(template).toContain("import * as notes from './notes-store.js'");
    });
  });

  describe('getIndexTemplate', () => {
    it('should use SDK v2 serving imports', () => {
      const template = getIndexTemplate();
      expect(template).toContain("import { createMcpHandler } from '@modelcontextprotocol/server'");
      expect(template).toContain(
        "import { createMcpExpressApp } from '@modelcontextprotocol/express'"
      );
      expect(template).toContain("import { toNodeHandler } from '@modelcontextprotocol/node'");
    });

    it('should not use v1 SDK import paths', () => {
      const template = getIndexTemplate();
      expect(template).not.toContain('@modelcontextprotocol/sdk');
    });

    it('should build the handler from a per-request server factory', () => {
      const template = getIndexTemplate();
      expect(template).toContain('createMcpHandler(() => getServer())');
      expect(template).toContain('toNodeHandler(handler)');
    });

    it('should use createMcpExpressApp', () => {
      const template = getIndexTemplate();
      expect(template).toContain('createMcpExpressApp');
      expect(template).toContain('const app = createMcpExpressApp({');
    });

    it('should mount the /mcp endpoint with app.all', () => {
      const template = getIndexTemplate();
      expect(template).toContain("app.all('/mcp'");
    });

    it('should include a health check endpoint', () => {
      const template = getIndexTemplate();
      expect(template).toContain("app.get('/health'");
    });

    it('should use PORT from environment variable', () => {
      const template = getIndexTemplate();
      expect(template).toContain('process.env.PORT');
    });

    it('should pass allowedHosts to createMcpExpressApp', () => {
      const template = getIndexTemplate();
      expect(template).toContain('allowedHosts');
      expect(template).toContain("ALLOWED_HOSTS?.split(',')");
    });

    it('should not carry over v1 session machinery', () => {
      const template = getIndexTemplate();
      expect(template).not.toContain('sessionIdGenerator');
      expect(template).not.toContain('isInitializeRequest');
      expect(template).not.toContain('randomUUID');
      expect(template).not.toContain('mcp-session-id');
    });
  });

  describe('getReadmeTemplate', () => {
    it('should include project name', () => {
      const template = getReadmeTemplate(projectName);
      expect(template).toContain(`# ${projectName}`);
    });

    it('should include getting started instructions with npm by default', () => {
      const template = getReadmeTemplate(projectName);
      expect(template).toContain('npm install');
      expect(template).toContain('npm run dev');
      expect(template).toContain('npm run build');
      expect(template).toContain('npm start');
    });

    it('should document the /mcp endpoint', () => {
      const template = getReadmeTemplate(projectName);
      expect(template).toContain('/mcp');
    });

    it('should describe stateless per-request behavior', () => {
      const template = getReadmeTemplate(projectName);
      expect(template).toContain('stateless');
      expect(template).toContain('createMcpHandler');
    });

    it('should document the served protocol revision', () => {
      const template = getReadmeTemplate(projectName);
      expect(template).toContain('2026-07-28');
    });
  });

  describe('getReadmeTemplate with package manager', () => {
    it('should use npm commands when packageManager is npm', () => {
      const template = getReadmeTemplate(projectName, { packageManager: 'npm' });
      expect(template).toContain('npm install');
      expect(template).toContain('npm run dev');
      expect(template).toContain('npm run build');
      expect(template).toContain('npm start');
    });

    it('should use pnpm commands when packageManager is pnpm', () => {
      const template = getReadmeTemplate(projectName, { packageManager: 'pnpm' });
      expect(template).toContain('pnpm install');
      expect(template).toContain('pnpm dev');
      expect(template).toContain('pnpm build');
      expect(template).toContain('pnpm start');
      expect(template).not.toContain('npm run');
    });

    it('should use yarn commands when packageManager is yarn', () => {
      const template = getReadmeTemplate(projectName, { packageManager: 'yarn' });
      expect(template).toContain('yarn\n');
      expect(template).toContain('yarn dev');
      expect(template).toContain('yarn build');
      expect(template).toContain('yarn start');
      expect(template).not.toContain('npm run');
    });
  });

  describe('getStoreTemplate', () => {
    it('should not import anything from the MCP SDK', () => {
      const template = getStoreTemplate();
      expect(template).not.toContain('@modelcontextprotocol');
    });

    it('should hold notes at module scope, not per call', () => {
      const template = getStoreTemplate();
      // The MCP server factory runs once per request; state kept on the server
      // would be discarded between calls.
      expect(template).toContain('const notes = new Map<string, Note>()');
    });

    it('should return the unfiltered total alongside the page', () => {
      const template = getStoreTemplate();
      // Callers need both to report truncation honestly.
      expect(template).toContain('rows: Note[]');
      expect(template).toContain('total: number');
      expect(template).toContain('total: matches.length');
    });

    it('should expose the tags in use so callers can detect a typo', () => {
      const template = getStoreTemplate();
      expect(template).toContain('export function knownTags()');
      expect(template).toContain('UnknownTagError');
    });

    it('should validate the title against a documented bound', () => {
      const template = getStoreTemplate();
      expect(template).toContain('MAX_TITLE_LENGTH');
      expect(template).toContain('RangeError');
    });

    it('should provide a seam for seeding in tests', () => {
      const template = getStoreTemplate();
      expect(template).toContain('export function seedForTests(');
    });
  });

  describe('generated test templates', () => {
    it('should exercise the store without a transport', () => {
      const template = getStoreTestTemplate();
      expect(template).toContain("import * as notes from './notes-store.js'");
      expect(template).not.toContain('@modelcontextprotocol/client');
      expect(template).not.toContain('InMemoryTransport');
    });

    it('should pin the store invariants the tools depend on', () => {
      const template = getStoreTestTemplate();
      expect(template).toContain('reports the full match count');
      expect(template).toContain('distinguishes an unknown tag from a tag with no notes');
      expect(template).toContain('seedForTests');
    });

    it('should drive the server through a real client', () => {
      const template = getServerTestTemplate();
      expect(template).toContain("import { Client } from '@modelcontextprotocol/client'");
      expect(template).toContain('InMemoryTransport.createLinkedPair()');
      expect(template).toContain("import { getServer } from './server.js'");
    });

    it('should assert on the parsed payload, not the result wrapper', () => {
      const template = getServerTestTemplate();
      expect(template).toContain('JSON.parse(first.text)');
      expect(template).toContain('result.truncated');
      expect(template).toContain('result.matched');
    });

    it('should cover the contracts that would otherwise fail silently', () => {
      const template = getServerTestTemplate();
      expect(template).toContain('says so when a result is truncated');
      expect(template).toContain('does not claim truncation when everything fits');
      expect(template).toContain('distinguishes an unknown tag from a tag with no notes');
      expect(template).toContain('documents every tool and every parameter');
    });

    // Emitted code with a stray backslash-backtick fails to parse, and the
    // template functions are the only place that can introduce one.
    it('should not emit escaped template-literal syntax', () => {
      const backslash = String.fromCharCode(92);
      for (const template of [getStoreTestTemplate(), getServerTestTemplate()]) {
        expect(template).not.toContain(backslash + '`');
        expect(template).not.toContain(backslash + '$');
      }
    });
  });

  describe('getIndexTemplate with OAuth', () => {
    it('should include auth imports when OAuth enabled', () => {
      const template = getIndexTemplate({ withOAuth: true });
      expect(template).toContain("from './auth.js'");
      expect(template).toContain('setupAuthMetadataRouter');
      expect(template).toContain('authMiddleware');
      expect(template).toContain('getOAuthMetadataUrl');
    });

    it('should import validateOAuthConfig when OAuth enabled', () => {
      const template = getIndexTemplate({ withOAuth: true });
      expect(template).toContain('validateOAuthConfig');
    });

    it('should setup auth metadata router when OAuth enabled', () => {
      const template = getIndexTemplate({ withOAuth: true });
      expect(template).toContain('setupAuthMetadataRouter(app)');
    });

    it('should apply auth middleware to the /mcp route when OAuth enabled', () => {
      const template = getIndexTemplate({ withOAuth: true });
      expect(template).toContain("app.all('/mcp', authMiddleware,");
    });

    it('should log OAuth metadata URL on startup when OAuth enabled', () => {
      const template = getIndexTemplate({ withOAuth: true });
      expect(template).toContain('getOAuthMetadataUrl()');
    });

    it('should call validateOAuthConfig before starting server when OAuth enabled', () => {
      const template = getIndexTemplate({ withOAuth: true });
      expect(template).toContain('await validateOAuthConfig()');
    });

    it('should wrap server startup in async main function when OAuth enabled', () => {
      const template = getIndexTemplate({ withOAuth: true });
      expect(template).toContain('async function main()');
      expect(template).toContain('main().catch');
    });

    it('should exit with error if OAuth validation fails', () => {
      const template = getIndexTemplate({ withOAuth: true });
      expect(template).toContain('Failed to start server');
      expect(template).toContain('process.exit(1)');
    });

    it('should NOT include auth imports when OAuth disabled', () => {
      const template = getIndexTemplate({ withOAuth: false });
      expect(template).not.toContain("from './auth.js'");
      expect(template).not.toContain('authMiddleware');
    });

    it('should NOT include auth imports by default', () => {
      const template = getIndexTemplate();
      expect(template).not.toContain("from './auth.js'");
    });

    it('should NOT wrap in async main when OAuth disabled', () => {
      const template = getIndexTemplate({ withOAuth: false });
      expect(template).not.toContain('async function main()');
    });
  });

  describe('getReadmeTemplate with OAuth', () => {
    it('should include OAuth section when enabled', () => {
      const template = getReadmeTemplate(projectName, { withOAuth: true });
      expect(template).toContain('## OAuth Authentication');
      expect(template).toContain('OAUTH_ISSUER_URL');
      expect(template).toContain('OAUTH_AUDIENCE');
      expect(template).toContain('Bearer token');
    });

    it('should list supported OAuth providers', () => {
      const template = getReadmeTemplate(projectName, { withOAuth: true });
      expect(template).toContain('Auth0');
      expect(template).toContain('Keycloak');
      expect(template).toContain('Azure AD');
      expect(template).toContain('Okta');
    });

    it('should document JWKS-based JWT validation', () => {
      const template = getReadmeTemplate(projectName, { withOAuth: true });
      expect(template).toContain('JWT');
      expect(template).toContain('.well-known/jwks.json');
    });

    it('should document where auth info surfaces to handlers', () => {
      const template = getReadmeTemplate(projectName, { withOAuth: true });
      expect(template).toContain('ctx.http.authInfo');
    });

    it('should include auth.ts in project structure when OAuth enabled', () => {
      const template = getReadmeTemplate(projectName, { withOAuth: true });
      expect(template).toContain('auth.ts');
    });

    it('should NOT include OAuth section when disabled', () => {
      const template = getReadmeTemplate(projectName, { withOAuth: false });
      expect(template).not.toContain('## OAuth Authentication');
    });

    it('should NOT include OAuth section by default', () => {
      const template = getReadmeTemplate(projectName);
      expect(template).not.toContain('## OAuth Authentication');
    });
  });
});
