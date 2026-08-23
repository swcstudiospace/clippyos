/** Client-safe MCP OAuth 2.1 helpers. Secrets never live here. */

import { authorizationServersFor } from "./app-hosts.ts";
import {
  MCP_SCOPE_LABELS,
  MCP_SCOPES,
  uniqueMcpScopes,
  type McpScope,
} from "./remote-mcp.ts";

export const MCP_OAUTH_ACCESS_PREFIX = "cos_oa_";
export const MCP_OAUTH_REFRESH_PREFIX = "cos_rt_";
export const MCP_OAUTH_CODE_PREFIX = "cos_ac_";

export const MCP_OAUTH_PROTOCOL = "2025-03-26";
export const MCP_OAUTH_ACCESS_TTL_SEC = 60 * 60;
export const MCP_OAUTH_REFRESH_TTL_SEC = 60 * 60 * 24 * 30;
export const MCP_OAUTH_CODE_TTL_SEC = 10 * 60;

export type McpOAuthGrantRow = {
  id: string;
  clientId: string;
  clientName: string;
  scopes: McpScope[];
  lastUsedAt: string | null;
  createdAt: string;
  accessExpiresAt: string;
  revokedAt: string | null;
};

export type McpOAuthDiscovery = {
  mcpUrl: string;
  resourceMetadataUrl: string;
  authorizationServerUrl: string;
  openIdConfigurationUrl: string;
  authorizeUrl: string;
  tokenUrl: string;
  registerUrl: string;
};

export function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function mcpResourceUrl(origin: string): string {
  return `${stripTrailingSlash(origin)}/api/mcp`;
}

export function mcpOAuthDiscovery(origin: string): McpOAuthDiscovery {
  const base = stripTrailingSlash(origin);
  return {
    mcpUrl: `${base}/api/mcp`,
    resourceMetadataUrl: `${base}/.well-known/oauth-protected-resource`,
    authorizationServerUrl: `${base}/.well-known/oauth-authorization-server`,
    openIdConfigurationUrl: `${base}/.well-known/openid-configuration`,
    authorizeUrl: `${base}/authorize`,
    tokenUrl: `${base}/token`,
    registerUrl: `${base}/register`,
  };
}

export function mcpOAuthScopesSupported(): McpScope[] {
  return MCP_SCOPES.filter((scope) => scope !== "admin:mcp");
}

export function buildProtectedResourceMetadata(origin: string): Record<string, unknown> {
  const base = stripTrailingSlash(origin);
  const resource = mcpResourceUrl(base);
  return {
    resource,
    authorization_servers: authorizationServersFor(base),
    bearer_methods_supported: ["header"],
    scopes_supported: mcpOAuthScopesSupported(),
    resource_documentation: `${base}/settings#clippy-mcp`,
  };
}

export function buildAuthorizationServerMetadata(origin: string): Record<string, unknown> {
  const urls = mcpOAuthDiscovery(origin);
  const scopes = mcpOAuthScopesSupported();
  return {
    issuer: stripTrailingSlash(origin),
    authorization_endpoint: urls.authorizeUrl,
    token_endpoint: urls.tokenUrl,
    registration_endpoint: urls.registerUrl,
    scopes_supported: scopes,
    response_types_supported: ["code"],
    response_modes_supported: ["query"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    revocation_endpoint_auth_methods_supported: ["none"],
    resource_parameter_supported: true,
    require_pushed_authorization_requests: false,
    require_pkce: true,
  };
}

export function buildOpenIdConfiguration(origin: string): Record<string, unknown> {
  return {
    ...buildAuthorizationServerMetadata(origin),
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["none"],
  };
}

export function mcpWwwAuthenticate(origin: string): string {
  const meta = mcpOAuthDiscovery(origin).resourceMetadataUrl;
  return `Bearer realm="ClippyOS MCP", resource_metadata="${meta}"`;
}

export function isSafeMcpOAuthPath(raw: string): boolean {
  if (!raw.startsWith("/")) return false;
  if (raw.startsWith("//") || raw.includes("://") || raw.includes("\\")) return false;
  const path = raw.split("?")[0] ?? "";
  return path === "/authorize" || path === "/oauth/authorize";
}

export function mcpOAuthLoginRedirect(search: string): string | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const raw = (params.get("redirect") ?? "").trim();
  if (!isSafeMcpOAuthPath(raw)) return null;
  return raw;
}

export function loginUrlForAuthorize(authorizePathAndSearch: string): string {
  const path = authorizePathAndSearch.startsWith("/") ? authorizePathAndSearch : `/${authorizePathAndSearch}`;
  if (!isSafeMcpOAuthPath(path.split("?")[0] ?? path)) return "/login";
  return `/login?redirect=${encodeURIComponent(path)}`;
}

const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function isAllowedOAuthRedirectUri(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.username || parsed.password) return false;
  if (parsed.protocol === "https:") return true;
  if (parsed.protocol === "http:" && LOCALHOST_HOSTS.has(parsed.hostname)) return true;
  return false;
}

export function parseRedirectUris(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    if (typeof item !== "string") continue;
    const uri = item.trim();
    if (!uri || seen.has(uri) || !isAllowedOAuthRedirectUri(uri)) continue;
    seen.add(uri);
    out.push(uri);
    if (out.length >= 8) break;
  }
  return out;
}

export function requestedMcpScopes(raw: string | null | undefined): McpScope[] {
  const parts = (raw ?? "")
    .split(/[\s,]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return uniqueMcpScopes(mcpOAuthScopesSupported());
  const filtered = uniqueMcpScopes(parts);
  return filtered.length ? filtered : uniqueMcpScopes(mcpOAuthScopesSupported());
}

export function scopeString(scopes: readonly McpScope[]): string {
  return scopes.join(" ");
}

export function scopeSummary(scopes: readonly McpScope[]): string {
  return scopes
    .filter((scope) => scope !== "mcp:discover")
    .map((scope) => MCP_SCOPE_LABELS[scope] ?? scope)
    .join(" · ");
}

export function formatClippyOsMcpOauthConnectorJson(mcpUrl: string): string {
  return JSON.stringify(
    {
      name: "ClippyOS",
      type: "custom",
      url: mcpUrl,
    },
    null,
    2,
  );
}

export function appendOAuthQuery(redirectUri: string, params: Record<string, string | undefined>): string {
  const url = new URL(redirectUri);
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue;
    url.searchParams.set(key, value);
  }
  return url.toString();
}

export function isOAuthAccessToken(token: string): boolean {
  return token.startsWith(MCP_OAUTH_ACCESS_PREFIX);
}

export function isOAuthRefreshToken(token: string): boolean {
  return token.startsWith(MCP_OAUTH_REFRESH_PREFIX);
}
