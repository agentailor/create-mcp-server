export function getAuthTemplate(): string {
  return `import 'dotenv/config';
import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from 'jose';
import {
  mcpAuthMetadataRouter,
  getOAuthProtectedResourceMetadataUrl,
} from '@modelcontextprotocol/sdk/server/auth/router.js';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import type { OAuthMetadata } from '@modelcontextprotocol/sdk/shared/auth.js';
import type { Express, RequestHandler } from 'express';

// OAuth configuration from environment variables
const CONFIG = {
  host: process.env.HOST || 'localhost',
  port: Number(process.env.PORT) || 3000,
  oauth: {
    issuerUrl: process.env.OAUTH_ISSUER_URL || 'http://localhost:8080',
    audience: process.env.OAUTH_AUDIENCE || '',
  },
};

// Ensure issuer URL doesn't have trailing slash for consistency
const normalizedIssuerUrl = CONFIG.oauth.issuerUrl.replace(/\\/$/, '');

const mcpServerUrl = new URL(\`http://\${CONFIG.host}:\${CONFIG.port}\`);

// OAuth metadata and JWKS fetched from OIDC discovery endpoint at startup
let oauthMetadata: OAuthMetadata | null = null;
let JWKS: JWTVerifyGetKey | null = null;

// Extended JWT payload type with common OAuth claims
interface OAuthJWTPayload extends JWTPayload {
  scope?: string;
  azp?: string;
  client_id?: string;
}

// OIDC Discovery document structure (partial)
interface OIDCDiscoveryDocument {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  response_types_supported?: string[];
}

// Token verifier using JWKS/JWT validation
const tokenVerifier = {
  verifyAccessToken: async (token: string) => {
    if (!JWKS) {
      throw new Error('JWKS not initialized. Call validateOAuthConfig() first.');
    }

    try {
      // Check if the token looks like a JWT (three base64url-encoded parts separated by dots)
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error(
          'Token is not a valid JWT format (expected 3 parts separated by dots). '
        );
      }

      const verifyOptions: { issuer: string; audience?: string } = {
        issuer: normalizedIssuerUrl,
      };

      // Only validate audience if configured
      if (CONFIG.oauth.audience) {
        verifyOptions.audience = CONFIG.oauth.audience;
      }

      const { payload } = await jwtVerify(token, JWKS, verifyOptions);
      const jwtPayload = payload as OAuthJWTPayload;

      return {
        token,
        // Use azp (authorized party), client_id, or sub as the client identifier
        clientId: jwtPayload.azp || jwtPayload.client_id || jwtPayload.sub || 'unknown',
        scopes: jwtPayload.scope ? jwtPayload.scope.split(' ') : [],
        expiresAt: jwtPayload.exp,
      };
    } catch (error) {
      if (error instanceof Error) {
        console.error('[auth] JWT verification failed:', error.message);
      }
      throw error;
    }
  },
};

// Setup OAuth metadata router on the Express app
// Must be called AFTER validateOAuthConfig() to ensure oauthMetadata is populated
export function setupAuthMetadataRouter(app: Express): void {
  if (!oauthMetadata) {
    throw new Error('OAuth metadata not initialized. Call validateOAuthConfig() first.');
  }
  app.use(
    mcpAuthMetadataRouter({
      oauthMetadata,
      resourceServerUrl: mcpServerUrl,
      scopesSupported: ['mcp:tools'],
      resourceName: 'MCP Server',
    })
  );
}

// Export auth middleware for protecting routes
export const authMiddleware: RequestHandler = requireBearerAuth({
  verifier: tokenVerifier,
  requiredScopes: [],
  resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(mcpServerUrl),
});

// Export for logging on startup
export function getOAuthMetadataUrl(): string {
  return getOAuthProtectedResourceMetadataUrl(mcpServerUrl).toString();
}

// Validate OAuth configuration and fetch OIDC discovery document at startup
export async function validateOAuthConfig(): Promise<void> {
  console.log(\`[auth] Validating OAuth configuration for issuer: \${normalizedIssuerUrl}\`);

  const wellKnownUrl = \`\${normalizedIssuerUrl}/.well-known/openid-configuration\`;

  // Fetch the OIDC discovery document to get the correct endpoints
  let discovery: OIDCDiscoveryDocument;
  try {
    const response = await fetch(wellKnownUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
    }

    discovery = (await response.json()) as OIDCDiscoveryDocument;
    console.log('[auth] Successfully fetched OIDC discovery document');

    // Build OAuth metadata from the discovery document
    oauthMetadata = {
      issuer: discovery.issuer,
      authorization_endpoint: discovery.authorization_endpoint,
      token_endpoint: discovery.token_endpoint,
      response_types_supported: discovery.response_types_supported || ['code'],
    };

    console.log(\`[auth] Authorization endpoint: \${discovery.authorization_endpoint}\`);
    console.log(\`[auth] Token endpoint: \${discovery.token_endpoint}\`);
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    const errorMessage = [
      'Failed to fetch OIDC discovery document',
      \`  Discovery URL: \${wellKnownUrl}\`,
      \`  Error: \${error.message}\`,
      '',
      'Please ensure:',
      '  1. The OAUTH_ISSUER_URL environment variable is correct',
      '  2. The OAuth server is running and accessible',
      '  3. The OAuth server supports OIDC discovery (.well-known/openid-configuration)',
      '  4. Network/firewall settings allow the connection',
    ].join('\\n');

    throw new Error(errorMessage);
  }

  // Create JWKS from the discovery document's jwks_uri
  const jwksUri = discovery.jwks_uri;
  console.log(\`[auth] JWKS URI: \${jwksUri}\`);
  JWKS = createRemoteJWKSet(new URL(jwksUri));

  // Verify the JWKS endpoint is accessible
  try {
    const jwksResponse = await fetch(jwksUri, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (!jwksResponse.ok) {
      throw new Error(\`HTTP \${jwksResponse.status}: \${jwksResponse.statusText}\`);
    }
    console.log('[auth] JWKS endpoint is accessible');
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    const errorMessage = [
      'Failed to fetch JWKS from OAuth server',
      \`  JWKS URI: \${jwksUri}\`,
      \`  Error: \${error.message}\`,
      '',
      'Please ensure the OAuth server is properly configured.',
    ].join('\\n');

    throw new Error(errorMessage);
  }

  console.log('[auth] OAuth configuration validated successfully');
}
`;
}
