/**
 * SSRF / fetch-host guards (NIST 800-53 SC-7, SI-10).
 * Reject loopback, link-local, RFC1918, cloud metadata, and raw IP literals
 * so library URL ingest cannot be steered at internal services.
 */

const BLOCKED_HOSTS = new Set([
  "localhost",
  "localhost.localdomain",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "0:0:0:0:0:0:0:1",
  "169.254.169.254",
  "metadata.google.internal",
  "metadata.goog",
  "instance-data",
]);

function stripBrackets(host: string): string {
  return host.trim().toLowerCase().replace(/^\[|\]$/g, "");
}

function isIpv4(host: string): boolean {
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host);
}

function ipv4Octets(host: string): number[] | null {
  if (!isIpv4(host)) return null;
  const parts = host.split(".").map((part) => Number(part));
  if (parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return parts;
}

export function isPrivateOrLocalHostname(host: string): boolean {
  const h = stripBrackets(host);
  if (!h) return true;
  if (BLOCKED_HOSTS.has(h)) return true;
  if (h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (h.includes("%")) return true;

  const octets = ipv4Octets(h);
  if (octets) {
    const [a, b] = octets;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
  }

  if (h.includes(":")) {
    if (h === "::" || h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) return true;
    if (h.startsWith("::ffff:")) return isPrivateOrLocalHostname(h.slice(7));
  }

  return false;
}

/** True when a fetch hostname must never be contacted (SSRF). */
export function isBlockedFetchHost(host: string): boolean {
  const h = stripBrackets(host);
  if (!h) return true;
  if (isPrivateOrLocalHostname(h)) return true;
  if (isIpv4(h)) return true;
  if (h.includes(":")) return true;
  return false;
}
