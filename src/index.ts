#!/usr/bin/env node

import prompts from 'prompts';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getServerTemplate } from './templates/streamable-http/server.js';
import { getIndexTemplate } from './templates/streamable-http/index.js';
import { getPackageJsonTemplate } from './templates/streamable-http/package.json.js';
import { getTsconfigTemplate } from './templates/streamable-http/tsconfig.json.js';
import { getGitignoreTemplate } from './templates/streamable-http/gitignore.js';
import { getEnvExampleTemplate } from './templates/streamable-http/env.example.js';
import { getReadmeTemplate } from './templates/streamable-http/readme.js';

type PackageManager = 'npm' | 'pnpm' | 'yarn';

const packageManagerCommands: Record<PackageManager, { install: string; dev: string }> = {
  npm: { install: 'npm install', dev: 'npm run dev' },
  pnpm: { install: 'pnpm install', dev: 'pnpm dev' },
  yarn: { install: 'yarn', dev: 'yarn dev' },
};

async function main() {
  console.log('\n🚀 Create MCP Server\n');

  const onCancel = () => {
    console.log('\n❌ Operation cancelled\n');
    process.exit(0);
  };

  const projectNameResponse = await prompts(
    {
      type: 'text',
      name: 'projectName',
      message: 'Project name:',
      initial: 'my-mcp-server',
      validate: (value) => {
        if (!value) return 'Project name is required';
        if (!/^[a-z0-9-_]+$/i.test(value)) {
          return 'Project name can only contain letters, numbers, hyphens, and underscores';
        }
        return true;
      },
    },
    { onCancel }
  );

  const { projectName } = projectNameResponse;

  if (!projectName) {
    console.log('\n❌ Project name is required\n');
    process.exit(1);
  }

  const packageManagerResponse = await prompts(
    {
      type: 'select',
      name: 'packageManager',
      message: 'Package manager:',
      choices: [
        { title: 'npm', value: 'npm' },
        { title: 'pnpm', value: 'pnpm' },
        { title: 'yarn', value: 'yarn' },
      ],
      initial: 0,
    },
    { onCancel }
  );

  const packageManager: PackageManager = packageManagerResponse.packageManager || 'npm';

  const projectPath = join(process.cwd(), projectName);
  const srcPath = join(projectPath, 'src');

  try {
    // Create directories
    await mkdir(srcPath, { recursive: true });

    // Write all template files
    await Promise.all([
      writeFile(join(srcPath, 'server.ts'), getServerTemplate(projectName)),
      writeFile(join(srcPath, 'index.ts'), getIndexTemplate()),
      writeFile(join(projectPath, 'package.json'), getPackageJsonTemplate(projectName)),
      writeFile(join(projectPath, 'tsconfig.json'), getTsconfigTemplate()),
      writeFile(join(projectPath, '.gitignore'), getGitignoreTemplate()),
      writeFile(join(projectPath, '.env.example'), getEnvExampleTemplate()),
      writeFile(join(projectPath, 'README.md'), getReadmeTemplate(projectName)),
    ]);

    const commands = packageManagerCommands[packageManager];

    console.log(`\n✅ Created ${projectName} at ${projectPath}`);
    console.log(`\nNext steps:`);
    console.log(`  cd ${projectName}`);
    console.log(`  ${commands.install}`);
    console.log(`  ${commands.dev}`);
    console.log(`\n`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n❌ Error: ${error.message}\n`);
    } else {
      console.error('\n❌ An unexpected error occurred\n');
    }
    process.exit(1);
  }
}

main();
