/**
 * Public origin resolution — server-only.
 * Moved out of the former Airwallex module so billing providers don't own
 * a generic concern (reset links, OAuth callbacks, checkout returns).
 */
import { getRequest } from "@tanstack/react-start/server";
import {
  authFallbackBaseURL,
  hostnameOf,
  isGrokMeHost,
  originFromRequest,
} from "../app-hosts.ts";

type HeaderReader = { get: (name: string) => string | null };

function envProvidesPublicOrigin(env: Record<string, string | undefined>): boolean {
  for (const key of ["BETTER_AUTH_URL", "APP_URL"] as const) {
    const host = hostnameOf(env[key] ?? "");
    if (!host) continue;
    if (isGrokMeHost(host)) continue;
    if (host === "vercel.app" || host.endsWith(".vercel.app")) continue;
    return true;
  }
  return false;
}

export function resolvePublicAppOrigin(input: {
  env?: Record<string, string | undefined>;
  request?: { url?: string; headers: HeaderReader };
} = {}): string {
  const env = input.env ?? (typeof process !== "undefined" ? process.env : {});
  if (envProvidesPublicOrigin(env)) return authFallbackBaseURL(env);
  if (input.request) {
    const origin = originFromRequest(input.request);
    const host = hostnameOf(origin);
    if (host && !isGrokMeHost(host)) return origin;
  }
  return authFallbackBaseURL(env);
}

export function publicAppOrigin(): string {
  try {
    const request = getRequest();
    return resolvePublicAppOrigin({ request, env: process.env });
  } catch {
    return authFallbackBaseURL();
  }
}
