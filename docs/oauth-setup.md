# OAuth Setup Guide

This guide explains how to configure OAuth authentication for MCP servers created with the `--oauth` option.

## Overview

The OAuth implementation uses JWKS (JSON Web Key Set) based JWT validation, which is the standard approach for OIDC-compliant providers. This means:

- Tokens are validated locally using public keys fetched from your OAuth provider
- No need for client credentials (client_id/client_secret) on the MCP server
- Works with any OIDC-compliant provider

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OAUTH_ISSUER_URL` | Yes | Base URL of your OAuth provider |
| `OAUTH_AUDIENCE` | No | API identifier / audience claim for token validation |

## Provider Setup

### Auth0

> **Important**: Auth0 returns **opaque tokens** by default. To get a JWT that this server can validate, you **must include the `audience` parameter** when requesting tokens.

#### 1. Create an API

1. Go to your Auth0 Dashboard > Applications > APIs
2. Click **Create API**
3. Fill in:
   - **Name**: Your MCP Server (e.g., "My MCP Server")
   - **Identifier**: A unique URI (e.g., `https://my-mcp-server.com`) - this becomes your audience
   - **Signing Algorithm**: RS256 (default)
4. Click **Create**

#### 2. Configure Environment Variables

```bash
# Auth0 issuer URL format: https://{tenant}.auth0.com
OAUTH_ISSUER_URL=https://your-tenant.auth0.com

# The API Identifier you created - REQUIRED for Auth0
# Without this, Auth0 returns opaque tokens that cannot be validated
OAUTH_AUDIENCE=https://my-mcp-server.com
```

#### 3. Get Access Tokens

Your MCP clients will need to obtain tokens from Auth0. **The `audience` parameter is critical** - without it, Auth0 returns opaque tokens instead of JWTs.

Example using the client credentials flow:

```bash
curl --request POST \
  --url https://your-tenant.auth0.com/oauth/token \
  --header 'content-type: application/json' \
  --data '{
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "audience": "https://my-mcp-server.com",
    "grant_type": "client_credentials"
  }'
```

**Verify you have a JWT**: The response should contain an `access_token` with three parts separated by dots (e.g., `eyJhbGc...eyJpc3M...signature`). If it's a short random string, you're getting an opaque token - make sure you included the `audience` parameter.

---

### Keycloak

#### 1. Create a Realm (if needed)

1. Log in to Keycloak Admin Console
2. Click the dropdown in the top-left and select **Create Realm**
3. Enter a realm name (e.g., `mcp-realm`)
4. Click **Create**

#### 2. Create a Client

1. Go to **Clients** > **Create client**
2. Fill in:
   - **Client type**: OpenID Connect
   - **Client ID**: `mcp-client` (or your preferred name)
3. Click **Next**
4. Configure capability:
   - **Client authentication**: On (for confidential clients) or Off (for public clients)
   - **Authorization**: Off (unless you need fine-grained permissions)
5. Click **Save**

#### 3. Configure Environment Variables

```bash
# Keycloak issuer URL format: http://{host}:{port}/realms/{realm}
OAUTH_ISSUER_URL=http://localhost:8080/realms/mcp-realm

# Optional: Set audience if your tokens include an 'aud' claim
OAUTH_AUDIENCE=account
```

#### 4. Get Access Tokens

Example using password grant (for testing):

```bash
curl --request POST \
  --url http://localhost:8080/realms/mcp-realm/protocol/openid-connect/token \
  --header 'content-type: application/x-www-form-urlencoded' \
  --data 'grant_type=password' \
  --data 'client_id=mcp-client' \
  --data 'username=YOUR_USERNAME' \
  --data 'password=YOUR_PASSWORD'
```

Or using client credentials:

```bash
curl --request POST \
  --url http://localhost:8080/realms/mcp-realm/protocol/openid-connect/token \
  --header 'content-type: application/x-www-form-urlencoded' \
  --data 'grant_type=client_credentials' \
  --data 'client_id=mcp-client' \
  --data 'client_secret=YOUR_CLIENT_SECRET'
```

---

### Azure AD / Entra ID

#### 1. Register an Application

1. Go to Azure Portal > Microsoft Entra ID > App registrations
2. Click **New registration**
3. Fill in:
   - **Name**: Your MCP Server
   - **Supported account types**: Choose based on your needs
