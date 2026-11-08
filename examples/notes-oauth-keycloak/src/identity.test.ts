import { describe, it, expect } from 'vitest';
import type { ServerContext } from '@modelcontextprotocol/server';
import { callerFrom, LOCAL_OWNER } from './identity.js';

// example: added. Only the http.authInfo part of the context matters here.
function ctxWith(authInfo?: unknown): ServerContext {
  return { http: authInfo ? { authInfo } : undefined } as unknown as ServerContext;
}

describe('callerFrom', () => {
  it('keys data by the token subject, not the OAuth client', () => {
    // Two people signing in through VS Code share a clientId; only sub tells
    // them apart.
    const caller = callerFrom(
      ctxWith({
        token: 't',
        clientId: 'mcp-server-client',
        scopes: ['mcp:tools'],
        extra: { sub: 'user-123', username: 'alice' },
      })
    );

    expect(caller).toEqual({
      owner: 'user-123',
      username: 'alice',
      clientId: 'mcp-server-client',
      scopes: ['mcp:tools'],
    });
  });

  it('falls back to a local owner when no HTTP request is behind the call', () => {
    expect(callerFrom(ctxWith()).owner).toBe(LOCAL_OWNER);
  });
});
