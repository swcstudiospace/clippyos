/**
 * Resolve which Grok broker OAuth client this process should use.
 *
 * Grok Build injects a per-app client on publish. Live preview has no
 * injection, so it uses the shared grok_preview client (sandbox hosts only).
 * A GitHub/Vercel export that still falls back to grok_preview will send
 * custom-domain callbacks the broker always rejects.
 *
 * Rule: grok_preview is allowed only when there is no DATABASE_URL (PGLite
 * preview / local). Once Postgres is configured, this is a published app and
 * must use GROK_AUTH_CLIENT_ID / SECRET.
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
  if (published) {
    // Do not impersonate the sandbox client on a real database deploy.
    return { clientId: undefined, clientSecret: undefined, usingPreviewClient: false };
  }

  return {
    clientId: PREVIEW_CLIENT_ID,
    clientSecret: PREVIEW_CLIENT_SECRET,
    usingPreviewClient: true,
  };
}
