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
});
