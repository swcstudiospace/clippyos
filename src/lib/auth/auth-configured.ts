/**
 * Whether this app should treat Better Auth as live (sessions, requireUserId).
 *
 * Broker OAuth, native Google, and email/password each independently count as
 * configured. VITE_AUTH_ENABLED=false still forces auth off.
 */
export function isAuthConfigured({
  authDisabled,
  grokBroker,
  googleSocial,
  twitterSocial = false,
  emailPassword,
}: {
  authDisabled: boolean;
  grokBroker: boolean;
  googleSocial: boolean;
  twitterSocial?: boolean;
  emailPassword: boolean;
}): boolean {
  if (authDisabled) return false;
  return grokBroker || googleSocial || twitterSocial || emailPassword;
}
