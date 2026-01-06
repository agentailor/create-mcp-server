export interface TemplateOptions {
  withOAuth?: boolean;
}

export function getPackageJsonTemplate(projectName: string, options?: TemplateOptions): string {
  const withOAuth = options?.withOAuth ?? false;

  const dependencies: Record<string, string> = {
    '@modelcontextprotocol/sdk': '^1.12.1',
    express: '^5.1.0',
    zod: '^3.25.30',
  };

  if (withOAuth) {
    dependencies['dotenv'] = '^16.4.7';
    dependencies['jose'] = '^6.0.10';
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
    },
    dependencies,
    devDependencies: {
      '@types/express': '^5.0.0',
      '@types/node': '^22.15.21',
      typescript: '^5.8.3',
    },
    engines: {
      node: '>=20',
    },
  };

  return JSON.stringify(packageJson, null, 2) + '\n';
}
