/**
 * Resolve native Better Auth Google credentials for the published studio origin.
 *
 * Live preview still federates through the Grok broker (`grok-google`).
 * Published deploys (os.swcstudio.space) use Better Auth `socialProviders.google`
 * when both id and secret are set. Missing or blank values degrade to null —
 * do not crash boot.
 *
 * AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET are accepted as aliases of
 * GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET. Never log these values.
 */
export type GoogleSocialCredentials = {
  clientId: string;
  clientSecret: string;
};

export function resolveGoogleSocial(
  env: Record<string, string | undefined> = typeof process !== "undefined" ? process.env : {},
): GoogleSocialCredentials | null {
  const clientId = env.GOOGLE_CLIENT_ID?.trim() || env.AUTH_GOOGLE_ID?.trim() || "";
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim() || env.AUTH_GOOGLE_SECRET?.trim() || "";
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

/**
 * True when a published deploy has a real Grok broker client (not grok_preview).
 * Used by the login page to offer grok-google / grok-x without importing
 * preview.ts or broker-client.ts into the client bundle.
 */
export function publishedBrokerConfigured(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const id = env.GROK_AUTH_CLIENT_ID?.trim() || "";
  const secret = env.GROK_AUTH_CLIENT_SECRET?.trim() || "";
  return Boolean(id && secret && id !== "grok_preview");
}
