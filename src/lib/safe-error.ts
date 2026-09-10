/** Map thrown errors to a public UPPER_SNAKE code. Never echo stacks or paths. */

export function publicErrorCode(error: unknown, fallback = "DATA_UNAVAILABLE"): string {
  const raw = error instanceof Error ? error.message : String(error ?? fallback);
  const code = raw.split(/[\n\r]/)[0]?.trim() ?? fallback;
  if (!code || code.length > 64) return fallback;
  if (/^[A-Z][A-Z0-9_]{1,62}$/.test(code)) return code;
  return fallback;
}
