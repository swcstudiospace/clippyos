import assert from "node:assert/strict";
import { test } from "node:test";
import {
  collectAppOrigins,
  dynamicBaseAllowedHosts,
  isAllowedAppHost,
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
