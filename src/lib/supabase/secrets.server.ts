/** Server-only secret resolution. Never import from client modules. */

function looksRedacted(value: string): boolean {
  return /[•…]|\.{3}|YOUR_|changeme|placeholder/i.test(value);
}

/**
 * Project secret API key. Resolves from process env only (published host):
 * `SUPABASE_SECRET_KEY`, then `SUPABASE_SERVICE_ROLE_KEY` (README /
 * `.env.example` alias), or the `default` entry of a JSON-valued
 * `SUPABASE_SECRET_KEYS`. Never imported into a client bundle; never
 * hardcoded — operators set it in Vercel env vars or rotate there.
 */
export function getSupabaseSecret(): string | undefined {
  if (typeof process === "undefined") return undefined;
  const fromEnv = process.env.SUPABASE_SECRET_KEY?.trim();
  if (fromEnv && !looksRedacted(fromEnv)) return fromEnv;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serviceRole && !looksRedacted(serviceRole)) return serviceRole;
  const plural = process.env.SUPABASE_SECRET_KEYS?.trim();
  if (plural) {
    try {
      const parsed = JSON.parse(plural) as { default?: unknown };
      const value =
        typeof parsed?.default === "string" ? parsed.default.trim() : "";
      if (value && !looksRedacted(value)) return value;
    } catch {
      /* ignore malformed JSON */
    }
  }
  return undefined;
}
