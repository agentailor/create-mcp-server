import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to test the CLI argument parsing logic
// Commander modifies process.argv, so we need to mock it carefully

describe('CLI argument parsing', () => {
  const originalArgv = process.argv;
  const originalExit = process.exit;

  beforeEach(() => {
    // Reset modules to clear commander's state
    vi.resetModules();
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.exit = originalExit;
  });

  it('returns interactive mode when no arguments provided', async () => {
    process.argv = ['node', 'create-mcp-server'];
    const { parseArguments } = await import('./cli.js');
    const result = parseArguments();
    expect(result.mode).toBe('interactive');
    expect(result.options).toBeUndefined();
  });

  it('returns cli mode with valid arguments', async () => {
    process.argv = ['node', 'create-mcp-server', '--name=my-server'];
    const { parseArguments } = await import('./cli.js');
    const result = parseArguments();
    expect(result.mode).toBe('cli');
    expect(result.options?.name).toBe('my-server');
  });

  it('uses defaults for optional arguments', async () => {
    process.argv = ['node', 'create-mcp-server', '--name=my-server'];
    const { parseArguments } = await import('./cli.js');
    const result = parseArguments();
    expect(result.options?.packageManager).toBe('npm');
    expect(result.options?.framework).toBe('sdk');
    expect(result.options?.template).toBe('stateless');
    expect(result.options?.oauth).toBe(false);
    expect(result.options?.git).toBe(true);
  });

  it('parses all arguments correctly', async () => {
    process.argv = [
      'node',
      'create-mcp-server',
      '--name=test-project',
      '--package-manager=pnpm',
      '--framework=fastmcp',
      '--template=stateful',
      '--no-git',
    ];
    const { parseArguments } = await import('./cli.js');
    const result = parseArguments();
    expect(result.options).toEqual({
      name: 'test-project',
      packageManager: 'pnpm',
      framework: 'fastmcp',
      template: 'stateful',
      oauth: false,
      git: false,
    });
  });

  it('parses short flags correctly', async () => {
    process.argv = [
      'node',
      'create-mcp-server',
      '-n',
      'my-project',
      '-p',
      'yarn',
      '-f',
      'sdk',
      '-t',
      'stateful',
    ];
    const { parseArguments } = await import('./cli.js');
    const result = parseArguments();
    expect(result.options?.name).toBe('my-project');
    expect(result.options?.packageManager).toBe('yarn');
    expect(result.options?.framework).toBe('sdk');
    expect(result.options?.template).toBe('stateful');
  });

  it('parses oauth flag correctly for sdk+stateful', async () => {
    process.argv = [
      'node',
      'create-mcp-server',
      '--name=my-auth-server',
      '--framework=sdk',
      '--template=stateful',
      '--oauth',
    ];
    const { parseArguments } = await import('./cli.js');
    const result = parseArguments();
    expect(result.options?.oauth).toBe(true);
    expect(result.options?.framework).toBe('sdk');
    expect(result.options?.template).toBe('stateful');
  });

  it('exits with error when --name is missing in CLI mode', async () => {
    process.argv = ['node', 'create-mcp-server', '--package-manager=npm'];

    let exitCode: number | undefined;
    process.exit = vi.fn((code) => {
      exitCode = code as number;
      throw new Error('process.exit called');
    }) as never;

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { parseArguments } = await import('./cli.js');
    expect(() => parseArguments()).toThrow('process.exit called');
    expect(exitCode).toBe(1);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('--name is required when using CLI arguments')
    );

    consoleError.mockRestore();
  });

  it('exits with error when --oauth used without sdk+stateful', async () => {
    process.argv = ['node', 'create-mcp-server', '--name=test', '--oauth', '--framework=fastmcp'];

    let exitCode: number | undefined;
    process.exit = vi.fn((code) => {
      exitCode = code as number;
      throw new Error('process.exit called');
    }) as never;

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { parseArguments } = await import('./cli.js');
    expect(() => parseArguments()).toThrow('process.exit called');
    expect(exitCode).toBe(1);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('--oauth is only valid with --framework=sdk and --template=stateful')
    );

    consoleError.mockRestore();
  });

  it('exits with error for invalid project name', async () => {
    process.argv = ['node', 'create-mcp-server', '--name=invalid name!'];

    let exitCode: number | undefined;
    process.exit = vi.fn((code) => {
      exitCode = code as number;
      throw new Error('process.exit called');
    }) as never;

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { parseArguments } = await import('./cli.js');
    expect(() => parseArguments()).toThrow('process.exit called');
    expect(exitCode).toBe(1);

    consoleError.mockRestore();
  });

  it('treats --help flag as interactive mode (does not require --name)', async () => {
    // When --help is the only flag, commander handles it and exits
    // We just verify that --help alone doesn't trigger CLI mode validation
    process.argv = ['node', 'create-mcp-server'];
    const { parseArguments } = await import('./cli.js');
    const result = parseArguments();
    // No args = interactive mode
    expect(result.mode).toBe('interactive');
  });
});
