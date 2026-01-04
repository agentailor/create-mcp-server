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
});
