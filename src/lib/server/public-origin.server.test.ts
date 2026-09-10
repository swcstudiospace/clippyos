import assert from "node:assert/strict";
import { test } from "node:test";
import { CANONICAL_APP_ORIGIN, GROK_APP_ORIGIN } from "../app-hosts.ts";
import { resolvePublicAppOrigin } from "./public-origin.server.ts";

function requestWithHost(host: string) {
  return {
    url: "http://127.0.0.1:8080/",
    headers: {
      get(name: string) {
        if (name === "host") return host;
        if (name === "x-forwarded-proto") return "https";
        return null;
      },
    },
  };
}

test("BETTER_AUTH_URL clippyos.grok.me never wins public origin", () => {
  assert.equal(
    resolvePublicAppOrigin({ env: { BETTER_AUTH_URL: GROK_APP_ORIGIN } }),
    CANONICAL_APP_ORIGIN,
  );
});

test("APP_URL studio domain wins public origin fallback", () => {
  assert.equal(
    resolvePublicAppOrigin({
      env: {
        BETTER_AUTH_URL: GROK_APP_ORIGIN,
        APP_URL: CANONICAL_APP_ORIGIN,
      },
    }),
    CANONICAL_APP_ORIGIN,
  );
});

test("request Host os.swcstudio.space wins over grok.me env", () => {
  assert.equal(
    resolvePublicAppOrigin({
      env: { BETTER_AUTH_URL: GROK_APP_ORIGIN },
      request: requestWithHost("os.swcstudio.space"),
    }),
    CANONICAL_APP_ORIGIN,
  );
});

test("request Host clippyos.grok.me does not win over canonical fallback", () => {
  assert.equal(
    resolvePublicAppOrigin({
      env: { BETTER_AUTH_URL: GROK_APP_ORIGIN },
      request: requestWithHost("clippyos.grok.me"),
    }),
    CANONICAL_APP_ORIGIN,
  );
});

test("a Vercel deployment advertises the host it was hit on", () => {
  const env = { VERCEL_PROJECT_PRODUCTION_URL: "clippyos.vercel.app", VERCEL_URL: "clippyos-abc.vercel.app" };
  assert.equal(
    resolvePublicAppOrigin({ env, request: requestWithHost("clippyos-abc.vercel.app") }),
    "https://clippyos-abc.vercel.app",
  );
  assert.equal(resolvePublicAppOrigin({ env }), "https://clippyos.vercel.app");
  assert.equal(
    resolvePublicAppOrigin({ env: { ...env, BETTER_AUTH_URL: GROK_APP_ORIGIN } }),
    "https://clippyos.vercel.app",
  );
});
