import { describe, it, expect } from 'vitest';
import { getServerTemplate } from './server.js';
import { getIndexTemplate } from './index.js';
import { getPackageJsonTemplate } from './package.json.js';
import { getTsconfigTemplate } from './tsconfig.json.js';
import { getGitignoreTemplate } from './gitignore.js';
import { getEnvExampleTemplate } from './env.example.js';
import { getReadmeTemplate } from './readme.js';

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

    it('should use manual express setup', () => {
      const template = getIndexTemplate();
      expect(template).toContain('import express');
      expect(template).toContain('const app = express()');
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
  });

  describe('getPackageJsonTemplate', () => {
    it('should include project name', () => {
      const template = getPackageJsonTemplate(projectName);
      const pkg = JSON.parse(template);
      expect(pkg.name).toBe(projectName);
    });

    it('should use correct SDK package', () => {
      const template = getPackageJsonTemplate(projectName);
      const pkg = JSON.parse(template);
      expect(pkg.dependencies['@modelcontextprotocol/sdk']).toBeDefined();
    });

    it('should include required scripts', () => {
      const template = getPackageJsonTemplate(projectName);
      const pkg = JSON.parse(template);
      expect(pkg.scripts.build).toBe('tsc');
      expect(pkg.scripts.dev).toBeDefined();
      expect(pkg.scripts.start).toBeDefined();
    });

    it('should be valid JSON', () => {
      const template = getPackageJsonTemplate(projectName);
      expect(() => JSON.parse(template)).not.toThrow();
    });
  });

  describe('getTsconfigTemplate', () => {
    it('should be valid JSON', () => {
      const template = getTsconfigTemplate();
      expect(() => JSON.parse(template)).not.toThrow();
    });

    it('should target ES2022 with NodeNext modules', () => {
      const template = getTsconfigTemplate();
      const config = JSON.parse(template);
      expect(config.compilerOptions.target).toBe('ES2022');
      expect(config.compilerOptions.module).toBe('NodeNext');
    });
  });

  describe('getGitignoreTemplate', () => {
    it('should ignore node_modules and dist', () => {
      const template = getGitignoreTemplate();
      expect(template).toContain('node_modules/');
      expect(template).toContain('dist/');
    });

    it('should ignore .env', () => {
      const template = getGitignoreTemplate();
      expect(template).toContain('.env');
    });
  });

  describe('getEnvExampleTemplate', () => {
    it('should include PORT variable', () => {
      const template = getEnvExampleTemplate();
      expect(template).toContain('PORT=');
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
  });
});
