import type { CommonTemplateOptions } from './types.js';

export function getEnvExampleTemplate(options?: CommonTemplateOptions): string {
  const withOAuth = options?.withOAuth ?? false;
  const isSdk = options?.framework === 'sdk' || !options?.framework;

  const allowedHostsVar = isSdk
    ? `
# Comma-separated list of additional allowed hosts (for deployment behind reverse proxies)
# ALLOWED_HOSTS=my-server.example.com,my-server.us-central1.run.app
`
    : '';

  const oauthVars = withOAuth
    ? `
# OAuth Configuration
# Issuer URL - your OAuth provider's base URL
# Examples:
#   Auth0: https://your-tenant.auth0.com
#   Keycloak: http://localhost:8080/realms/your-realm
OAUTH_ISSUER_URL=https://your-oauth-provider.com

# Audience - the API identifier (optional, but recommended)
# This should match the "aud" claim in your JWT tokens
OAUTH_AUDIENCE=https://your-mcp-server.com
`
    : '';

  return `PORT=3000
${allowedHostsVar}${oauthVars}`;
}
