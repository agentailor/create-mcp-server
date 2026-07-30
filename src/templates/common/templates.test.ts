import { describe, it, expect } from 'vitest';
import { getPackageJsonTemplate } from './package.json.js';
import { getTsconfigTemplate } from './tsconfig.json.js';
import { getGitignoreTemplate } from './gitignore.js';
import { getEnvExampleTemplate } from './env.example.js';

describe('common templates', () => {
  const projectName = 'test-project';

  describe('getPackageJsonTemplate', () => {
    it('should include project name', () => {
      const template = getPackageJsonTemplate(projectName);
      const pkg = JSON.parse(template);
      expect(pkg.name).toBe(projectName);
    });

    it('should use SDK v2 packages by default', () => {
      const template = getPackageJsonTemplate(projectName);
      const pkg = JSON.parse(template);
      expect(pkg.dependencies['@modelcontextprotocol/server']).toBeDefined();
      expect(pkg.dependencies['@modelcontextprotocol/express']).toBeDefined();
      expect(pkg.dependencies['@modelcontextprotocol/node']).toBeDefined();
      expect(pkg.dependencies['express']).toBeDefined();
      // v1 monolith must not be pulled into SDK projects
      expect(pkg.dependencies['@modelcontextprotocol/sdk']).toBeUndefined();
    });

    it('should include hono for SDK HTTP (peer dependency of @modelcontextprotocol/node)', () => {
      const template = getPackageJsonTemplate(projectName);
      const pkg = JSON.parse(template);
      expect(pkg.dependencies['hono']).toBeDefined();
    });

    it('should include dotenv for SDK', () => {
      const template = getPackageJsonTemplate(projectName);
      const pkg = JSON.parse(template);
      expect(pkg.dependencies['dotenv']).toBeDefined();
    });

    it('should use FastMCP package when framework is fastmcp', () => {
      const template = getPackageJsonTemplate(projectName, { framework: 'fastmcp' });
      const pkg = JSON.parse(template);
      expect(pkg.dependencies['fastmcp']).toBeDefined();
      // FastMCP depends on the v1 SDK transitively, never directly
      expect(pkg.dependencies['@modelcontextprotocol/sdk']).toBeUndefined();
      expect(pkg.dependencies['express']).toBeUndefined();
    });

    it('should NOT pull SDK v2 packages into FastMCP projects', () => {
      const template = getPackageJsonTemplate(projectName, { framework: 'fastmcp' });
      const pkg = JSON.parse(template);
      expect(pkg.dependencies['@modelcontextprotocol/server']).toBeUndefined();
      expect(pkg.dependencies['@modelcontextprotocol/express']).toBeUndefined();
      expect(pkg.dependencies['@modelcontextprotocol/node']).toBeUndefined();
    });

    it('should include dotenv for FastMCP', () => {
      const template = getPackageJsonTemplate(projectName, { framework: 'fastmcp' });
      const pkg = JSON.parse(template);
      expect(pkg.dependencies['dotenv']).toBeDefined();
    });

    it('should include jose dependency when withOAuth is true for SDK', () => {
      const template = getPackageJsonTemplate(projectName, { framework: 'sdk', withOAuth: true });
      const pkg = JSON.parse(template);
      expect(pkg.dependencies['jose']).toBeDefined();
    });

    it('should not include @types/express for FastMCP', () => {
      const template = getPackageJsonTemplate(projectName, { framework: 'fastmcp' });
      const pkg = JSON.parse(template);
      expect(pkg.devDependencies['@types/express']).toBeUndefined();
    });

    it('should include @types/express for SDK', () => {
      const template = getPackageJsonTemplate(projectName, { framework: 'sdk' });
      const pkg = JSON.parse(template);
      expect(pkg.devDependencies['@types/express']).toBeDefined();
    });

    it('should NOT include express or @types/express for SDK stdio', () => {
      const template = getPackageJsonTemplate(projectName, {
        framework: 'sdk',
        transport: 'stdio',
      });
      const pkg = JSON.parse(template);
      expect(pkg.dependencies['express']).toBeUndefined();
      expect(pkg.devDependencies['@types/express']).toBeUndefined();
      expect(pkg.dependencies['hono']).toBeUndefined();
      expect(pkg.dependencies['@modelcontextprotocol/server']).toBeDefined();
      expect(pkg.dependencies['@modelcontextprotocol/express']).toBeUndefined();
      expect(pkg.dependencies['@modelcontextprotocol/node']).toBeUndefined();
    });

    it('should use inspect:tools, inspect:prompts, inspect:resources scripts for stdio transport', () => {
      const template = getPackageJsonTemplate(projectName, {
        framework: 'sdk',
        transport: 'stdio',
      });
      const pkg = JSON.parse(template);
      expect(pkg.scripts['inspect:tools']).toContain('--method tools/list');
      expect(pkg.scripts['inspect:prompts']).toContain('--method prompts/list');
      expect(pkg.scripts['inspect:resources']).toContain('--method resources/list');
      expect(pkg.scripts['inspect']).toBeUndefined();
    });

    it('should use http inspect script for http transport (default)', () => {
      const template = getPackageJsonTemplate(projectName, { framework: 'sdk', transport: 'http' });
      const pkg = JSON.parse(template);
      expect(pkg.scripts.inspect).toContain('http://localhost:3000/mcp');
    });

    // The inspector devDependency requires >=22.19.0; a lower floor makes npm
    // emit an EBADENGINE warning on install.
    it('should declare a node engine satisfying the inspector requirement', () => {
      for (const options of [
        { framework: 'sdk' as const, transport: 'http' as const },
        { framework: 'sdk' as const, transport: 'stdio' as const },
        { framework: 'fastmcp' as const },
      ]) {
        const pkg = JSON.parse(getPackageJsonTemplate(projectName, options));
        expect(pkg.engines.node).toBe('>=22.19.0');
      }
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

    it('should include ALLOWED_HOSTS hint for SDK framework', () => {
      const template = getEnvExampleTemplate({ framework: 'sdk' });
      expect(template).toContain('ALLOWED_HOSTS');
    });

    it('should include ALLOWED_HOSTS hint by default (no framework specified)', () => {
      const template = getEnvExampleTemplate();
      expect(template).toContain('ALLOWED_HOSTS');
    });

    it('should NOT include ALLOWED_HOSTS for FastMCP framework', () => {
      const template = getEnvExampleTemplate({ framework: 'fastmcp' });
      expect(template).not.toContain('ALLOWED_HOSTS');
    });

    it('should NOT include PORT for stdio transport', () => {
      const template = getEnvExampleTemplate({ transport: 'stdio' });
      expect(template).not.toContain('PORT=');
    });

    it('should NOT include ALLOWED_HOSTS for stdio transport', () => {
      const template = getEnvExampleTemplate({ transport: 'stdio' });
      expect(template).not.toContain('ALLOWED_HOSTS');
    });
  });
});
