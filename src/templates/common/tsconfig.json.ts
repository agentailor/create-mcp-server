export function getTsconfigTemplate(): string {
  // Test files are type-checked by the editor and by vitest, but kept out of
  // the build so they never reach dist/ or the production Docker image.
  const exclude = ['node_modules', 'dist', 'src/**/*.test.ts'];

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
