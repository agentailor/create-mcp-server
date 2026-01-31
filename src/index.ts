#!/usr/bin/env node

import { parseArguments } from './cli.js';
import { runInteractiveMode } from './interactive.js';
import { generateProject } from './project-generator.js';

async function main() {
  const { mode, options } = parseArguments();

  if (mode === 'interactive') {
    await runInteractiveMode();
  } else {
    // CLI mode - options is guaranteed to be defined
    await generateProject({
      projectName: options!.name,
      packageManager: options!.packageManager,
      framework: options!.framework,
      templateType: options!.template,
      withOAuth: options!.oauth,
      withGitInit: options!.git,
    });
  }
}

main().catch((error) => {
  if (error instanceof Error) {
    console.error(`\nError: ${error.message}\n`);
  } else {
    console.error('\nAn unexpected error occurred\n');
  }
  process.exit(1);
});
