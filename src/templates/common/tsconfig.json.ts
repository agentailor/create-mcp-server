export function getTsconfigTemplate(options?: { withTests?: boolean }): string {
  const withTests = options?.withTests ?? false;

  // Test files are type-checked by the editor and by vitest, but kept out of
  // the build so they never reach dist/ or the production Docker image.
  const exclude = withTests
    ? ['node_modules', 'dist', 'src/**/*.test.ts']
    : ['node_modules', 'dist'];

  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      declaration: true,
      types: ['node'],
    },
    include: ['src/**/*'],
    exclude,
  };

  return JSON.stringify(tsconfig, null, 2) + '\n';
}
