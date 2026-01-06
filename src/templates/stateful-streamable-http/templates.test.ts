import { describe, it, expect } from 'vitest';
import { getServerTemplate, getIndexTemplate, getReadmeTemplate } from './index.js';

describe('stateful-streamable-http templates', () => {
  const projectName = 'test-project';

  describe('getServerTemplate', () => {
    it('should include project name in server config', () => {
      const template = getServerTemplate(projectName);
      expect(template).toContain(`name: '${projectName}'`);
    });

    it('should use correct SDK imports', () => {
      const template = getServerTemplate(projectName);
      expect(template).toContain("from '@modelcontextprotocol/sdk/types.js'");
      expect(template).toContain("from '@modelcontextprotocol/sdk/server/mcp.js'");
    });

    it('should include example prompt', () => {
      const template = getServerTemplate(projectName);
      expect(template).toContain('greeting-template');
      expect(template).toContain('registerPrompt');
    });

    it('should include example tool', () => {
      const template = getServerTemplate(projectName);
      expect(template).toContain('start-notification-stream');
      expect(template).toContain('registerTool');
    });

    it('should include example resource', () => {
      const template = getServerTemplate(projectName);
      expect(template).toContain('greeting-resource');
      expect(template).toContain('registerResource');
    });
  });

  describe('getIndexTemplate', () => {
    it('should use correct SDK import for transport', () => {
      const template = getIndexTemplate();
      expect(template).toContain("from '@modelcontextprotocol/sdk/server/streamableHttp.js'");
    });

    it('should use createMcpExpressApp', () => {
      const template = getIndexTemplate();
      expect(template).toContain('createMcpExpressApp');
      expect(template).toContain('const app = createMcpExpressApp()');
    });

    it('should configure /mcp endpoint', () => {
      const template = getIndexTemplate();
      expect(template).toContain("app.post('/mcp'");
      expect(template).toContain("app.get('/mcp'");
      expect(template).toContain("app.delete('/mcp'");
    });

    it('should use PORT from environment variable', () => {
      const template = getIndexTemplate();
      expect(template).toContain('process.env.PORT || 3000');
    });

    // Stateful-specific tests
    it('should use session ID header', () => {
      const template = getIndexTemplate();
      expect(template).toContain('mcp-session-id');
    });

    it('should store transports by session ID', () => {
      const template = getIndexTemplate();
      expect(template).toContain('const transports');
      expect(template).toContain('transports[sessionId]');
    });

    it('should use isInitializeRequest for new sessions', () => {
      const template = getIndexTemplate();
      expect(template).toContain('isInitializeRequest');
    });

    it('should generate session IDs with randomUUID', () => {
      const template = getIndexTemplate();
      expect(template).toContain('randomUUID');
      expect(template).toContain('sessionIdGenerator');
    });

    it('should handle session cleanup on close', () => {
      const template = getIndexTemplate();
      expect(template).toContain('transport.onclose');
      expect(template).toContain('delete transports[sid]');
    });

    it('should close all transports on SIGINT', () => {
      const template = getIndexTemplate();
      expect(template).toContain("process.on('SIGINT'");
      expect(template).toContain('transports[sessionId].close()');
    });
  });

  describe('getReadmeTemplate', () => {
    it('should include project name', () => {
      const template = getReadmeTemplate(projectName);
      expect(template).toContain(`# ${projectName}`);
    });

    it('should include getting started instructions', () => {
      const template = getReadmeTemplate(projectName);
      expect(template).toContain('npm install');
      expect(template).toContain('npm run dev');
    });

    it('should document the /mcp endpoint', () => {
      const template = getReadmeTemplate(projectName);
      expect(template).toContain('/mcp');
    });

    // Stateful-specific documentation tests
    it('should document session management', () => {
      const template = getReadmeTemplate(projectName);
      expect(template).toContain('mcp-session-id');
      expect(template).toContain('Session');
    });

    it('should document SSE stream support', () => {
      const template = getReadmeTemplate(projectName);
      expect(template).toContain('GET /mcp');
      expect(template).toContain('SSE');
    });

    it('should document session termination', () => {
      const template = getReadmeTemplate(projectName);
      expect(template).toContain('DELETE /mcp');
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

    it('should apply auth middleware to routes when OAuth enabled', () => {
      const template = getIndexTemplate({ withOAuth: true });
      expect(template).toContain("app.post('/mcp', authMiddleware,");
      expect(template).toContain("app.get('/mcp', authMiddleware,");
      expect(template).toContain("app.delete('/mcp', authMiddleware,");
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
