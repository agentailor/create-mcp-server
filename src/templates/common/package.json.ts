export interface TemplateOptions {
  withOAuth?: boolean;
  packageManager?: 'npm' | 'pnpm' | 'yarn';
}

export function getPackageJsonTemplate(projectName: string, options?: TemplateOptions): string {
  const withOAuth = options?.withOAuth ?? false;

  const dependencies: Record<string, string> = {
    '@modelcontextprotocol/sdk': '^1.25.1',
    express: '^5.2.1',
    zod: '^4.3.5',
  };

  if (withOAuth) {
    dependencies['dotenv'] = '^17.2.3';
    dependencies['jose'] = '^6.1.3';
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
    devDependencies: {
      '@types/express': '^5.0.6',
      '@types/node': '^25.0.3',
      typescript: '^5.9.3',
      '@modelcontextprotocol/inspector': '^0.18.0',
    },
    engines: {
      node: '>=20',
    },
  };

  return JSON.stringify(packageJson, null, 2) + '\n';
}
