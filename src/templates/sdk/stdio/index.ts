export type { SdkTemplateOptions as TemplateOptions } from '../../common/types.js';
import type { SdkTemplateOptions } from '../../common/types.js';

// Options parameter kept for type consistency with other SDK templates
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getIndexTemplate(_options?: SdkTemplateOptions): string {
  return `import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getServer } from './server.js';

async function main() {
  const server = getServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
`;
}

export { getServerTemplate } from './server.js';
export { getReadmeTemplate } from './readme.js';
