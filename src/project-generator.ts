import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { getPackageJsonTemplate } from './templates/common/package.json.js';
import { getTsconfigTemplate } from './templates/common/tsconfig.json.js';
import { getGitignoreTemplate } from './templates/common/gitignore.js';
import { getEnvExampleTemplate } from './templates/common/env.example.js';
import type {
  CommonTemplateOptions,
  SdkTemplateOptions,
  Framework,
  PackageManager,
} from './templates/common/types.js';
import {
  getServerTemplate as getSdkStatelessServerTemplate,
  getIndexTemplate as getSdkStatelessIndexTemplate,
  getReadmeTemplate as getSdkStatelessReadmeTemplate,
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
import { getDockerfileTemplate, getDockerignoreTemplate } from './templates/deployment/index.js';
import type { TemplateType } from './cli.js';

const sdkTemplateFunctions: Record<
  TemplateType,
  {
    getServerTemplate: (projectName: string) => string;
    getIndexTemplate: (options?: SdkTemplateOptions) => string;
    getReadmeTemplate: (projectName: string, options?: SdkTemplateOptions) => string;
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

export const packageManagerCommands: Record<PackageManager, { install: string; dev: string }> = {
  npm: { install: 'npm install', dev: 'npm run dev' },
  pnpm: { install: 'pnpm install', dev: 'pnpm dev' },
  yarn: { install: 'yarn', dev: 'yarn dev' },
};

export interface ProjectConfig {
  projectName: string;
  packageManager: PackageManager;
  framework: Framework;
  templateType: TemplateType;
  withOAuth: boolean;
  withGitInit: boolean;
}

export async function generateProject(config: ProjectConfig): Promise<void> {
  const { projectName, packageManager, framework, templateType, withOAuth, withGitInit } = config;

  const templateOptions: CommonTemplateOptions = {
    withOAuth,
    packageManager,
    framework,
    stateless: templateType === 'stateless',
  };

  const projectPath = join(process.cwd(), projectName);
  const srcPath = join(projectPath, 'src');

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

  // Deployment files for all templates
  filesToWrite.push(
    writeFile(join(projectPath, 'Dockerfile'), getDockerfileTemplate(templateOptions)),
    writeFile(join(projectPath, '.dockerignore'), getDockerignoreTemplate())
  );

  // Write all template files
  await Promise.all(filesToWrite);

  // Initialize git repository if requested
  if (withGitInit) {
    try {
      execSync('git init', { cwd: projectPath, stdio: 'ignore' });
    } catch {
      console.log('\n  Could not initialize git repository (is git installed?)');
    }
  }

  const commands = packageManagerCommands[packageManager];
  const frameworkName = framework === 'fastmcp' ? 'FastMCP' : 'MCP SDK';

  console.log(`\nCreated ${projectName} with ${frameworkName} at ${projectPath}`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${projectName}`);
  console.log(`  ${commands.install}`);
  console.log(`  ${commands.dev}`);
  console.log(`\n`);
}
