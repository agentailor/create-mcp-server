import type { Framework } from './templates/common/types.js';

// FastMCP is still on SDK v1 and the 2025-era protocol, and generated FastMCP
// projects ship without tests. It still works, but is on its way out.
export const FASTMCP_DEPRECATION_WARNING = [
  'Warning: the FastMCP framework is deprecated and will be removed in a future release.',
  'FastMCP projects stay on MCP SDK v1 and ship without tests. New projects should use',
  'the default Official MCP SDK (--framework=sdk). Pin @agentailor/create-mcp-server@0.9',
  'if you need to keep scaffolding FastMCP projects after it is removed.',
].join('\n  ');

/**
 * Prints a deprecation warning for the chosen framework, if it has one.
 * Writes to stderr so it never mixes with output a script might parse.
 */
export function warnIfDeprecated(framework: Framework): void {
  if (framework === 'fastmcp') {
    console.warn(`\n  ${FASTMCP_DEPRECATION_WARNING}\n`);
  }
}
