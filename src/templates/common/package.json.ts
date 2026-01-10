import type { CommonTemplateOptions } from './types.js';

export function getPackageJsonTemplate(
  projectName: string,
  options?: CommonTemplateOptions
): string {
  const withOAuth = options?.withOAuth ?? false;
  const framework = options?.framework ?? 'sdk';

  let dependencies: Record<string, string>;
  let devDependencies: Record<string, string>;

  const commonDevDependencies = {
    typescript: '^5.9.3',
    '@modelcontextprotocol/inspector': '^0.18.0',
  };
  const zodDependency = { zod: '^4.3.5' };

  if (framework === 'fastmcp') {
    // FastMCP dependencies - simpler setup
    dependencies = {
      fastmcp: '^3.26.8',
      ...zodDependency,
    };

    devDependencies = {
      ...commonDevDependencies,
    };
  } else {
    // Official SDK dependencies
    dependencies = {
      '@modelcontextprotocol/sdk': '^1.25.1',
      express: '^5.2.1',
      ...zodDependency,
    };

    if (withOAuth) {
      dependencies['dotenv'] = '^17.2.3';
      dependencies['jose'] = '^6.1.3';
    }

    devDependencies = {
      '@types/express': '^5.0.6',
      '@types/node': '^25.0.3',
      ...commonDevDependencies,
    };
  }

  const packageJson = {
    name: projectName,
    version: '0.1.0',
    type: 'module',
    main: 'dist/index.js',
    scripts: {
      build: 'tsc',
      dev: 'tsc && node dist/index.js',
      start: 'node dist/index.js',
      inspect: 'mcp-inspector http://localhost:3000/mcp',
    },
    dependencies,
    devDependencies,
    engines: {
      node: '>=20',
    },
  };

  return JSON.stringify(packageJson, null, 2) + '\n';
}
