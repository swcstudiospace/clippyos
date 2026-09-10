/**
 * The upstream identity providers this app offers for sign-in via the Grok
 * auth broker. Published studio (os.swcstudio.space) and live preview both
 * render these broker Google/X buttons (`grok-google`, `grok-x`).
 *
 * Source of truth for BOTH the server (`server.ts`, one `genericOAuth` provider
 * per entry) and the client (`client.ts` / sign-in buttons). Kept in its own
 * dependency-free module so the client can import it without pulling the
 * server-only Better Auth instance (and `pg`) into the browser bundle.
 *
 * Each app federates to the shared **auth broker** (`GROK_AUTH_ISSUER`), which
 * holds the real Google/X secrets. The app never sees them — it only knows its
 * own per-app client id/secret and which upstream to ask the broker for (`idp`).
 *
 * To add an upstream (e.g. GitHub) once the broker supports it: add one entry
 * here (`{ providerId: "grok-github", idp: "github", label: "GitHub" }`). The
 * `providerId` is this app's local id and the OAuth callback path segment
 * (`/api/auth/oauth2/callback/<providerId>`); `idp` is the hint the broker
 * reads to pick the upstream (Better Auth's id for X is still `twitter`).
 */
export type GrokProvider = {
  /** This app's local provider id; also the callback path segment. */
  providerId: string;
  /** Upstream hint the broker forwards to (Better Auth social id). */
  idp: string;
  /** Human label for the sign-in button. */
  label: string;
};

export const GROK_PROVIDERS: readonly GrokProvider[] = [
  { providerId: "grok-google", idp: "google", label: "Google" },
  { providerId: "grok-x", idp: "twitter", label: "X" },
];

/** Booleans only — never include secrets. Filled by `loadSignInFlags`. */
export type SignInFlags = {
  googleConfigured: boolean;
  twitterConfigured: boolean;
  brokerConfigured: boolean;
};

/**
 * Login always shows Google and X. Native ids win when env creds exist;
 * otherwise the Grok broker when that client is live; otherwise native ids
 * still render so the buttons never vanish. Unconfigured native social
 * returns PROVIDER_NOT_FOUND (not an empty oauth2 404).
 */
export function loginSocialProviders(flags: SignInFlags): GrokProvider[] {
  const google: GrokProvider = flags.googleConfigured
    ? { providerId: "google", idp: "google", label: "Google" }
    : flags.brokerConfigured
      ? { providerId: "grok-google", idp: "google", label: "Google" }
      : { providerId: "google", idp: "google", label: "Google" };
  const x: GrokProvider = flags.twitterConfigured
    ? { providerId: "twitter", idp: "twitter", label: "X" }
    : flags.brokerConfigured
      ? { providerId: "grok-x", idp: "twitter", label: "X" }
      : { providerId: "twitter", idp: "twitter", label: "X" };
  return [google, x];
}
