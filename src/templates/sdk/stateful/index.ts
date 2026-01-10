export type { SdkTemplateOptions as TemplateOptions } from '../../common/types.js';
import type { SdkTemplateOptions } from '../../common/types.js';

export function getIndexTemplate(options?: SdkTemplateOptions): string {
  const withOAuth = options?.withOAuth ?? false;

  const imports = withOAuth
    ? `import { type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { getServer } from './server.js';
import {
  setupAuthMetadataRouter,
  authMiddleware,
  getOAuthMetadataUrl,
  validateOAuthConfig,
} from './auth.js';`
    : `import { type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { getServer } from './server.js';`;

  const appSetup = `const app = createMcpExpressApp();`;

  const postRoute = withOAuth
    ? `app.post('/mcp', authMiddleware, async (req: Request, res: Response) => {`
    : `app.post('/mcp', async (req: Request, res: Response) => {`;

  const getRoute = withOAuth
    ? `app.get('/mcp', authMiddleware, async (req: Request, res: Response) => {`
    : `app.get('/mcp', async (req: Request, res: Response) => {`;

  const deleteRoute = withOAuth
    ? `app.delete('/mcp', authMiddleware, async (req: Request, res: Response) => {`
    : `app.delete('/mcp', async (req: Request, res: Response) => {`;

  return `${imports}

${appSetup}

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

${postRoute}
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (sessionId) {
    console.log(\`Received MCP request for session: \${sessionId}\`);
  }

  try {
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New initialization request
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId: string) => {
          // Store the transport by session ID when session is initialized
          console.log(\`Session initialized with ID: \${sessionId}\`);
          transports[sessionId] = transport;
        },
      });

      // Set up onclose handler to clean up transport when closed
      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && transports[sid]) {
          console.log(\`Transport closed for session \${sid}, removing from transports map\`);
          delete transports[sid];
        }
      };

      // Connect the transport to the MCP server BEFORE handling the request
      const server = getServer();
      await server.connect(transport);

      await transport.handleRequest(req, res, req.body);
      return;
    } else {
      // Invalid request - no session ID or not initialization request
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
      return;
    }

    // Handle the request with existing transport
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

${getRoute}
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  console.log(\`Establishing SSE stream for session \${sessionId}\`);
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
});

${deleteRoute}
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  console.log(\`Received session termination request for session \${sessionId}\`);

  try {
    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error('Error handling session termination:', error);
    if (!res.headersSent) {
      res.status(500).send('Error processing session termination');
    }
  }
});

${
  withOAuth
    ? `// Start the server
const PORT = process.env.PORT || 3000;

function startServer(port: number | string): void {
  const server = app.listen(port, () => {
    console.log(\`MCP Stateful HTTP Server listening on port \${port}\`);
    console.log(\`OAuth metadata available at \${getOAuthMetadataUrl()}\`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      const randomPort = Math.floor(Math.random() * (65535 - 49152) + 49152);
      console.log(\`Port \${port} is in use, trying port \${randomPort}...\`);
      startServer(randomPort);
    } else {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  });
}

async function main() {
  // Validate OAuth configuration and fetch OIDC discovery document
  await validateOAuthConfig();

  // Setup OAuth metadata routes (must be after validateOAuthConfig)
  setupAuthMetadataRouter(app);

  startServer(PORT);
}

main().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});`
    : `// Start the server
const PORT = process.env.PORT || 3000;

function startServer(port: number | string): void {
  const server = app.listen(port, () => {
    console.log(\`MCP Stateful HTTP Server listening on port \${port}\`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      const randomPort = Math.floor(Math.random() * (65535 - 49152) + 49152);
      console.log(\`Port \${port} is in use, trying port \${randomPort}...\`);
      startServer(randomPort);
    } else {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  });
}

startServer(PORT);`
}

// Handle server shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');

  // Close all active transports to properly clean up resources
  for (const sessionId in transports) {
    try {
      console.log(\`Closing transport for session \${sessionId}\`);
      await transports[sessionId].close();
      delete transports[sessionId];
    } catch (error) {
      console.error(\`Error closing transport for session \${sessionId}:\`, error);
    }
  }
  console.log('Server shutdown complete');
  process.exit(0);
});
`;
}

export { getServerTemplate } from './server.js';
export { getReadmeTemplate } from './readme.js';
export { getAuthTemplate } from './auth.js';
