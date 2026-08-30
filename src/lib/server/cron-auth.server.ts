/**
 * Cron route authentication. `x-vercel-cron` is never sufficient on its own —
 * that header is spoofable on any deployment that is not Vercel's cron runner.
 * Fail closed when CRON_SECRET is unset (NIST AC-3, IA-5, SC-8).
 */
import { bearerSecretEqual } from "./secret-crypto.server.ts";

export function authorizeCronRequest(
  request: Pick<Request, "headers">,
  env: Record<string, string | undefined> = process.env,
): boolean {
  const secret = env.CRON_SECRET?.trim() ?? "";
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return bearerSecretEqual(header, secret);
}
