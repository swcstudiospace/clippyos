import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CANONICAL_APP_ORIGIN,
  GROK_APP_ORIGIN,
  authorizationServersFor,
  authFallbackBaseURL,
  collectAppOrigins,
  dynamicBaseAllowedHosts,
  isAllowedAppHost,
  isGrokMeHost,
  isPublishedMcpHost,
  mcpResourcesEquivalent,
  mcpUrlFor,
  oauthCallbackURL,
  socialCallbackURL,
  originFromRequest,
  publishedMcpEndpoints,
} from "./app-hosts.ts";

test("custom studio domain and grok.me are both trusted", () => {
  assert.equal(isAllowedAppHost("os.swcstudio.space"), true);
  assert.equal(isAllowedAppHost("clippyos.grok.me"), true);
  assert.equal(isAllowedAppHost("evil.example"), false);
});

test("request Origin on the custom domain is added to trusted origins", () => {
  const origins = collectAppOrigins({
    betterAuthUrl: "https://clippyos.grok.me",
    env: { VITE_PUBLIC_HOSTNAME: "clippyos.grok.me" },
    request: {
      headers: {
        get(name: string) {
          if (name === "origin") return "https://os.swcstudio.space";
          if (name === "host") return "os.swcstudio.space";
          if (name === "x-forwarded-proto") return "https";
          return null;
        },
      },
    },
  });
  assert.equal(origins.includes("https://os.swcstudio.space"), true);
  assert.equal(origins.includes("https://clippyos.grok.me"), true);
});

test("dynamic baseURL allowlist covers both published hosts", () => {
  const hosts = dynamicBaseAllowedHosts({
    VITE_PUBLIC_HOSTNAME: "clippyos.grok.me",
    BETTER_AUTH_URL: "https://clippyos.grok.me",
  });
  assert.equal(hosts.includes("os.swcstudio.space"), true);
  assert.equal(hosts.includes("clippyos.grok.me"), true);
  assert.equal(hosts.includes("*.grok.me"), true);
});

test("published MCP endpoints prefer the custom domain and keep grok.me as an alias", () => {
  const endpoints = publishedMcpEndpoints();
  assert.equal(endpoints.canonical, "https://os.swcstudio.space/api/mcp");
  assert.equal(endpoints.alias, "https://clippyos.grok.me/api/mcp");
  assert.deepEqual([...endpoints.urls], [
    "https://os.swcstudio.space/api/mcp",
    "https://clippyos.grok.me/api/mcp",
  ]);
  assert.equal(mcpUrlFor(CANONICAL_APP_ORIGIN), endpoints.canonical);
  assert.equal(mcpUrlFor(GROK_APP_ORIGIN), endpoints.alias);
  assert.equal(isPublishedMcpHost("os.swcstudio.space"), true);
  assert.equal(isPublishedMcpHost("clippyos.grok.me"), true);
  assert.equal(isPublishedMcpHost("evil.example"), false);
});

test("OAuth resource matching treats both published MCP URLs as the same workspace", () => {
  assert.equal(
    mcpResourcesEquivalent(
      "https://os.swcstudio.space/api/mcp",
      "https://clippyos.grok.me/api/mcp/",
    ),
    true,
  );
  assert.equal(
    mcpResourcesEquivalent(
      "https://os.swcstudio.space/api/mcp",
      "https://os.swcstudio.space/api/mcp",
    ),
    true,
  );
  assert.equal(
    mcpResourcesEquivalent(
      "https://os.swcstudio.space/api/mcp",
      "https://evil.example/api/mcp",
    ),
    false,
  );
  assert.equal(
    mcpResourcesEquivalent("https://os.swcstudio.space/api/mcp", "https://os.swcstudio.space/home"),
    false,
  );
});

test("originFromRequest prefers the inbound Host so both published MCP URLs advertise themselves", () => {
  const custom = originFromRequest({
    url: "http://127.0.0.1:8080/.well-known/oauth-protected-resource",
    headers: {
      get(name: string) {
        if (name === "host") return "os.swcstudio.space";
        if (name === "x-forwarded-proto") return "https";
        return null;
      },
    },
  });
  assert.equal(custom, "https://os.swcstudio.space");

  const grok = originFromRequest({
    url: "http://127.0.0.1:8080/api/mcp",
    headers: {
      get(name: string) {
        if (name === "x-forwarded-host") return "clippyos.grok.me";
        if (name === "host") return "127.0.0.1:8080";
        if (name === "x-forwarded-proto") return "https";
        return null;
      },
    },
  });
  assert.equal(grok, "https://clippyos.grok.me");
});

test("authorization servers list the host that was hit first, then the sibling published origin", () => {
  assert.deepEqual(authorizationServersFor("https://os.swcstudio.space"), [
    "https://os.swcstudio.space",
    "https://clippyos.grok.me",
  ]);
  assert.deepEqual(authorizationServersFor("https://clippyos.grok.me"), [
    "https://clippyos.grok.me",
    "https://os.swcstudio.space",
  ]);
  assert.deepEqual(authorizationServersFor("https://preview.grok-sandbox.com"), [
    "https://preview.grok-sandbox.com",
  ]);
});


test("auth fallback never prefers clippyos.grok.me even when the deployer injected it", () => {
  assert.equal(
    authFallbackBaseURL({ BETTER_AUTH_URL: "https://clippyos.grok.me" }),
    CANONICAL_APP_ORIGIN,
  );
  assert.equal(
    authFallbackBaseURL({
      BETTER_AUTH_URL: "https://clippyos.grok.me",
      APP_URL: "https://clippyos.grok.me",
    }),
    CANONICAL_APP_ORIGIN,
  );
  assert.equal(
    authFallbackBaseURL({ BETTER_AUTH_URL: "https://os.swcstudio.space" }),
    "https://os.swcstudio.space",
  );
  assert.equal(authFallbackBaseURL({}), CANONICAL_APP_ORIGIN);
  assert.equal(isGrokMeHost("clippyos.grok.me"), true);
  assert.equal(isGrokMeHost("os.swcstudio.space"), false);
  assert.equal(
    oauthCallbackURL("grok-google"),
    "https://os.swcstudio.space/api/auth/oauth2/callback/grok-google",
  );
  assert.equal(
    oauthCallbackURL("grok-x"),
    "https://os.swcstudio.space/api/auth/oauth2/callback/grok-x",
  );
  assert.equal(
    socialCallbackURL("google"),
    "https://os.swcstudio.space/api/auth/callback/google",
  );
});
