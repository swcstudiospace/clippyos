import { getRequest } from "@tanstack/react-start/server";
import { isAllowedAppHost } from "@/lib/app-hosts";

export function publicOrigin(): string {
  try {
    const request = getRequest();
    const hostHeader =
      request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
    const host = hostHeader.split(",")[0]?.trim() ?? "";
    if (host && isAllowedAppHost(host)) {
      const proto =
        (request.headers.get("x-forwarded-proto") ||
          (host.includes("localhost") ? "http" : "https"))
          .split(",")[0]
          ?.trim() || "https";
      return `${proto}://${host.replace(/:\d+$/, "")}`;
    }
  } catch {
    /* fall through to env */
  }
  const env = process.env.APP_URL?.trim() || process.env.BETTER_AUTH_URL?.trim() || "";
  if (env) return env.replace(/\/$/, "");
  return "";
}