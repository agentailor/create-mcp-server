export type { SdkTemplateOptions as TemplateOptions } from '../../common/types.js';
import type { SdkTemplateOptions } from '../../common/types.js';

// Options parameter kept for type consistency with other SDK templates
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getIndexTemplate(_options?: SdkTemplateOptions): string {
  return `import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { getServer } from './server.js';

// stdout is reserved for the MCP protocol - always log to stderr.
serveStdio(() => getServer());

console.error('MCP Server running on stdio');
`;
}

export { getServerTemplate } from './server.js';
export { getReadmeTemplate } from './readme.js';
