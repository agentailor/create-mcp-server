#!/usr/bin/env node

import prompts from 'prompts';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function main() {
  console.log('\n🚀 Create MCP Server\n');

  const response = await prompts(
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
    {
      onCancel: () => {
        console.log('\n❌ Operation cancelled\n');
        process.exit(0);
      },
    }
  );

  const { projectName } = response;

  if (!projectName) {
    console.log('\n❌ Project name is required\n');
    process.exit(1);
  }

  const projectPath = join(process.cwd(), projectName);

  try {
    await mkdir(projectPath, { recursive: true });

    const readmeContent = `# ${projectName}

An MCP (Model Context Protocol) server.

## About

This project was created with [@agentailor/create-mcp-server](https://www.npmjs.com/package/@agentailor/create-mcp-server).

## Getting Started

Coming soon...

## Learn More

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
`;

    await writeFile(join(projectPath, 'README.md'), readmeContent);

    console.log(`\n✅ Created ${projectName} at ${projectPath}`);
    console.log(`\nNext steps:`);
    console.log(`  cd ${projectName}`);
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
