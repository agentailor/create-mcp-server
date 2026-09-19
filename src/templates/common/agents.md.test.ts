import { describe, it, expect } from 'vitest';
import { getAgentsMdTemplate } from './agents.md.js';

describe('getAgentsMdTemplate', () => {
  const projectName = 'test-project';
  const sdkHttp = { framework: 'sdk', transport: 'http' } as const;
  const sdkStdio = { framework: 'sdk', transport: 'stdio' } as const;
  const fastmcp = { framework: 'fastmcp', transport: 'http' } as const;

  it('should title the document with the project name', () => {
    expect(getAgentsMdTemplate(projectName, sdkHttp)).toContain(`# ${projectName}`);
  });

  // The shipped example is meant to be deleted once real tools exist, but
  // AGENTS.md stays. Anything naming the example rots the moment it goes.
  it('should not reference the shipped example', () => {
    for (const options of [sdkHttp, sdkStdio, fastmcp]) {
      const template = getAgentsMdTemplate(projectName, options);
      expect(template).not.toContain('notes-store');
      expect(template).not.toContain('list_notes');
      expect(template).not.toContain('get_note');
      expect(template).not.toContain('create_note');
      expect(template).not.toContain('summarize-notes');
    }
  });

  it('should say the example is meant to be replaced', () => {
    for (const options of [sdkHttp, fastmcp]) {
      expect(getAgentsMdTemplate(projectName, options)).toContain('meant to be replaced');
    }
  });

  // The README covers running the project; this file covers changing it.
  it('should point at the README rather than restate it', () => {
    const template = getAgentsMdTemplate(projectName, sdkHttp);
    expect(template).toContain('[README](README.md)');
    expect(template).not.toContain('docker build');
    expect(template).not.toContain('OAUTH_ISSUER_URL');
  });

  describe('tool guidance', () => {
    it('should carry the naming rule and its reason', () => {
      const template = getAgentsMdTemplate(projectName, sdkHttp);
      expect(template).toContain('Name it for the action, with its noun');
      // The generated name is interpolated so the warning is concrete.
      expect(template).toContain(`${projectName}_invoices_list`);
    });

    it('should cover the contracts a description makes', () => {
      const template = getAgentsMdTemplate(projectName, sdkHttp);
      expect(template).toContain('say so and say how to continue');
      expect(template).toContain('isError');
      expect(template).toContain('Document every parameter');
    });

    it('should say how to organize tools as they grow', () => {
      const template = getAgentsMdTemplate(projectName, sdkHttp);
      expect(template).toContain('Organizing tools as they grow');
      expect(template).toContain('src/tools/');
      expect(template).toContain('composition root');
    });
  });

  describe('per-transport guidance', () => {
    it('should warn HTTP projects about per-request server state', () => {
      const template = getAgentsMdTemplate(projectName, sdkHttp);
      expect(template).toContain('once per request');
      expect(template).toContain('module scope');
    });

    it('should give stdio projects the stdout rule instead', () => {
      const template = getAgentsMdTemplate(projectName, sdkStdio);
      expect(template).toContain('stdout belongs to the protocol');
      expect(template).toContain('console.error');
      expect(template).not.toContain('once per request');
    });
  });

  describe('OAuth', () => {
    it('should explain the OAuthError requirement when OAuth is enabled', () => {
      const template = getAgentsMdTemplate(projectName, { ...sdkHttp, withOAuth: true });
      expect(template).toContain('OAuthError');
      expect(template).toContain('WWW-Authenticate');
      expect(template).toContain('src/auth.ts');
    });

    it('should omit the OAuth section when OAuth is disabled', () => {
      const template = getAgentsMdTemplate(projectName, sdkHttp);
      expect(template).not.toContain('OAuthError');
      expect(template).not.toContain('src/auth.ts');
    });
  });

  describe('testing guidance', () => {
    it('should frame the suite as an example rather than a quota', () => {
      const template = getAgentsMdTemplate(projectName, sdkHttp);
      expect(template).toContain('not a quota to match');
      expect(template).toContain('src/server.test.ts');
    });

    it('should not promise tests FastMCP projects do not ship', () => {
      const template = getAgentsMdTemplate(projectName, fastmcp);
      expect(template).toContain('ships without a test setup');
      expect(template).not.toContain('src/server.test.ts');
      expect(template).not.toContain('npm test');
    });
  });

  describe('layout', () => {
    it('should describe the split primitives for SDK projects', () => {
      const template = getAgentsMdTemplate(projectName, sdkHttp);
      expect(template).toContain('src/tools.ts');
      expect(template).toContain('MCP imports');
      expect(template).toContain('Keep that seam');
    });

    it('should describe the single-file layout for FastMCP projects', () => {
      const template = getAgentsMdTemplate(projectName, fastmcp);
      expect(template).toContain('the FastMCP server and its tools');
      expect(template).not.toContain('src/tools.ts');
    });
  });

  describe('commands', () => {
    it('should use the selected package manager', () => {
      const template = getAgentsMdTemplate(projectName, { ...sdkHttp, packageManager: 'yarn' });
      expect(template).toContain('yarn dev');
      expect(template).toContain('yarn build');
      expect(template).not.toContain('npm run');
    });

    it('should omit the test command for FastMCP projects', () => {
      const template = getAgentsMdTemplate(projectName, fastmcp);
      expect(template).toContain('npm run build');
      expect(template).not.toContain('npm test');
    });
  });
});
