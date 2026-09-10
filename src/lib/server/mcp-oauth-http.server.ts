import { applySecurityHeaders } from "@/lib/security-headers";
import { rateLimitOrThrow } from "@/lib/server/autonomy-auth.server";
import {
  buildAuthorizationServerMetadata,
  buildOpenIdConfiguration,
  buildProtectedResourceMetadata,
  mcpWwwAuthenticate,
} from "@/lib/mcp-oauth";
import {
  exchangeMcpAuthorizationCode,
  refreshMcpOAuthToken,
  registerMcpOAuthClient,
  requestOrigin,
} from "@/lib/server/mcp-oauth.server";

export function mcpOauthCorsHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type, MCP-Protocol-Version, MCP-Session-Id");
  headers.set("Access-Control-Expose-Headers", "WWW-Authenticate, MCP-Protocol-Version");
  headers.set("Access-Control-Max-Age", "86400");
  applySecurityHeaders(headers);
  return headers;
}

export function mcpOauthJson(status: number, body: unknown, extra?: HeadersInit): Response {
  const headers = mcpOauthCorsHeaders(extra);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(body), { status, headers });
}

export function mcpOauthOptions(): Response {
  return new Response(null, { status: 204, headers: mcpOauthCorsHeaders() });
}

export function mcpUnauthorized(request: Request, message = "Authorization required."): Response {
  const origin = requestOrigin(request);
  return mcpOauthJson(
    401,
    { error: { code: "UNAUTHORIZED", message } },
    { "WWW-Authenticate": mcpWwwAuthenticate(origin || new URL(request.url).origin) },
  );
}

export function handleProtectedResourceMetadata(request: Request): Response {
  const origin = requestOrigin(request);
  return mcpOauthJson(200, buildProtectedResourceMetadata(origin));
}

export function handleAuthorizationServerMetadata(request: Request): Response {
  const origin = requestOrigin(request);
  return mcpOauthJson(200, buildAuthorizationServerMetadata(origin));
}

export function handleOpenIdConfiguration(request: Request): Response {
  const origin = requestOrigin(request);
  return mcpOauthJson(200, buildOpenIdConfiguration(origin));
}

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function handleDynamicClientRegistration(request: Request): Promise<Response> {
  try {
    rateLimitOrThrow(`mcp-oauth-dcr:${clientIp(request)}`, 20, 60 * 60_000);
  } catch {
    return mcpOauthJson(429, { error: "rate_limited", error_description: "Too many registrations." });
  }
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return mcpOauthJson(400, { error: "invalid_client_metadata", error_description: "Expected JSON." });
  }
  try {
    const registered = await registerMcpOAuthClient({
      clientName: typeof body.client_name === "string" ? body.client_name : undefined,
      redirectUris: body.redirect_uris,
      scope: typeof body.scope === "string" ? body.scope : undefined,
      clientUri: typeof body.client_uri === "string" ? body.client_uri : undefined,
      softwareId: typeof body.software_id === "string" ? body.software_id : undefined,
      tokenEndpointAuthMethod:
        typeof body.token_endpoint_auth_method === "string" ? body.token_endpoint_auth_method : "none",
    });
    return mcpOauthJson(201, registered);
  } catch (error) {
    const code = error instanceof Error ? error.message : "invalid_client_metadata";
    if (code === "invalid_redirect_uri") {
      return mcpOauthJson(400, { error: "invalid_redirect_uri", error_description: "Use https or localhost HTTP." });
    }
    if (code === "invalid_client_metadata") {
      return mcpOauthJson(400, { error: "invalid_client_metadata", error_description: "Public clients only (PKCE)." });
    }
    return mcpOauthJson(400, { error: "invalid_client_metadata" });
  }
}

async function readFormOrJson(request: Request): Promise<Record<string, string>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const json = (await request.json()) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(json)) {
      if (typeof value === "string") out[key] = value;
      else if (typeof value === "number" || typeof value === "boolean") out[key] = String(value);
    }
    return out;
  }
  const text = await request.text();
  return Object.fromEntries(new URLSearchParams(text));
}

export async function handleToken(request: Request): Promise<Response> {
  try {
    rateLimitOrThrow(`mcp-oauth-token:${clientIp(request)}`, 60, 60_000);
  } catch {
    return mcpOauthJson(429, { error: "temporarily_unavailable", error_description: "Too many token requests." });
  }
  let body: Record<string, string>;
  try {
    body = await readFormOrJson(request);
  } catch {
    return mcpOauthJson(400, { error: "invalid_request" });
  }
  const grantType = (body.grant_type ?? "").trim();
  const origin = requestOrigin(request);
  try {
    if (grantType === "authorization_code") {
      const tokens = await exchangeMcpAuthorizationCode({
        code: (body.code ?? "").trim(),
        redirectUri: (body.redirect_uri ?? "").trim(),
        clientId: (body.client_id ?? "").trim(),
        codeVerifier: (body.code_verifier ?? "").trim(),
        resource: (body.resource ?? "").trim() || undefined,
        origin,
      });
      return mcpOauthJson(200, tokens);
    }
    if (grantType === "refresh_token") {
      const tokens = await refreshMcpOAuthToken({
        refreshToken: (body.refresh_token ?? "").trim(),
        clientId: (body.client_id ?? "").trim() || undefined,
        resource: (body.resource ?? "").trim() || undefined,
        origin,
      });
      return mcpOauthJson(200, tokens);
    }
    return mcpOauthJson(400, { error: "unsupported_grant_type" });
  } catch (error) {
    const code = error instanceof Error ? error.message : "invalid_grant";
    if (code === "invalid_target") {
      return mcpOauthJson(400, { error: "invalid_target", error_description: "Resource does not match ClippyOS MCP." });
    }
    return mcpOauthJson(400, { error: code === "invalid_grant" ? "invalid_grant" : "invalid_request" });
  }
}
