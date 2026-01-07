import { describe, it, expect } from 'vitest';
import { getServerTemplate, getIndexTemplate, getReadmeTemplate } from './index.js';

describe('streamable-http templates', () => {
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

    // Stateless-specific tests
    it('should use undefined sessionIdGenerator for stateless mode', () => {
      const template = getIndexTemplate();
      expect(template).toContain('sessionIdGenerator: undefined');
    });

    it('should return 405 for GET requests', () => {
      const template = getIndexTemplate();
      expect(template).toContain('res.writeHead(405)');
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

    it('should describe stateless behavior', () => {
      const template = getReadmeTemplate(projectName);
      expect(template).toContain('stateless');
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
