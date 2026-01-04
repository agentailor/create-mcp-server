export function getPackageJsonTemplate(projectName: string): string {
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
    dependencies: {
      '@modelcontextprotocol/sdk': '^1.12.1',
      express: '^5.1.0',
      zod: '^3.25.30',
    },
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
