import assert from "node:assert/strict";
import { test } from "node:test";
import {
  appendOAuthQuery,
  buildAuthorizationServerMetadata,
  buildProtectedResourceMetadata,
  formatClippyOsMcpOauthConnectorJson,
  isAllowedOAuthRedirectUri,
  isSafeMcpOAuthPath,
  loginUrlForAuthorize,
  mcpOAuthDiscovery,
  mcpOAuthLoginRedirect,
  mcpWwwAuthenticate,
  parseRedirectUris,
  requestedMcpScopes,
  scopeString,
} from "./mcp-oauth.ts";

test("PRM and AS metadata advertise PKCE S256 and DCR", () => {
  const origin = "https://os.swcstudio.space";
  const prm = buildProtectedResourceMetadata(origin);
  assert.equal(prm.resource, "https://os.swcstudio.space/api/mcp");
  assert.deepEqual(prm.authorization_servers, [
    origin,
    "https://clippyos.grok.me",
  ]);
  assert.equal((prm.scopes_supported as string[]).includes("admin:mcp"), false);
  const as = buildAuthorizationServerMetadata(origin);
  assert.equal(as.issuer, origin);
  assert.equal(as.authorization_endpoint, "https://os.swcstudio.space/authorize");
  assert.equal(as.token_endpoint, "https://os.swcstudio.space/token");
  assert.equal(as.registration_endpoint, "https://os.swcstudio.space/register");
  assert.deepEqual(as.code_challenge_methods_supported, ["S256"]);
  assert.equal(as.require_pkce, true);
  assert.deepEqual(as.token_endpoint_auth_methods_supported, ["none"]);
  assert.equal(as.resource_parameter_supported, true);
});

test("PRM on the Grok host still lists the custom domain as an authorization server", () => {
  const prm = buildProtectedResourceMetadata("https://clippyos.grok.me");
  assert.equal(prm.resource, "https://clippyos.grok.me/api/mcp");
  assert.deepEqual(prm.authorization_servers, [
    "https://clippyos.grok.me",
    "https://os.swcstudio.space",
  ]);
});

test("WWW-Authenticate points at protected resource metadata", () => {
  const header = mcpWwwAuthenticate("https://os.swcstudio.space");
  assert.match(header, /^Bearer /);
  assert.match(header, /resource_metadata="https:\/\/os\.swcstudio\.space\/\.well-known\/oauth-protected-resource"/);
});

test("OAuth connector JSON has MCP URL and no bearer header", () => {
  const json = formatClippyOsMcpOauthConnectorJson("https://os.swcstudio.space/api/mcp");
  const parsed = JSON.parse(json) as { url: string; type: string; headers?: unknown };
  assert.equal(parsed.url, "https://os.swcstudio.space/api/mcp");
  assert.equal(parsed.type, "custom");
  assert.equal(parsed.headers, undefined);
  assert.equal(json.includes("Bearer"), false);
});

test("redirect URIs allow https and localhost http, reject javascript", () => {
  assert.equal(isAllowedOAuthRedirectUri("https://grok.com/connectors/oauth/callback"), true);
  assert.equal(isAllowedOAuthRedirectUri("http://127.0.0.1:54321/callback"), true);
  assert.equal(isAllowedOAuthRedirectUri("http://localhost:3000/cb"), true);
  assert.equal(isAllowedOAuthRedirectUri("javascript:alert(1)"), false);
  assert.equal(isAllowedOAuthRedirectUri("http://evil.example/cb"), false);
  assert.deepEqual(parseRedirectUris(["https://x.ai/cb", "javascript:x", "nope"]), ["https://x.ai/cb"]);
});

test("empty requested scopes default to full connector without admin", () => {
  const scopes = requestedMcpScopes("");
  assert.equal(scopes.includes("mcp:discover"), true);
  assert.equal(scopes.includes("social:write"), true);
  assert.equal(scopes.includes("admin:mcp"), false);
  assert.equal(requestedMcpScopes("clients:read nope").includes("clients:read"), true);
  assert.equal(scopeString(["mcp:discover", "clients:read"]), "mcp:discover clients:read");
});

test("login redirect only allows authorize paths", () => {
  assert.equal(isSafeMcpOAuthPath("/authorize"), true);
  assert.equal(isSafeMcpOAuthPath("/authorize?client_id=x"), true);
  assert.equal(isSafeMcpOAuthPath("/oauth/authorize"), true);
  assert.equal(isSafeMcpOAuthPath("//evil"), false);
  assert.equal(isSafeMcpOAuthPath("/home"), false);
  assert.equal(mcpOAuthLoginRedirect("?redirect=%2Fauthorize%3Fclient_id%3Dabc"), "/authorize?client_id=abc");
  assert.equal(mcpOAuthLoginRedirect("?redirect=/home"), null);
  assert.match(loginUrlForAuthorize("/authorize?client_id=1"), /^\/login\?redirect=/);
});

test("discovery URLs and oauth query append", () => {
  const urls = mcpOAuthDiscovery("https://os.swcstudio.space/");
  assert.equal(urls.mcpUrl, "https://os.swcstudio.space/api/mcp");
  assert.equal(urls.resourceMetadataUrl.endsWith("/.well-known/oauth-protected-resource"), true);
  const redirected = appendOAuthQuery("https://grok.com/cb", { code: "abc", state: "s1" });
  assert.equal(redirected.includes("code=abc"), true);
  assert.equal(redirected.includes("state=s1"), true);
});
