/**
 * Resolve which Grok broker OAuth client this process should use.
 *
 * Grok Build injects a per-app client on publish. Live preview has no
 * injection, so it uses the shared grok_preview client (sandbox hosts only).
 * Published Vercel often has DATABASE_URL but no GROK_AUTH_* — without a
 * fallback, grokOAuthPlugin is null and Continue with Google 404s.
 *
 * Rule: a real GROK_AUTH_CLIENT_ID+SECRET (not grok_preview) always wins.
 * Otherwise fall back to grok_preview so genericOAuth can register
 * grok-google/grok-x, including when DATABASE_URL is set or the env
 * explicitly names grok_preview.
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

  return {
    clientId: PREVIEW_CLIENT_ID,
    clientSecret: PREVIEW_CLIENT_SECRET,
    usingPreviewClient: true,
  };
}
