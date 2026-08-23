/** Hosts ClippyOS may be opened on — grok.me, the custom studio domain, and loopback. */

export const CUSTOM_APP_HOSTS = [
  "os.swcstudio.space",
  "www.os.swcstudio.space",
  "swcstudio.space",
  "www.swcstudio.space",
] as const;

/** Public MCP + OAuth URLs operators paste into Grok / Hermes. Same workspace. */
export const CANONICAL_APP_ORIGIN = "https://os.swcstudio.space";
export const GROK_APP_ORIGIN = "https://clippyos.grok.me";

export const PUBLISHED_MCP_HOSTS = [
  "os.swcstudio.space",
  "www.os.swcstudio.space",
  "clippyos.grok.me",
] as const;

const CUSTOM_SUFFIXES = [".swcstudio.space"] as const;

const ENV_HOST_KEYS = ["APP_URL", "BETTER_AUTH_URL", "VITE_PUBLIC_HOSTNAME"] as const;

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function hostnameOf(value: string): string {
  const raw = value.trim().toLowerCase();
  if (!raw) return "";
  try {
    if (raw.includes("://")) return new URL(raw).hostname.toLowerCase();
  } catch {
    /* fall through */
  }
  return (raw.replace(/\/+$/, "").split("/")[0] ?? "").replace(/:\d+$/, "");
}

export function stripPort(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/:\d+$/, "");
}

export function extraHostsFromEnv(
  env: Record<string, string | undefined> = typeof process !== "undefined" ? process.env : {},
): string[] {
  const hosts: string[] = [];
  for (const key of ENV_HOST_KEYS) {
    const host = hostnameOf(env[key] ?? "");
    if (!host) continue;
    if (host === "vercel.app" || host.endsWith(".vercel.app")) continue;
    hosts.push(host);
  }
  return hosts;
}

