export interface TemplateOptions {
  withOAuth?: boolean;
}

export function getEnvExampleTemplate(options?: TemplateOptions): string {
  const withOAuth = options?.withOAuth ?? false;

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
${oauthVars}`;
}
