/**
 * Resolve which Grok broker OAuth client this process should use.
 *
 * Grok Build injects a per-app client on publish. Live preview has no
 * injection, so it uses the shared grok_preview client (sandbox hosts only).
 *
 * Rule: a real GROK_AUTH_CLIENT_ID+SECRET (not grok_preview) always wins.
 * grok_preview is used only when DATABASE_URL is unset. A published process
 * without a real client returns clientId undefined so grokOAuthPlugin stays
 * off — grok_preview's allowed callbacks are *.grok-sandbox.com, which is
 * invalid_uri at auth.grok.me for production hosts.
 */
import { PREVIEW_CLIENT_ID, PREVIEW_CLIENT_SECRET } from "./preview";

export type GrokBrokerClient = {
  clientId: string | undefined;
  clientSecret: string | undefined;
  usingPreviewClient: boolean;
};

export function resolveGrokBrokerClient(
  env: Record<string, string | undefined> = typeof process !== "undefined" ? process.env : {},
): GrokBrokerClient {
  const id = env.GROK_AUTH_CLIENT_ID?.trim() || undefined;
  const secret = env.GROK_AUTH_CLIENT_SECRET?.trim() || undefined;
  if (id && secret && id !== PREVIEW_CLIENT_ID) {
    return { clientId: id, clientSecret: secret, usingPreviewClient: false };
  }

  const published = Boolean(env.DATABASE_URL?.trim());
  if (!published) {
    return {
      clientId: PREVIEW_CLIENT_ID,
      clientSecret: PREVIEW_CLIENT_SECRET,
      usingPreviewClient: true,
    };
  }

  return {
    clientId: undefined,
    clientSecret: undefined,
    usingPreviewClient: false,
  };
}
