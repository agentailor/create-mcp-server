#!/usr/bin/env node

import prompts from 'prompts';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { getPackageJsonTemplate } from './templates/common/package.json.js';
import { getTsconfigTemplate } from './templates/common/tsconfig.json.js';
import { getGitignoreTemplate } from './templates/common/gitignore.js';
import { getEnvExampleTemplate } from './templates/common/env.example.js';
import {
  getServerTemplate as getSdkStatelessServerTemplate,
  getIndexTemplate as getSdkStatelessIndexTemplate,
  getReadmeTemplate as getSdkStatelessReadmeTemplate,
  type TemplateOptions,
} from './templates/sdk/stateless/index.js';
import {
  getServerTemplate as getSdkStatefulServerTemplate,
  getIndexTemplate as getSdkStatefulIndexTemplate,
  getReadmeTemplate as getSdkStatefulReadmeTemplate,
  getAuthTemplate as getSdkAuthTemplate,
} from './templates/sdk/stateful/index.js';
import {
  getServerTemplate as getFastMCPServerTemplate,
  getIndexTemplate as getFastMCPIndexTemplate,
  getReadmeTemplate as getFastMCPReadmeTemplate,
} from './templates/fastmcp/index.js';

type Framework = 'sdk' | 'fastmcp';
type TemplateType = 'stateless' | 'stateful';
type PackageManager = 'npm' | 'pnpm' | 'yarn';

interface ExtendedTemplateOptions extends TemplateOptions {
  framework?: Framework;
  stateless?: boolean;
}

const sdkTemplateFunctions: Record<
  TemplateType,
  {
    getServerTemplate: (projectName: string) => string;
    getIndexTemplate: (options?: TemplateOptions) => string;
    getReadmeTemplate: (projectName: string, options?: TemplateOptions) => string;
    getAuthTemplate?: () => string;
  }
> = {
  stateless: {
    getServerTemplate: getSdkStatelessServerTemplate,
    getIndexTemplate: getSdkStatelessIndexTemplate,
    getReadmeTemplate: getSdkStatelessReadmeTemplate,
  },
  stateful: {
    getServerTemplate: getSdkStatefulServerTemplate,
    getIndexTemplate: getSdkStatefulIndexTemplate,
    getReadmeTemplate: getSdkStatefulReadmeTemplate,
    getAuthTemplate: getSdkAuthTemplate,
  },
};

const fastmcpTemplateFunctions = {
  getServerTemplate: getFastMCPServerTemplate,
  getIndexTemplate: getFastMCPIndexTemplate,
  getReadmeTemplate: getFastMCPReadmeTemplate,
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

  // Framework selection
  const frameworkResponse = await prompts(
    {
      type: 'select',
      name: 'framework',
      message: 'Framework:',
      choices: [
        {
          title: 'Official MCP SDK',
          value: 'sdk',
          description: 'Full control with Express.js',
        },
        {
          title: 'FastMCP',
          value: 'fastmcp',
          description: 'Simpler API, less boilerplate',
        },
      ],
      initial: 0,
    },
    { onCancel }
  );

  const framework: Framework = frameworkResponse.framework || 'sdk';

  // Server mode selection
  const templateTypeResponse = await prompts(
    {
      type: 'select',
      name: 'templateType',
      message: 'Server mode:',
      choices: [
        { title: 'Stateless', value: 'stateless', description: 'Simple HTTP server' },
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

  // OAuth prompt - only for SDK stateful template
  let withOAuth = false;
  if (framework === 'sdk' && templateType === 'stateful') {
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

  // Git init prompt
  const gitInitResponse = await prompts(
    {
      type: 'confirm',
      name: 'withGitInit',
      message: 'Initialize git repository?',
      initial: true,
    },
    { onCancel }
  );
  const withGitInit = gitInitResponse.withGitInit ?? false;

  const templateOptions: ExtendedTemplateOptions = {
    withOAuth,
    packageManager,
    framework,
    stateless: templateType === 'stateless',
  };

  const projectPath = join(process.cwd(), projectName);
  const srcPath = join(projectPath, 'src');

  try {
    // Create directories
    await mkdir(srcPath, { recursive: true });

    // Build list of files to write
    const filesToWrite: Promise<void>[] = [];

    if (framework === 'fastmcp') {
      // FastMCP templates
      filesToWrite.push(
        writeFile(
          join(srcPath, 'server.ts'),
          fastmcpTemplateFunctions.getServerTemplate(projectName)
        ),
        writeFile(
          join(srcPath, 'index.ts'),
          fastmcpTemplateFunctions.getIndexTemplate(templateOptions)
        ),
        writeFile(
          join(projectPath, 'README.md'),
          fastmcpTemplateFunctions.getReadmeTemplate(projectName, templateOptions)
        )
      );
    } else {
      // SDK templates
      const templates = sdkTemplateFunctions[templateType];
      filesToWrite.push(
        writeFile(join(srcPath, 'server.ts'), templates.getServerTemplate(projectName)),
        writeFile(join(srcPath, 'index.ts'), templates.getIndexTemplate(templateOptions)),
        writeFile(
          join(projectPath, 'README.md'),
          templates.getReadmeTemplate(projectName, templateOptions)
        )
      );

      // Conditionally add auth.ts for OAuth-enabled stateful template
      if (withOAuth && templates.getAuthTemplate) {
        filesToWrite.push(writeFile(join(srcPath, 'auth.ts'), templates.getAuthTemplate()));
      }
    }

    // Common files for all templates
    filesToWrite.push(
      writeFile(
        join(projectPath, 'package.json'),
        getPackageJsonTemplate(projectName, templateOptions)
      ),
      writeFile(join(projectPath, 'tsconfig.json'), getTsconfigTemplate()),
      writeFile(join(projectPath, '.gitignore'), getGitignoreTemplate()),
      writeFile(join(projectPath, '.env.example'), getEnvExampleTemplate(templateOptions))
    );

    // Write all template files
    await Promise.all(filesToWrite);

    // Initialize git repository if requested
    if (withGitInit) {
      try {
        execSync('git init', { cwd: projectPath, stdio: 'ignore' });
      } catch {
        console.log('\n⚠️  Could not initialize git repository (is git installed?)');
      }
    }

    const commands = packageManagerCommands[packageManager];
    const frameworkName = framework === 'fastmcp' ? 'FastMCP' : 'MCP SDK';

    console.log(`\n✅ Created ${projectName} with ${frameworkName} at ${projectPath}`);
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
