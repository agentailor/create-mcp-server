# OAuth Setup Guide

This guide explains how OAuth authentication works in MCP servers created with the `--oauth` option.

## How Authentication Works

This server uses **standard OIDC (OpenID Connect)** for authentication. The process may need adaptation based on your OAuth provider.

## Server Requirements

The MCP server needs two environment variables:

| Variable           | Required | Description                    |
| ------------------ | -------- | ------------------------------ |
| `OAUTH_ISSUER_URL` | Yes      | Your OIDC provider's base URL  |
| `OAUTH_AUDIENCE`   | No       | Expected `aud` claim in tokens |

## What Happens at Startup

1. Server fetches OIDC discovery document from `{OAUTH_ISSUER_URL}/.well-known/openid-configuration`
2. Extracts `authorization_endpoint`, `token_endpoint`, and `jwks_uri`
3. Creates a JWKS verifier using the provider's public signing keys
4. Exposes OAuth metadata at `/.well-known/oauth-protected-resource` for MCP clients

If the discovery document or JWKS endpoint is unreachable, the server will fail to start with a descriptive error.

## Token Validation Process

When a client sends a request with `Authorization: Bearer <token>`:

1. Server verifies the token is a **JWT** (three base64-encoded parts separated by dots)
2. Validates the signature using the provider's public keys (JWKS)
3. Checks the `iss` (issuer) claim matches `OAUTH_ISSUER_URL`
4. Checks the `aud` (audience) claim if `OAUTH_AUDIENCE` is configured
5. Verifies the token has not expired (`exp` claim)

## Provider Requirements

Your OIDC provider must:

- Support OIDC discovery (`/.well-known/openid-configuration`)
- Expose a JWKS endpoint with public signing keys
- Issue **JWT access tokens** (not opaque tokens)
- Sign tokens with keys available in the JWKS

## Adapting to Your Provider

Different providers may require additional configuration:

- **Creating an "API" or "Resource Server"** - Some providers (like Auth0) only issue JWT access tokens when an audience/API is configured
- **Configuring an `audience` parameter** - Clients may need to include this when requesting tokens
- **Pre-registering OAuth clients** - If your provider doesn't support Dynamic Client Registration (DCR), clients must be manually registered

Consult your provider's documentation to configure these settings.

## Testing Your Setup

1. Start your MCP server:
   ```bash
   npm run dev
   ```

2. Check the OAuth metadata endpoint:
   ```bash
   curl http://localhost:3000/.well-known/oauth-protected-resource
   ```

3. Make an authenticated request with a valid token:
   ```bash
   curl -X POST http://localhost:3000/mcp \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}'
   ```

## Troubleshooting

### "Token is not a valid JWT format"

Your provider is returning opaque tokens instead of JWTs. Opaque tokens are short random strings that cannot be validated locally.

**Solution**: Configure your provider to issue JWT access tokens. This often requires:
- Creating an API/Resource Server in your provider's dashboard
- Including the `audience` parameter when requesting tokens

### "Failed to fetch OIDC discovery document"

The server cannot reach your OAuth provider's discovery endpoint.

**Check**:
- `OAUTH_ISSUER_URL` is correct
- The URL `{OAUTH_ISSUER_URL}/.well-known/openid-configuration` is accessible
- Your OAuth provider is running
- Network/firewall settings allow the connection

### "Failed to fetch JWKS"

The server cannot reach your provider's public key endpoint.

**Check**:
- The JWKS URI from the discovery document is accessible
- Network/firewall settings allow the connection

### "Token validation failed: issuer mismatch"

The `iss` claim in the token doesn't match `OAUTH_ISSUER_URL`.

**Check**:
- Some providers include a trailing slash, others don't
- Try adjusting `OAUTH_ISSUER_URL` to match exactly what the provider puts in tokens

### "Token validation failed: audience mismatch"

The `aud` claim in the token doesn't match `OAUTH_AUDIENCE`.

**Check**:
- The audience value configured in your provider
- If you don't need audience validation, remove `OAUTH_AUDIENCE` from your environment

### "Token expired"

The token's `exp` claim is in the past.

**Solution**: Request a new token from your OAuth provider.


## Resources

- [MCP Authorization](https://modelcontextprotocol.io/docs/tutorials/security/authorization)
- [OpenID Connect (OIDC) Discovery](https://openid.net/specs/openid-connect-discovery-1_0.html)