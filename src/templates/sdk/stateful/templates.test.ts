import { describe, it, expect } from 'vitest';
import { getServerTemplate, getIndexTemplate, getReadmeTemplate } from './index.js';
import {
  getIndexTemplate as getStatelessIndexTemplate,
  getReadmeTemplate as getStatelessReadmeTemplate,
} from '../stateless/index.js';

describe('sdk/stateful templates', () => {
  const projectName = 'test-project';

  // Pins the re-export: shared behaviour is covered by the stateless suite.
  describe('convergence with the stateless template', () => {
    it('should produce the same index template as stateless', () => {
      expect(getIndexTemplate()).toBe(getStatelessIndexTemplate());
    });

    it('should produce the same index template as stateless with OAuth', () => {
      expect(getIndexTemplate({ withOAuth: true })).toBe(
        getStatelessIndexTemplate({ withOAuth: true })
      );
    });

    it('should produce the same readme as stateless', () => {
      expect(getReadmeTemplate(projectName)).toBe(getStatelessReadmeTemplate(projectName));
    });
  });

  describe('getServerTemplate', () => {
    it('should include project name in server config', () => {
      const template = getServerTemplate(projectName);
      expect(template).toContain(`name: '${projectName}'`);
    });

    it('should use SDK v2 imports', () => {
      const template = getServerTemplate(projectName);
      expect(template).toContain("from '@modelcontextprotocol/server'");
      expect(template).not.toContain('@modelcontextprotocol/sdk');
    });

    it('should include example prompt, tool and resource', () => {
      const template = getServerTemplate(projectName);
      expect(template).toContain('greeting-template');
      expect(template).toContain('registerPrompt');
      expect(template).toContain('greet');
      expect(template).toContain('registerTool');
      expect(template).toContain('greeting-resource');
      expect(template).toContain('registerResource');
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

    it('should mount the /mcp endpoint with app.all', () => {
      const template = getIndexTemplate();
      expect(template).toContain("app.all('/mcp'");
    });

    it('should use PORT from environment variable', () => {
      const template = getIndexTemplate();
      expect(template).toContain('process.env.PORT');
    });

    it('should not carry over v1 session machinery', () => {
      const template = getIndexTemplate();
      expect(template).not.toContain('sessionIdGenerator');
      expect(template).not.toContain('isInitializeRequest');
      expect(template).not.toContain('randomUUID');
      expect(template).not.toContain('mcp-session-id');
      expect(template).not.toContain('const transports');
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

    it('should not document removed session management', () => {
      const template = getReadmeTemplate(projectName);
      expect(template).not.toContain('mcp-session-id');
      expect(template).not.toContain('DELETE /mcp');
      expect(template).not.toContain('SSE');
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
