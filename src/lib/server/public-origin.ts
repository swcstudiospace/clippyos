import { getRequest } from "@tanstack/react-start/server";

export function publicOrigin(): string {
  const env = process.env.APP_URL?.trim() || process.env.BETTER_AUTH_URL?.trim() || "";
  if (env) return env.replace(/\/$/, "");
  try {
    const request = getRequest();
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
    if (!host) return "";
    const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  } catch {
    return "";
  }
}
