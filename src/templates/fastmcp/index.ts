export interface TemplateOptions {
  withOAuth?: boolean;
  packageManager?: 'npm' | 'pnpm' | 'yarn';
  stateless?: boolean;
}

export function getIndexTemplate(options?: TemplateOptions): string {
  const stateless = options?.stateless ?? false;

  const statelessConfig = stateless ? '\n    stateless: true,' : '';

  return `import { server } from './server.js';

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
