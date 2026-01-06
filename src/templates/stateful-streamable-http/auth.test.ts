import { describe, it, expect } from 'vitest';
import { getAuthTemplate } from './auth.js';

describe('auth template', () => {
  describe('getAuthTemplate', () => {
    it('should include OAuth configuration from environment variables', () => {
      const template = getAuthTemplate();
      expect(template).toContain('OAUTH_ISSUER_URL');
      expect(template).toContain('OAUTH_AUDIENCE');
    });

    it('should include dotenv import', () => {
      const template = getAuthTemplate();
      expect(template).toContain("import 'dotenv/config'");
    });

    it('should import jose for JWT verification', () => {
      const template = getAuthTemplate();
      expect(template).toContain("from 'jose'");
      expect(template).toContain('createRemoteJWKSet');
      expect(template).toContain('jwtVerify');
    });

    it('should use SDK auth imports', () => {
      const template = getAuthTemplate();
      expect(template).toContain("from '@modelcontextprotocol/sdk/server/auth/router.js'");
      expect(template).toContain(
        "from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js'"
      );
      expect(template).toContain("from '@modelcontextprotocol/sdk/shared/auth.js'");
    });

    it('should export setupAuthMetadataRouter function', () => {
      const template = getAuthTemplate();
      expect(template).toContain('export function setupAuthMetadataRouter');
      expect(template).toContain('mcpAuthMetadataRouter');
    });

    it('should export authMiddleware', () => {
      const template = getAuthTemplate();
      expect(template).toContain('export const authMiddleware');
      expect(template).toContain('requireBearerAuth');
    });

    it('should export getOAuthMetadataUrl helper', () => {
      const template = getAuthTemplate();
      expect(template).toContain('export function getOAuthMetadataUrl');
      expect(template).toContain('getOAuthProtectedResourceMetadataUrl');
    });

    it('should include token verifier using JWKS/JWT', () => {
      const template = getAuthTemplate();
      expect(template).toContain('tokenVerifier');
      expect(template).toContain('verifyAccessToken');
      expect(template).toContain('jwtVerify(token, JWKS');
    });

    it('should create remote JWKS from discovery document jwks_uri', () => {
      const template = getAuthTemplate();
      expect(template).toContain('createRemoteJWKSet');
      expect(template).toContain('discovery.jwks_uri');
      expect(template).toContain('JWKS = createRemoteJWKSet');
    });

    it('should validate issuer and audience claims', () => {
      const template = getAuthTemplate();
      expect(template).toContain('issuer:');
      expect(template).toContain('audience:');
    });

    it('should use Express types', () => {
      const template = getAuthTemplate();
      expect(template).toContain("from 'express'");
      expect(template).toContain('Express');
      expect(template).toContain('RequestHandler');
    });

    it('should export validateOAuthConfig function', () => {
      const template = getAuthTemplate();
      expect(template).toContain('export async function validateOAuthConfig');
    });

    it('should check well-known endpoint for OAuth server availability', () => {
      const template = getAuthTemplate();
      expect(template).toContain('.well-known/openid-configuration');
    });

    it('should throw detailed error when OIDC discovery fails', () => {
      const template = getAuthTemplate();
      expect(template).toContain('Failed to fetch OIDC discovery document');
      expect(template).toContain('OAUTH_ISSUER_URL environment variable');
      expect(template).toContain('OAuth server is running and accessible');
    });

    it('should fetch OAuth metadata from OIDC discovery endpoint', () => {
      const template = getAuthTemplate();
      expect(template).toContain('OIDCDiscoveryDocument');
      expect(template).toContain('authorization_endpoint');
      expect(template).toContain('token_endpoint');
      expect(template).toContain('oauthMetadata = {');
    });

    it('should use timeout for OAuth server validation requests', () => {
      const template = getAuthTemplate();
      expect(template).toContain('AbortSignal.timeout(5000)');
    });

    it('should extract client ID from JWT claims', () => {
      const template = getAuthTemplate();
      expect(template).toContain('azp');
      expect(template).toContain('client_id');
      expect(template).toContain('sub');
    });

    it('should extract scopes from JWT scope claim', () => {
      const template = getAuthTemplate();
      expect(template).toContain("jwtPayload.scope.split(' ')");
    });
  });
});
