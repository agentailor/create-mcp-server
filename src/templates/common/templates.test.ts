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

    it('should use SDK package by default', () => {
      const template = getPackageJsonTemplate(projectName);
      const pkg = JSON.parse(template);
      expect(pkg.dependencies['@modelcontextprotocol/sdk']).toBeDefined();
      expect(pkg.dependencies['express']).toBeDefined();
    });

    it('should use FastMCP package when framework is fastmcp', () => {
      const template = getPackageJsonTemplate(projectName, { framework: 'fastmcp' });
      const pkg = JSON.parse(template);
      expect(pkg.dependencies['fastmcp']).toBeDefined();
      expect(pkg.dependencies['@modelcontextprotocol/sdk']).toBeUndefined();
      expect(pkg.dependencies['express']).toBeUndefined();
    });

    it('should include OAuth dependencies when withOAuth is true for SDK', () => {
      const template = getPackageJsonTemplate(projectName, { framework: 'sdk', withOAuth: true });
      const pkg = JSON.parse(template);
      expect(pkg.dependencies['dotenv']).toBeDefined();
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
});
