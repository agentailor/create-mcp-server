import { describe, it, expect } from 'vitest';
import { getServerTemplate, getIndexTemplate, getReadmeTemplate } from './index.js';

describe('sdk/stdio templates', () => {
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
    it('should import StdioServerTransport', () => {
      const template = getIndexTemplate();
      expect(template).toContain('StdioServerTransport');
      expect(template).toContain('@modelcontextprotocol/sdk/server/stdio.js');
    });

    it('should NOT import express or createMcpExpressApp', () => {
      const template = getIndexTemplate();
      expect(template).not.toContain('express');
      expect(template).not.toContain('createMcpExpressApp');
    });

    it('should NOT reference PORT', () => {
      const template = getIndexTemplate();
      expect(template).not.toContain('PORT');
      expect(template).not.toContain('process.env.PORT');
    });

    it('should connect server to StdioServerTransport', () => {
      const template = getIndexTemplate();
      expect(template).toContain('new StdioServerTransport()');
      expect(template).toContain('server.connect(transport)');
    });

    it('should log to stderr, not stdout', () => {
      const template = getIndexTemplate();
      expect(template).toContain('console.error("MCP Server running on stdio")');
    });

    it('should wrap startup in async main with error handling', () => {
      const template = getIndexTemplate();
      expect(template).toContain('async function main()');
      expect(template).toContain('main().catch');
      expect(template).toContain('process.exit(1)');
    });
  });

  describe('getReadmeTemplate', () => {
    it('should include project name', () => {
      const template = getReadmeTemplate(projectName);
      expect(template).toContain(`# ${projectName}`);
    });

    it('should describe stdio transport', () => {
      const template = getReadmeTemplate(projectName);
      expect(template).toContain('stdio');
    });

    it('should include MCP Inspector CLI commands', () => {
      const template = getReadmeTemplate(projectName);
      expect(template).toContain('inspect:tools');
      expect(template).toContain('inspect:prompts');
      expect(template).toContain('inspect:resources');
    });

    it('should NOT mention HTTP API endpoints', () => {
      const template = getReadmeTemplate(projectName);
      expect(template).not.toContain('POST /mcp');
      expect(template).not.toContain('GET /health');
    });

    it('should NOT mention PORT or ALLOWED_HOSTS', () => {
      const template = getReadmeTemplate(projectName);
      expect(template).not.toContain('PORT');
      expect(template).not.toContain('ALLOWED_HOSTS');
    });

    it('should NOT include Docker deployment section', () => {
      const template = getReadmeTemplate(projectName);
      expect(template).not.toContain('docker build');
      expect(template).not.toContain('Dockerfile');
    });

    it('should use npm commands by default', () => {
      const template = getReadmeTemplate(projectName);
      expect(template).toContain('npm install');
      expect(template).toContain('npm run dev');
    });

    it('should use pnpm commands when specified', () => {
      const template = getReadmeTemplate(projectName, { packageManager: 'pnpm' });
      expect(template).toContain('pnpm install');
      expect(template).toContain('pnpm dev');
      expect(template).not.toContain('npm run');
    });

    it('should use yarn commands when specified', () => {
      const template = getReadmeTemplate(projectName, { packageManager: 'yarn' });
      expect(template).toContain('yarn\n');
      expect(template).toContain('yarn dev');
      expect(template).not.toContain('npm run');
    });
  });
});
