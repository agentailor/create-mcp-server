import { config } from 'dotenv';
import { type Request, type Response } from 'express';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { createMcpExpressApp } from '@modelcontextprotocol/express';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { getServer } from './server.js';
import {
  setupAuthMetadataRouter,
  authMiddleware,
  getOAuthMetadataUrl,
  validateOAuthConfig,
} from './auth.js';

// quiet: dotenv >=18 logs a summary line on load; keep startup output clean.
config({ quiet: true });

const allowedHosts = process.env.ALLOWED_HOSTS?.split(',') ?? [];

const app = createMcpExpressApp({
  allowedHosts: ['localhost', '127.0.0.1', '[::1]', ...allowedHosts],
});

// Health check endpoint for container orchestration
app.get('/health', (_, res) => res.sendStatus(200));

// The factory runs once per request, so a fresh McpServer serves every call.
const handler = createMcpHandler(() => getServer());
const node = toNodeHandler(handler);

// The handler owns method dispatch (POST/GET/DELETE) for the MCP endpoint.
app.all('/mcp', authMiddleware, (req: Request, res: Response) => void node(req, res, req.body));

// Start the server
const PORT = process.env.PORT || 3000;

function startServer(port: number | string): void {
  const server = app.listen(port, () => {
    console.log(`MCP HTTP Server listening on port ${port}`);
    console.log(`OAuth metadata available at ${getOAuthMetadataUrl()}`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      const randomPort = Math.floor(Math.random() * (65535 - 49152) + 49152);
      console.log(`Port ${port} is in use, trying port ${randomPort}...`);
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
});

// Handle server shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  process.exit(0);
});
