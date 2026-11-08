// example: added. Turns the validated token on the request into "who is calling".
//
// auth.ts puts the token's `sub` and `preferred_username` into AuthInfo.extra.
// requireBearerAuth stores AuthInfo on req.auth, and toNodeHandler hands it to
// every handler as ctx.http.authInfo.
import type { ServerContext } from '@modelcontextprotocol/server';

/** Owner used when there is no HTTP request behind the call (stdio, tests). */
export const LOCAL_OWNER = 'local';

export interface Caller {
  /** Stable key for this user's data: the token's `sub` claim. */
  owner: string;
  username?: string;
  /** The OAuth client the user signed in through, e.g. VS Code. */
  clientId?: string;
  scopes: string[];
}

export function callerFrom(ctx: ServerContext): Caller {
  const auth = ctx.http?.authInfo;
  const sub = auth?.extra?.sub;
  const username = auth?.extra?.username;

  return {
    owner: typeof sub === 'string' && sub.length > 0 ? sub : LOCAL_OWNER,
    username: typeof username === 'string' ? username : undefined,
    clientId: auth?.clientId,
    scopes: auth?.scopes ?? [],
  };
}