export function isAllowedAppHost(
  hostname: string,
  extra: string[] = extraHostsFromEnv(),
): boolean {
  const host = stripPort(hostname);
  if (!host) return false;
  if (LOOPBACK_HOSTS.has(host)) return true;
  if (host === "grok.me" || host.endsWith(".grok.me")) return true;
  if (host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com")) return true;
  if ((CUSTOM_APP_HOSTS as readonly string[]).includes(host)) return true;
  if (CUSTOM_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  return extra.some((item) => stripPort(item) === host);
}

export function isPublishedMcpHost(hostname: string): boolean {
  const host = stripPort(hostname);
  return (PUBLISHED_MCP_HOSTS as readonly string[]).includes(host);
}

export function mcpUrlFor(origin: string): string {
  const base = origin.trim().replace(/\/+$/, "");
  return base ? `${base}/api/mcp` : "/api/mcp";
}

export function publishedAppOrigins(): readonly string[] {
  return [CANONICAL_APP_ORIGIN, GROK_APP_ORIGIN];
}

export function publishedMcpEndpoints(): {
  canonical: string;
  alias: string;
  urls: readonly string[];
} {
  const canonical = mcpUrlFor(CANONICAL_APP_ORIGIN);
  const alias = mcpUrlFor(GROK_APP_ORIGIN);
  return { canonical, alias, urls: [canonical, alias] };
}

/**
 * OAuth authorization servers for a request origin. Same-host first so Grok
 * stays on the MCP URL it was given; the other published host is a fallback.
 */
export function authorizationServersFor(origin: string): string[] {
  const base = origin.trim().replace(/\/+$/, "");
  const servers: string[] = [];
  const push = (value: string) => {
    const next = value.replace(/\/+$/, "");
    if (next && !servers.includes(next)) servers.push(next);
  };
  push(base);
  let host = "";
  try {
    host = new URL(base.includes("://") ? base : `https://${base}`).hostname;
  } catch {
    return servers;
  }
  if (!isPublishedMcpHost(host)) return servers;
  for (const published of publishedAppOrigins()) push(published);
  return servers;
}

export function mcpResourcesEquivalent(left: string, right: string): boolean {
  const norm = (value: string) => value.trim().replace(/\/+$/, "");
  const a = norm(left);
  const b = norm(right);
  if (!a || !b) return false;
  if (a === b) return true;
  try {
    const ua = new URL(a);
    const ub = new URL(b);
    const pathOk = (path: string) => path.replace(/\/+$/, "") === "/api/mcp";
    return (
      pathOk(ua.pathname) &&
      pathOk(ub.pathname) &&
      isPublishedMcpHost(ua.hostname) &&
      isPublishedMcpHost(ub.hostname)
    );
  } catch {
    return false;
  }
}

type HeaderReader = { get: (name: string) => string | null };

function firstHeader(headers: HeaderReader, name: string): string {
  return headers.get(name)?.split(",")[0]?.trim() ?? "";
}

/**
 * Public origin of an inbound request. Host / X-Forwarded-* win over the
 * internal URL so both published MCP hosts (and preview) advertise themselves.
 */
export function originFromRequest(request: { url?: string; headers: HeaderReader }): string {
  const extra = extraHostsFromEnv();
  const hostHeader = firstHeader(request.headers, "x-forwarded-host") || firstHeader(request.headers, "host");
  const host = stripPort(hostHeader);
  if (host && isAllowedAppHost(host, extra)) {
    const forwardedProto = firstHeader(request.headers, "x-forwarded-proto");
    const proto = forwardedProto || (LOOPBACK_HOSTS.has(host) ? "http" : "https");
    return `${proto}://${host}`;
  }
  if (request.url) {
    try {
      const url = new URL(request.url);
      if (isAllowedAppHost(url.hostname, extra)) return url.origin;
    } catch {
      /* ignore */
    }
  }
  return CANONICAL_APP_ORIGIN;
}

export function collectAppOrigins(input: {
  request?: { headers: { get: (name: string) => string | null } };
  betterAuthUrl?: string;
  env?: Record<string, string | undefined>;
}): string[] {
  const env = input.env ?? (typeof process !== "undefined" ? process.env : {});
  const extra = extraHostsFromEnv(env);
  const origins = new Set<string>();
  if (input.betterAuthUrl?.trim()) origins.add(input.betterAuthUrl.trim().replace(/\/+$/, ""));
  for (const host of extra) origins.add(`https://${host}`);
  for (const host of CUSTOM_APP_HOSTS) origins.add(`https://${host}`);
  origins.add(CANONICAL_APP_ORIGIN);
  origins.add(GROK_APP_ORIGIN);
  origins.add("*.grok.me");
  origins.add("https://*.grok.me");
  origins.add("*.swcstudio.space");
  origins.add("https://*.swcstudio.space");
  origins.add("*.grok-sandbox.com");
  origins.add("https://*.grok-sandbox.com");
  origins.add("http://*.grok-sandbox.com");
  origins.add("http://localhost:8080");
  origins.add("http://127.0.0.1:8080");
  origins.add("http://[::1]:8080");

  const request = input.request;
  if (request) {
    const headerOrigin = request.headers.get("origin");
    if (headerOrigin && headerOrigin !== "null") {
      try {
        const parsed = new URL(headerOrigin);
        if (isAllowedAppHost(parsed.hostname, extra)) origins.add(parsed.origin);
      } catch {
        /* ignore */
      }
    }
    const hostHeader =
      request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
    const host = hostHeader.split(",")[0]?.trim() ?? "";
    if (host && isAllowedAppHost(host, extra)) {
      const proto =
        (request.headers.get("x-forwarded-proto") || "https").split(",")[0]?.trim() || "https";
      origins.add(`${proto}://${stripPort(host)}`);
    }
  }
  return [...origins];
}

export function dynamicBaseAllowedHosts(
  env: Record<string, string | undefined> = typeof process !== "undefined" ? process.env : {},
): string[] {
  return [
    ...new Set([
      "localhost",
      "127.0.0.1",
      "[::1]",
      "*.grok-sandbox.com",
      "*.grok.me",
      "*.swcstudio.space",
      ...CUSTOM_APP_HOSTS,
      ...PUBLISHED_MCP_HOSTS,
      ...extraHostsFromEnv(env),
    ]),
  ];
}