4. Click **Register**

#### 2. Expose an API

1. Go to **Expose an API**
2. Click **Add** next to Application ID URI
3. Accept the default or enter a custom URI (e.g., `api://my-mcp-server`)
4. Add scopes if needed

#### 3. Configure Environment Variables

```bash
# Azure AD issuer URL format: https://login.microsoftonline.com/{tenant}/v2.0
OAUTH_ISSUER_URL=https://login.microsoftonline.com/your-tenant-id/v2.0

# The Application ID URI
OAUTH_AUDIENCE=api://my-mcp-server
```

---

### Okta

#### 1. Create an Authorization Server (or use default)

1. Go to Okta Admin Console > Security > API
2. Use the default authorization server or create a new one
3. Note the **Issuer URI**

#### 2. Create an Application

1. Go to Applications > Create App Integration
2. Select **API Services** for machine-to-machine
3. Fill in the application name
4. Click **Save**

#### 3. Configure Environment Variables

```bash
# Okta issuer URL format: https://{domain}.okta.com/oauth2/default
# Or for custom authorization server: https://{domain}.okta.com/oauth2/{server-id}
OAUTH_ISSUER_URL=https://your-domain.okta.com/oauth2/default

# Optional: The audience configured in your authorization server
OAUTH_AUDIENCE=api://default
```

---

## How It Works

### Startup

1. The MCP server fetches the OIDC discovery document from `{OAUTH_ISSUER_URL}/.well-known/openid-configuration`
2. From this document, it extracts the correct `authorization_endpoint` and `token_endpoint` for your provider
3. It also fetches the public keys from `{OAUTH_ISSUER_URL}/.well-known/jwks.json`

This automatic discovery ensures the server works with any OIDC-compliant provider without hardcoding provider-specific endpoints.

### Token Validation

1. **Request**: Client sends a request with `Authorization: Bearer <token>` header
2. **Validation**: The server:
   - Decodes the JWT
   - Verifies the signature using the cached public keys
   - Validates the `iss` (issuer) claim matches `OAUTH_ISSUER_URL`
   - Validates the `aud` (audience) claim if `OAUTH_AUDIENCE` is set
   - Checks the token hasn't expired

## Testing Your Setup

1. Start your MCP server:
   ```bash
   npm run dev
   ```

2. Check the OAuth metadata endpoint:
   ```bash
   curl http://localhost:3000/.well-known/oauth-protected-resource
   ```

3. Make an authenticated request:
   ```bash
   curl -X POST http://localhost:3000/mcp \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}'
   ```

## Troubleshooting

### "Invalid Compact JWS" or "Token is not a valid JWT format"

This error means the token is not a JWT. Common causes:

- **Auth0**: You're receiving an opaque token instead of a JWT. Make sure to include the `audience` parameter when requesting the token. The audience must match an API you've created in Auth0.
- **Token format**: A valid JWT has three parts separated by dots: `header.payload.signature`. If your token is a short random string, it's not a JWT.

**Solution for Auth0**: Always include `"audience": "YOUR_API_IDENTIFIER"` in your token request.

### "Failed to fetch OIDC discovery document"

This error occurs at startup when the server can't reach your OAuth provider:

- Verify `OAUTH_ISSUER_URL` is correct
- Check that `{OAUTH_ISSUER_URL}/.well-known/openid-configuration` is accessible
- Ensure your OAuth server is running
- Check network/firewall settings

### "Failed to fetch JWKS"

- Verify `OAUTH_ISSUER_URL` is correct and accessible
- Check that `{OAUTH_ISSUER_URL}/.well-known/jwks.json` returns valid JSON
- Ensure there are no network/firewall issues

### "Token validation failed: issuer mismatch"

- The `iss` claim in your token doesn't match `OAUTH_ISSUER_URL`
- Some providers add a trailing slash; try with or without it

### "Token validation failed: audience mismatch"

- The `aud` claim in your token doesn't match `OAUTH_AUDIENCE`
- Check the audience configuration in your OAuth provider
- If you don't need audience validation, remove `OAUTH_AUDIENCE` from your environment

### "Token expired"

- The token's `exp` claim is in the past
- Request a new token from your OAuth provider
