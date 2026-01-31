import prompts from 'prompts';
import type { PackageManager, Framework } from './templates/common/types.js';
import type { TemplateType } from './cli.js';
import { generateProject } from './project-generator.js';

export async function runInteractiveMode(): Promise<void> {
  console.log('\nCreate MCP Server\n');

  const onCancel = () => {
    console.log('\nOperation cancelled\n');
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
    console.log('\nProject name is required\n');
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

  await generateProject({
    projectName,
    packageManager,
    framework,
    templateType,
    withOAuth,
    withGitInit,
  });
}
