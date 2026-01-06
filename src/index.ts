#!/usr/bin/env node

import prompts from 'prompts';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getPackageJsonTemplate } from './templates/common/package.json.js';
import { getTsconfigTemplate } from './templates/common/tsconfig.json.js';
import { getGitignoreTemplate } from './templates/common/gitignore.js';
import { getEnvExampleTemplate } from './templates/common/env.example.js';
import {
  getServerTemplate as getStatelessServerTemplate,
  getIndexTemplate as getStatelessIndexTemplate,
  getReadmeTemplate as getStatelessReadmeTemplate,
  type TemplateOptions,
} from './templates/streamable-http/index.js';
import {
  getServerTemplate as getStatefulServerTemplate,
  getIndexTemplate as getStatefulIndexTemplate,
  getReadmeTemplate as getStatefulReadmeTemplate,
  getAuthTemplate as getStatefulAuthTemplate,
} from './templates/stateful-streamable-http/index.js';

type TemplateType = 'stateless' | 'stateful';
type PackageManager = 'npm' | 'pnpm' | 'yarn';

const templateFunctions: Record<
  TemplateType,
  {
    getServerTemplate: (projectName: string) => string;
    getIndexTemplate: (options?: TemplateOptions) => string;
    getReadmeTemplate: (projectName: string, options?: TemplateOptions) => string;
    getAuthTemplate?: () => string;
  }
> = {
  stateless: {
    getServerTemplate: getStatelessServerTemplate,
    getIndexTemplate: getStatelessIndexTemplate,
    getReadmeTemplate: getStatelessReadmeTemplate,
  },
  stateful: {
    getServerTemplate: getStatefulServerTemplate,
    getIndexTemplate: getStatefulIndexTemplate,
    getReadmeTemplate: getStatefulReadmeTemplate,
    getAuthTemplate: getStatefulAuthTemplate,
  },
};

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

  const templateTypeResponse = await prompts(
    {
      type: 'select',
      name: 'templateType',
      message: 'Template type:',
      choices: [
        { title: 'Stateless', value: 'stateless', description: 'Simple stateless HTTP server' },
        {
          title: 'Stateful',
          value: 'stateful',
          description: 'Session-based server with SSE support',
        },
      ],
      initial: 0,
    },
    { onCancel }
  );

  const templateType: TemplateType = templateTypeResponse.templateType || 'stateless';

  // OAuth prompt - only for stateful template
  let withOAuth = false;
  if (templateType === 'stateful') {
    const oauthResponse = await prompts(
      {
        type: 'confirm',
        name: 'withOAuth',
        message: 'Enable OAuth authentication?',
        initial: false,
      },
      { onCancel }
    );
    withOAuth = oauthResponse.withOAuth ?? false;
  }

  const templateOptions: TemplateOptions = { withOAuth };
  const templates = templateFunctions[templateType];

  const projectPath = join(process.cwd(), projectName);
  const srcPath = join(projectPath, 'src');

  try {
    // Create directories
    await mkdir(srcPath, { recursive: true });

    // Build list of files to write
    const filesToWrite = [
      writeFile(join(srcPath, 'server.ts'), templates.getServerTemplate(projectName)),
      writeFile(join(srcPath, 'index.ts'), templates.getIndexTemplate(templateOptions)),
      writeFile(
        join(projectPath, 'package.json'),
        getPackageJsonTemplate(projectName, templateOptions)
      ),
      writeFile(join(projectPath, 'tsconfig.json'), getTsconfigTemplate()),
      writeFile(join(projectPath, '.gitignore'), getGitignoreTemplate()),
      writeFile(join(projectPath, '.env.example'), getEnvExampleTemplate(templateOptions)),
      writeFile(
        join(projectPath, 'README.md'),
        templates.getReadmeTemplate(projectName, templateOptions)
      ),
    ];

    // Conditionally add auth.ts for OAuth-enabled stateful template
    if (withOAuth && templates.getAuthTemplate) {
      filesToWrite.push(writeFile(join(srcPath, 'auth.ts'), templates.getAuthTemplate()));
    }

    // Write all template files
    await Promise.all(filesToWrite);

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
