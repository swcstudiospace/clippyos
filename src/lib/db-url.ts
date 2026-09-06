/**
 * Supabase exposes two pooler modes on the same host and credentials:
 *   - port 5432 = session mode: one backend per client, capped at pool_size (15 on small
 *     plans) — a few warm serverless instances exhaust it and every query fails with
 *     EMAXCONNSESSION "max clients reached in session mode".
 *   - port 6543 = transaction mode: backends are shared per transaction, no client cap.
 *
 * node-postgres sends unnamed prepared statements and Kysely/Better Auth do the same, so
 * transaction mode is safe for this app. Migrations run inside BEGIN…COMMIT on one checked-out
 * client, which pins a backend for the transaction. Set DATABASE_POOL_MODE=session to opt out.
 */
export const SUPABASE_SESSION_PORT = "5432";
export const SUPABASE_TRANSACTION_PORT = "6543";

export function isSupabasePoolerUrl(url: string): boolean {
  try {
    return new URL(url).hostname.toLowerCase().endsWith(".pooler.supabase.com");
  } catch {
    return false;
  }
}

/** Rewrite a Supabase session-mode pooler URL to transaction mode; anything else is returned as-is. */
export function preferTransactionPooler(url: string, mode: string | undefined = process.env.DATABASE_POOL_MODE): string {
  if (!url || (mode ?? "").trim().toLowerCase() === "session") return url;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (!parsed.hostname.toLowerCase().endsWith(".pooler.supabase.com")) return url;
  if (parsed.port && parsed.port !== SUPABASE_SESSION_PORT) return url;
  parsed.port = SUPABASE_TRANSACTION_PORT;
  return parsed.toString();
}
