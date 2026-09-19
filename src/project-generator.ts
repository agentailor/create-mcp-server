import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { getPackageJsonTemplate } from './templates/common/package.json.js';
import { getTsconfigTemplate } from './templates/common/tsconfig.json.js';
import { getGitignoreTemplate } from './templates/common/gitignore.js';
import { getEnvExampleTemplate } from './templates/common/env.example.js';
import { getAgentsMdTemplate } from './templates/common/agents.md.js';
import { copySkill, SKILLS_UPDATE_COMMAND, SKILLS_INSTALL_HINT, SKILLS_DIR } from './skills.js';
import type {
  CommonTemplateOptions,
  Framework,
  PackageManager,
  TransportType,
} from './templates/common/types.js';
import {
  getServerTemplate as getSdkStatelessServerTemplate,
  getIndexTemplate as getSdkStatelessIndexTemplate,
  getReadmeTemplate as getSdkStatelessReadmeTemplate,
  getStoreTemplate as getSdkStoreTemplate,
  getToolsTemplate as getSdkToolsTemplate,
  getPromptsTemplate as getSdkPromptsTemplate,
  getResourcesTemplate as getSdkResourcesTemplate,
  getStoreTestTemplate as getSdkStoreTestTemplate,
  getServerTestTemplate as getSdkServerTestTemplate,
} from './templates/sdk/stateless/index.js';
import { getAuthTemplate as getSdkAuthTemplate } from './templates/sdk/stateful/index.js';
import {
  getServerTemplate as getFastMCPServerTemplate,
  getIndexTemplate as getFastMCPIndexTemplate,
  getReadmeTemplate as getFastMCPReadmeTemplate,
} from './templates/fastmcp/index.js';
import {
  getServerTemplate as getSdkStdioServerTemplate,
  getIndexTemplate as getSdkStdioIndexTemplate,
  getReadmeTemplate as getSdkStdioReadmeTemplate,
} from './templates/sdk/stdio/index.js';
import { getDockerfileTemplate, getDockerignoreTemplate } from './templates/deployment/index.js';
import type { TemplateType } from './cli.js';

// Auth is keyed off `withOAuth`, never off the template type - see
// "Why stateless and stateful are identical" in AGENTS.md.
const sdkHttpTemplateFunctions = {
  getServerTemplate: getSdkStatelessServerTemplate,
  getIndexTemplate: getSdkStatelessIndexTemplate,
  getReadmeTemplate: getSdkStatelessReadmeTemplate,
  getAuthTemplate: getSdkAuthTemplate,
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
  transport: TransportType;
  templateType: TemplateType;
  withOAuth: boolean;
  withGitInit: boolean;
  withSkills: boolean;
}

export async function generateProject(config: ProjectConfig): Promise<void> {
  const {
    projectName,
    packageManager,
    framework,
    transport,
    templateType,
    withOAuth,
    withGitInit,
    withSkills,
  } = config;

  const templateOptions: CommonTemplateOptions = {
    withOAuth: transport === 'http' ? withOAuth : false,
    packageManager,
    framework,
    stateless: transport === 'stdio' ? true : templateType === 'stateless',
    transport,
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
  } else if (transport === 'stdio') {
    // SDK stdio templates
    filesToWrite.push(
      writeFile(join(srcPath, 'server.ts'), getSdkStdioServerTemplate(projectName)),
      writeFile(join(srcPath, 'index.ts'), getSdkStdioIndexTemplate(templateOptions)),
      writeFile(
        join(projectPath, 'README.md'),
        getSdkStdioReadmeTemplate(projectName, templateOptions)
      )
    );
  } else {
    const templates = sdkHttpTemplateFunctions;
    filesToWrite.push(
      writeFile(join(srcPath, 'server.ts'), templates.getServerTemplate(projectName)),
      writeFile(join(srcPath, 'index.ts'), templates.getIndexTemplate(templateOptions)),
      writeFile(
        join(projectPath, 'README.md'),
        templates.getReadmeTemplate(projectName, templateOptions)
      )
    );

    if (withOAuth) {
      filesToWrite.push(writeFile(join(srcPath, 'auth.ts'), templates.getAuthTemplate()));
    }
  }

  // server.ts only composes these; they are identical on both SDK transports.
  if (framework === 'sdk') {
    filesToWrite.push(
      writeFile(join(srcPath, 'tools.ts'), getSdkToolsTemplate()),
      writeFile(join(srcPath, 'prompts.ts'), getSdkPromptsTemplate()),
      writeFile(join(srcPath, 'resources.ts'), getSdkResourcesTemplate()),
      writeFile(join(srcPath, 'notes-store.ts'), getSdkStoreTemplate()),
      // Two layers: the store in isolation, and the payload an agent reads.
      writeFile(join(srcPath, 'notes-store.test.ts'), getSdkStoreTestTemplate()),
      writeFile(join(srcPath, 'server.test.ts'), getSdkServerTestTemplate())
    );
  }

  // Common files for all templates
  filesToWrite.push(
    writeFile(
      join(projectPath, 'package.json'),
      getPackageJsonTemplate(projectName, templateOptions)
    ),
    writeFile(
      join(projectPath, 'tsconfig.json'),
      getTsconfigTemplate({ withTests: framework === 'sdk' })
    ),
    writeFile(join(projectPath, '.gitignore'), getGitignoreTemplate()),
    writeFile(join(projectPath, '.env.example'), getEnvExampleTemplate(templateOptions)),
    writeFile(join(projectPath, 'AGENTS.md'), getAgentsMdTemplate(projectName, templateOptions))
  );

  // Deployment files for HTTP transport only (stdio servers are not HTTP services)
  if (transport === 'http') {
    filesToWrite.push(
      writeFile(join(projectPath, 'Dockerfile'), getDockerfileTemplate(templateOptions)),
      writeFile(join(projectPath, '.dockerignore'), getDockerignoreTemplate())
    );
  }

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

  // The skill is vendored, so this is a file copy. It never fails the scaffold:
  // the project is complete without it.
  let skillCopied = false;
  if (withSkills) {
    const result = await copySkill(projectPath);
    skillCopied = result.copied;

    if (!result.copied) {
      console.log(`\n  Could not add the tool-design skill (${result.reason}).`);
      console.log(`  To add it by hand: ${SKILLS_INSTALL_HINT}`);
    }
  }

  const commands = packageManagerCommands[packageManager];
  const frameworkName = framework === 'fastmcp' ? 'FastMCP' : 'MCP SDK';

  console.log(`\nCreated ${projectName} with ${frameworkName} (${transport}) at ${projectPath}`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${projectName}`);
  console.log(`  ${commands.install}`);
  console.log(`  ${commands.dev}`);
  if (skillCopied) {
    console.log(
      `\nThe tool-design skill is in ${SKILLS_DIR}/skills/. Check for a newer version with:`
    );
    console.log(`  ${SKILLS_UPDATE_COMMAND}`);
  }
  console.log(`\n`);
}
