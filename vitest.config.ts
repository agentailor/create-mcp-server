import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Tests run against both the TypeScript sources and the compiled output.
    include: ['src/**/*.test.ts', 'dist/**/*.test.js'],
    // `generated/` holds scratch projects produced while testing the CLI by
    // hand. They are gitignored, but they now ship their own test suites, so
    // without this the repo's own run picks them up.
    exclude: ['**/node_modules/**', 'generated/**'],
  },
});
