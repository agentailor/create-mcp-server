export type { FastMCPTemplateOptions as TemplateOptions } from '../common/types.js';
import type { FastMCPTemplateOptions } from '../common/types.js';

export function getIndexTemplate(options?: FastMCPTemplateOptions): string {
  const stateless = options?.stateless ?? false;

  const statelessConfig = stateless ? '\n    stateless: true,' : '';

  return `
  import 'dotenv/config';
  import { server } from './server.js';

const PORT = Number(process.env.PORT) || 3000;

server.start({
  transportType: 'httpStream',
  httpStream: {
    port: PORT,${statelessConfig}
  },
});

console.log(\`MCP Server listening on port \${PORT}\`);
`;
}

export { getServerTemplate } from './server.js';
export { getReadmeTemplate } from './readme.js';
