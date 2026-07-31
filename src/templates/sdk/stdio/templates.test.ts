import { describe, it, expect } from 'vitest';
import { getServerTemplate, getIndexTemplate, getReadmeTemplate } from './index.js';

describe('sdk/stdio templates', () => {
  const projectName = 'test-project';

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

    it('should include example resource', () => {
      const template = getServerTemplate(projectName);
      expect(template).toContain('greeting-resource');
      expect(template).toContain('registerResource');
    });
  });

  describe('getIndexTemplate', () => {
    it('should serve via serveStdio from the SDK v2 stdio entry', () => {
      const template = getIndexTemplate();
      expect(template).toContain("import { serveStdio } from '@modelcontextprotocol/server/stdio'");
      expect(template).toContain('serveStdio(() => getServer())');
    });

    it('should not use v1 SDK import paths or transport wiring', () => {
      const template = getIndexTemplate();
      expect(template).not.toContain('@modelcontextprotocol/sdk');
      expect(template).not.toContain('StdioServerTransport');
      expect(template).not.toContain('server.connect(');
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

    it('should log to stderr, not stdout', () => {
      const template = getIndexTemplate();
      expect(template).toContain("console.error('MCP Server running on stdio')");
      expect(template).not.toContain('console.log');
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
