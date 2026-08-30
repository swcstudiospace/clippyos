/** Bounded JSON object parse for inbound HTTP bodies (SI-10). */

export const MAX_JSON_BODY_BYTES = 256 * 1024;

export function parseJsonObject(
  text: string,
  maxBytes: number = MAX_JSON_BODY_BYTES,
): Record<string, unknown> {
  if (text.length > maxBytes) throw new Error("VALIDATION");
  if (!text.trim()) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error("VALIDATION");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("VALIDATION");
  }
  return parsed as Record<string, unknown>;
}
