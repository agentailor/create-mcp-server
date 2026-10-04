import prompts from 'prompts';
import type { PackageManager, TransportType } from './templates/common/types.js';
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

  // Transport selection
  const transportResponse = await prompts(
    {
      type: 'select',
      name: 'transport',
      message: 'Transport:',
      choices: [
        {
          title: 'HTTP (Streamable HTTP)',
          value: 'http',
          description: 'Deploy as an HTTP server (recommended for remote access)',
        },
        {
          title: 'stdio',
          value: 'stdio',
          description: 'For local use with local clients like Claude Desktop',
        },
      ],
      initial: 0,
    },
    { onCancel }
  );

  const transport: TransportType = transportResponse.transport || 'http';

  // OAuth prompt - available for any SDK HTTP project
  let withOAuth = false;
  if (transport === 'http') {
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

  const skillsResponse = await prompts(
    {
      type: 'confirm',
      name: 'withSkills',
      message: 'Include the tool-design skill for AI agents?',
      initial: true,
    },
    { onCancel }
  );
  const withSkills = skillsResponse.withSkills ?? false;

  await generateProject({
    projectName,
    packageManager,
    transport,
    withOAuth,
    withGitInit,
    withSkills,
  });
}
