import { Command, Option, InvalidArgumentError } from 'commander';
import type { PackageManager, TransportType } from './templates/common/types.js';

export interface CLIOptions {
  name: string;
  packageManager: PackageManager;
  transport: TransportType;
  oauth: boolean;
  git: boolean;
  skills: boolean;
}

export interface ParseResult {
  mode: 'interactive' | 'cli';
  options?: CLIOptions;
}

const NAME_REGEX = /^[a-z0-9-_]+$/i;
const VERSION = '0.10.0';

export const FASTMCP_REMOVED_MESSAGE = [
  'FastMCP support was removed in 0.10.0. New projects use the Official MCP SDK;',
  'drop --framework, or pass --framework=sdk.',
  'To scaffold a FastMCP project, pin the last release that supports it:',
  '  npx @agentailor/create-mcp-server@0.9 --framework=fastmcp',
].join('\n');

export const TEMPLATE_DEPRECATED_MESSAGE =
  '--template is deprecated and has no effect: stateless and stateful generate the same project. ' +
  'It will be removed in a future release; drop it from your command.';

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
    // Only one framework remains. The flag is still parsed so existing
    // `--framework=sdk` invocations keep working, and so `fastmcp` gets a
    // removal message instead of Commander's generic invalid-choice error.
    .addOption(
      new Option(
        '-f, --framework <framework>',
        'Framework (sdk only; accepted for compatibility)'
      ).default('sdk')
    )
    // Deprecated: SDK v2 serves every HTTP request the same way, so both values
    // generate the same project. Still parsed so existing scripts get a warning
    // rather than Commander's unknown-option error.
    .addOption(
      new Option('-t, --template <type>', 'Deprecated; has no effect')
        .choices(['stateless', 'stateful'])
        .hideHelp()
    )
    .option('--stdio', 'Use stdio transport instead of HTTP', false)
    .option('--oauth', 'Enable OAuth authentication (sdk HTTP only)', false)
    .option('--no-git', 'Skip git repository initialization')
    .option('--no-skills', 'Skip adding the tool-design skill');

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

  // Checked before --name, so a FastMCP user sees why rather than a missing-name error.
  if (opts.framework === 'fastmcp') {
    console.error(`\nError: ${FASTMCP_REMOVED_MESSAGE}\n`);
    process.exit(1);
  }

  if (opts.framework !== 'sdk') {
    console.error(`\nError: unknown --framework "${opts.framework}". The only framework is sdk.\n`);
    process.exit(1);
  }

  // CLI mode - validate required args
  if (!opts.name) {
    console.error('\nError: --name is required when using CLI arguments\n');
    console.error('Usage: create-mcp-server --name=my-server [options]\n');
    console.error('Run with --help for all options.\n');
    process.exit(1);
  }

  // Validate stdio constraints
  if (opts.stdio && opts.oauth) {
    console.error('\nError: --stdio cannot be combined with --oauth\n');
    process.exit(1);
  }

  if (opts.template !== undefined) {
    console.warn(`\nWarning: ${TEMPLATE_DEPRECATED_MESSAGE}\n`);
  }

  return {
    mode: 'cli',
    options: {
      name: opts.name,
      packageManager: opts.packageManager as PackageManager,
      transport: (opts.stdio ? 'stdio' : 'http') as TransportType,
      oauth: opts.oauth,
      git: opts.git, // Commander handles --no-git -> git: false
      skills: opts.skills, // Commander handles --no-skills -> skills: false
    },
  };
}
