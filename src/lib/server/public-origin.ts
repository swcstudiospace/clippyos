import { getRequest } from "@tanstack/react-start/server";
import { CANONICAL_APP_ORIGIN, isAllowedAppHost, originFromRequest } from "@/lib/app-hosts";

export function publicOrigin(): string {
  try {
    return originFromRequest(getRequest());
  } catch {
    /* fall through to env */
  }
  const env = process.env.APP_URL?.trim() || process.env.BETTER_AUTH_URL?.trim() || "";
  if (env) {
    try {
      const parsed = new URL(env.includes("://") ? env : `https://${env}`);
      if (isAllowedAppHost(parsed.hostname)) return env.replace(/\/+$/, "");
    } catch {
      /* ignore */
    }
  }
  return CANONICAL_APP_ORIGIN;
}
