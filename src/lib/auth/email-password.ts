/**
 * Local email/password sign-in (this app's Better Auth DB — not the broker).
 *
 * Off by default. To enable: set `emailAndPasswordEnabled` to `true` below,
 * then build sign-up / sign-in forms with `authClient.signUp.email` /
 * `authClient.signIn.email` from `@/lib/auth/client` (see the auth skill).
 *
 * Do NOT edit `server.ts` for this — that file is frozen pre-wired config.
 */
export const emailAndPasswordEnabled = true;

const DEFAULT_OWNER_EMAIL = "oveshen.govender@gmail.com";

/** Client-safe check: owner addresses must not self-register via public signup. */
export function isReservedOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === DEFAULT_OWNER_EMAIL) return true;
  const extra = String(import.meta.env.VITE_OWNER_EMAIL ?? "")
    .trim()
    .toLowerCase();
  return extra.length > 0 && extra === normalized;
}
