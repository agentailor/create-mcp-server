import { describe, it, expect, vi, afterEach } from 'vitest';
import { warnIfDeprecated, FASTMCP_DEPRECATION_WARNING } from './deprecations.js';

describe('warnIfDeprecated', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('warns on stderr when FastMCP is chosen', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    warnIfDeprecated('fastmcp');

    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain(FASTMCP_DEPRECATION_WARNING);
    expect(log).not.toHaveBeenCalled();
  });

  it('points FastMCP users at the SDK and at a version to pin', () => {
    expect(FASTMCP_DEPRECATION_WARNING).toContain('--framework=sdk');
    expect(FASTMCP_DEPRECATION_WARNING).toContain('@agentailor/create-mcp-server@0.9');
  });

  it('stays silent for the SDK', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    warnIfDeprecated('sdk');

    expect(warn).not.toHaveBeenCalled();
  });
});
