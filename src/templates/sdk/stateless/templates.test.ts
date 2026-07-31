import { describe, it, expect } from 'vitest';
import { getServerTemplate, getIndexTemplate, getReadmeTemplate } from './index.js';

describe('sdk/stateless templates', () => {
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

    it('should include example prompt', () => {
      const template = getServerTemplate(projectName);
      expect(template).toContain('greeting-template');
      expect(template).toContain('registerPrompt');
    });

    it('should include example tool', () => {
      const template = getServerTemplate(projectName);
      expect(template).toContain('greet');
      expect(template).toContain('registerTool');
    });

    it('should declare schemas as Standard Schema via z.object', () => {
      const template = getServerTemplate(projectName);
      expect(template).toContain('inputSchema: z.object(');
      expect(template).toContain('argsSchema: z.object(');
    });

    it('should not use the deprecated logging subsystem', () => {
      const template = getServerTemplate(projectName);
      expect(template).not.toContain('sendLoggingMessage');
      expect(template).not.toContain('capabilities: { logging: {} }');
    });

    it('should include example resource', () => {
      const template = getServerTemplate(projectName);
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
});
