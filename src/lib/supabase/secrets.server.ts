/** Server-only secret resolution. Never import from client modules. */

function looksRedacted(value: string): boolean {
  return /[•…]|\.{3}|YOUR_|changeme|placeholder/i.test(value);
}

/**
 * Project secret API key. Prefer process env (published host). The fallback
 * exists so this preview can talk to the agency's Supabase project without a
 * `.env` file — it must never be imported into a client bundle.
 */
const PREVIEW_SECRET = "sb_secret_Zrc_b_jnhlijVtVestVABA_VDV1AE_M";

export function getSupabaseSecret(): string | undefined {
  if (typeof process === "undefined") return undefined;
  const fromEnv = process.env.SUPABASE_SECRET_KEY?.trim();
  if (fromEnv && !looksRedacted(fromEnv)) return fromEnv;
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
  if (PREVIEW_SECRET && !looksRedacted(PREVIEW_SECRET)) return PREVIEW_SECRET;
  return undefined;
}
