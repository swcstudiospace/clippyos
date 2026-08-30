/**
 * HTTP hardening headers (NIST 800-53 SC-7 / SC-8 / SI-10).
 * Applied at the edge (vercel.json), Vite dev/preview, and JSON API helpers.
 *
 * frame-ancestors stays open to allowlisted Grok embedders — X-Frame-Options
 * is intentionally omitted so the preview host bridge keeps working.
 */

export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self' https://*.grok.me https://grok.me https://*.grok-sandbox.com http://*.grok-sandbox.com",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "connect-src 'self' https: wss:",
  "worker-src 'self' blob:",
  "frame-src 'self' https:",
  "upgrade-insecure-requests",
].join("; ");

export const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": CONTENT_SECURITY_POLICY,
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "X-DNS-Prefetch-Control": "off",
  "X-Permitted-Cross-Domain-Policies": "none",
};

export function applySecurityHeaders(headers: Headers): Headers {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(key)) headers.set(key, value);
  }
  return headers;
}

export function sanitizeRequestId(raw: string | null | undefined): string {
  const value = raw?.trim() ?? "";
  if (/^[A-Za-z0-9._-]{8,128}$/.test(value)) return value;
  return crypto.randomUUID();
}
