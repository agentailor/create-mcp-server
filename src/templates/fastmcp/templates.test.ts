import { describe, it, expect } from 'vitest';
import { getServerTemplate, getIndexTemplate, getReadmeTemplate } from './index.js';

describe('fastmcp templates', () => {
  const projectName = 'test-project';

  describe('getServerTemplate', () => {
    it('should include project name in server config', () => {
      const template = getServerTemplate(projectName);
      expect(template).toContain(`name: '${projectName}'`);
    });

    it('should import FastMCP', () => {
      const template = getServerTemplate(projectName);
      expect(template).toContain("from 'fastmcp'");
      expect(template).toContain('FastMCP');
    });

    it('should include example prompt', () => {
      const template = getServerTemplate(projectName);
      expect(template).toContain('greeting-template');
      expect(template).toContain('addPrompt');
    });

    it('should include example tool', () => {
      const template = getServerTemplate(projectName);
      expect(template).toContain('start-notification-stream');
      expect(template).toContain('addTool');
    });

    it('should include example resource', () => {
      const template = getServerTemplate(projectName);
      expect(template).toContain('greeting-resource');
      expect(template).toContain('addResource');
    });

    it('should use zod for parameter validation', () => {
      const template = getServerTemplate(projectName);
      expect(template).toContain("from 'zod'");
      expect(template).toContain('z.object');
    });
  });

  describe('getIndexTemplate', () => {
    it('should import server from server.ts', () => {
      const template = getIndexTemplate();
      expect(template).toContain("from './server.js'");
    });

    it('should use httpStream transport', () => {
      const template = getIndexTemplate();
      expect(template).toContain("transportType: 'httpStream'");
    });

    it('should use PORT from environment variable', () => {
      const template = getIndexTemplate();
      expect(template).toContain('process.env.PORT');
    });

    it('should NOT include stateless option by default', () => {
      const template = getIndexTemplate();
      expect(template).not.toContain('stateless: true');
    });

    it('should include stateless option when specified', () => {
      const template = getIndexTemplate({ stateless: true });
      expect(template).toContain('stateless: true');
    });
  });

  describe('getReadmeTemplate', () => {
    it('should include project name', () => {
      const template = getReadmeTemplate(projectName);
      expect(template).toContain(`# ${projectName}`);
    });

    it('should mention FastMCP', () => {
      const template = getReadmeTemplate(projectName);
      expect(template).toContain('FastMCP');
      expect(template).toContain('github.com/punkpeye/fastmcp');
    });

    it('should include npm commands by default', () => {
      const template = getReadmeTemplate(projectName);
      expect(template).toContain('npm install');
      expect(template).toContain('npm run dev');
    });

    it('should use pnpm commands when specified', () => {
      const template = getReadmeTemplate(projectName, { packageManager: 'pnpm' });
      expect(template).toContain('pnpm install');
      expect(template).toContain('pnpm dev');
    });

    it('should describe stateful mode by default', () => {
      const template = getReadmeTemplate(projectName);
      expect(template).toContain('stateful');
    });

    it('should describe stateless mode when specified', () => {
      const template = getReadmeTemplate(projectName, { stateless: true });
      expect(template).toContain('stateless');
    });
  });
});
