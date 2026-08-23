/** Hosts ClippyOS may be opened on — grok.me, the custom studio domain, and loopback. */

export const CUSTOM_APP_HOSTS = [
  "os.swcstudio.space",
  "www.os.swcstudio.space",
  "swcstudio.space",
  "www.swcstudio.space",
] as const;

const CUSTOM_SUFFIXES = [".swcstudio.space"] as const;

const ENV_HOST_KEYS = ["APP_URL", "BETTER_AUTH_URL", "VITE_PUBLIC_HOSTNAME"] as const;

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
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
  if (host === "grok.me" || host.endsWith(".grok.me")) return true;
  if (host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com")) return true;
  if ((CUSTOM_APP_HOSTS as readonly string[]).includes(host)) return true;
  if (CUSTOM_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  return extra.some((item) => stripPort(item) === host);
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
      ...extraHostsFromEnv(env),
    ]),
  ];
}
