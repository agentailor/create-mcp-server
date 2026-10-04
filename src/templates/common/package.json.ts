import type { CommonTemplateOptions } from './types.js';

export function getPackageJsonTemplate(
  projectName: string,
  options?: CommonTemplateOptions
): string {
  const withOAuth = options?.withOAuth ?? false;
  const transport = options?.transport ?? 'http';

  let dependencies: Record<string, string>;
  let devDependencies: Record<string, string>;

  const commonDevDependencies = {
    typescript: '^7.0.2',
    '@modelcontextprotocol/inspector': '^2.9.0',
    '@types/node': '^26.6.4',
  };
  const zodDependency = { zod: '^4.6.5' };
  const dotEnvDependency = { dotenv: '^18.0.5' };
  // The client drives the server over an in-memory transport in the generated
  // tests, so it must track @modelcontextprotocol/server's major.
  const testDevDependencies = {
    vitest: '^5.0.3',
    '@modelcontextprotocol/client': '^2.3.0',
  };

  if (transport === 'stdio') {
    // Official SDK v2 stdio - no express needed
    dependencies = {
      '@modelcontextprotocol/server': '^2.3.0',
      ...zodDependency,
      ...dotEnvDependency,
    };

    devDependencies = {
      ...commonDevDependencies,
      ...testDevDependencies,
    };
  } else {
    // hono is a peer dependency of @modelcontextprotocol/node, so the generated
    // project must declare it even though no template code imports it.
    dependencies = {
      '@modelcontextprotocol/server': '^2.3.0',
      '@modelcontextprotocol/express': '^2.0.2',
      '@modelcontextprotocol/node': '^2.1.1',
      express: '^5.2.1',
      hono: '^4.13.13',
      ...zodDependency,
      ...dotEnvDependency,
    };

    if (withOAuth) {
      dependencies['jose'] = '^6.2.12';
    }

    devDependencies = {
      '@types/express': '^5.0.6',
      ...commonDevDependencies,
      ...testDevDependencies,
    };
  }

  const inspectScripts =
    transport === 'stdio'
      ? {
          'inspect:tools': 'mcp-inspector --cli node dist/index.js --method tools/list',
          'inspect:prompts': 'mcp-inspector --cli node dist/index.js --method prompts/list',
          'inspect:resources': 'mcp-inspector --cli node dist/index.js --method resources/list',
        }
      : { inspect: 'mcp-inspector http://localhost:3000/mcp' };

  const packageJson = {
    name: projectName,
    version: '0.1.0',
    type: 'module',
    main: 'dist/index.js',
    scripts: {
      build: 'tsc',
      dev: 'tsc && node dist/index.js',
      start: 'node dist/index.js',
      test: 'vitest run',
      'test:watch': 'vitest',
      ...inspectScripts,
    },
    dependencies,
    devDependencies,
    engines: {
      // Floor set by @modelcontextprotocol/inspector, which requires >=22.19.0
      // (vitest 5 alone needs ^22.12.0). The SDK v2 packages only need >=20.
      // Node 20 is end-of-life, so this floor costs no supported user anything.
      node: '>=22.19.0',
    },
  };

  return JSON.stringify(packageJson, null, 2) + '\n';
}
