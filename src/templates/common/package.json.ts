import type { CommonTemplateOptions } from './types.js';

export function getPackageJsonTemplate(
  projectName: string,
  options?: CommonTemplateOptions
): string {
  const withOAuth = options?.withOAuth ?? false;
  const framework = options?.framework ?? 'sdk';
  const transport = options?.transport ?? 'http';

  let dependencies: Record<string, string>;
  let devDependencies: Record<string, string>;

  const commonDevDependencies = {
    typescript: '^6.0.2',
    '@modelcontextprotocol/inspector': '^0.21.1',
    '@types/node': '^25.5.2',
  };
  const zodDependency = { zod: '^4.3.6' };
  const dotEnvDependency = { dotenv: '^17.4.1' };

  if (framework === 'fastmcp') {
    // FastMCP dependencies - simpler setup
    dependencies = {
      fastmcp: '^3.35.0',
      ...zodDependency,
      ...dotEnvDependency,
    };

    devDependencies = {
      ...commonDevDependencies,
    };
  } else if (transport === 'stdio') {
    // Official SDK stdio - no express needed
    dependencies = {
      '@modelcontextprotocol/sdk': '^1.29.0',
      ...zodDependency,
      ...dotEnvDependency,
    };

    devDependencies = {
      ...commonDevDependencies,
    };
  } else {
    // Official SDK HTTP dependencies
    dependencies = {
      '@modelcontextprotocol/sdk': '^1.29.0',
      express: '^5.2.1',
      ...zodDependency,
      ...dotEnvDependency,
    };

    if (withOAuth) {
      dependencies['jose'] = '^6.2.2';
    }

    devDependencies = {
      '@types/express': '^5.0.6',
      ...commonDevDependencies,
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
      ...inspectScripts,
    },
    dependencies,
    devDependencies,
    engines: {
      node: '>=20',
    },
  };

  return JSON.stringify(packageJson, null, 2) + '\n';
}
