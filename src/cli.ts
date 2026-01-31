import { Command, Option, InvalidArgumentError } from 'commander';
import type { PackageManager, Framework } from './templates/common/types.js';

export type TemplateType = 'stateless' | 'stateful';

export interface CLIOptions {
  name: string;
  packageManager: PackageManager;
  framework: Framework;
  template: TemplateType;
  oauth: boolean;
  git: boolean;
}

export interface ParseResult {
  mode: 'interactive' | 'cli';
  options?: CLIOptions;
}

const NAME_REGEX = /^[a-z0-9-_]+$/i;
const VERSION = '0.4.1';

function validateName(value: string): string {
  if (!NAME_REGEX.test(value)) {
    throw new InvalidArgumentError(
      'Project name can only contain letters, numbers, hyphens, and underscores'
    );
  }
  return value;
}

export function parseArguments(): ParseResult {
  const program = new Command();

  program
    .name('create-mcp-server')
    .description('Create a new MCP (Model Context Protocol) server project')
    .version(VERSION)
    .option('-n, --name <name>', 'Project name', validateName)
    .addOption(
      new Option('-p, --package-manager <manager>', 'Package manager')
        .choices(['npm', 'pnpm', 'yarn'])
        .default('npm')
    )
    .addOption(
      new Option('-f, --framework <framework>', 'Framework to use')
        .choices(['sdk', 'fastmcp'])
        .default('sdk')
    )
    .addOption(
      new Option('-t, --template <type>', 'Template type')
        .choices(['stateless', 'stateful'])
        .default('stateless')
    )
    .option('--oauth', 'Enable OAuth authentication (sdk+stateful only)', false)
    .option('--no-git', 'Skip git repository initialization');

  program.parse();

  const opts = program.opts();

  // Detect mode based on whether any option was explicitly provided
  // Check for CLI args (excluding node, script path, --help, --version)
  const cliArgs = process.argv.slice(2);
  const hasExplicitArgs = cliArgs.some(
    (arg) => arg.startsWith('-') && !['--help', '-h', '--version', '-V'].includes(arg)
  );

  if (!hasExplicitArgs) {
    return { mode: 'interactive' };
  }

  // CLI mode - validate required args
  if (!opts.name) {
    console.error('\nError: --name is required when using CLI arguments\n');
    console.error('Usage: create-mcp-server --name=my-server [options]\n');
    console.error('Run with --help for all options.\n');
    process.exit(1);
  }

  // Validate OAuth constraint
  if (opts.oauth && (opts.framework !== 'sdk' || opts.template !== 'stateful')) {
    console.error('\nError: --oauth is only valid with --framework=sdk and --template=stateful\n');
    process.exit(1);
  }

  return {
    mode: 'cli',
    options: {
      name: opts.name,
      packageManager: opts.packageManager as PackageManager,
      framework: opts.framework as Framework,
      template: opts.template as TemplateType,
      oauth: opts.oauth,
      git: opts.git, // Commander handles --no-git -> git: false
    },
  };
}
