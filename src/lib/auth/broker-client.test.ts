import assert from "node:assert/strict";
import { test } from "node:test";
import { PREVIEW_CLIENT_ID } from "./preview.ts";
import { resolveGrokBrokerClient } from "./broker-client.ts";

test("live preview without DATABASE_URL uses grok_preview", () => {
  const resolved = resolveGrokBrokerClient({});
  assert.equal(resolved.usingPreviewClient, true);
  assert.equal(resolved.clientId, PREVIEW_CLIENT_ID);
});

test("published without GROK_AUTH leaves the broker plugin off", () => {
  const resolved = resolveGrokBrokerClient({ DATABASE_URL: "postgres://x" });
  assert.equal(resolved.usingPreviewClient, false);
  assert.equal(resolved.clientId, undefined);
});

test("per-app Grok Build client wins on a published deploy", () => {
  const resolved = resolveGrokBrokerClient({
    DATABASE_URL: "postgres://localhost/clippyos",
    GROK_AUTH_CLIENT_ID: "app_clippyos_prod",
    GROK_AUTH_CLIENT_SECRET: "secret",
  });
  assert.equal(resolved.usingPreviewClient, false);
  assert.equal(resolved.clientId, "app_clippyos_prod");
});

test("explicit grok_preview + DATABASE_URL does not impersonate preview", () => {
  const resolved = resolveGrokBrokerClient({
    DATABASE_URL: "postgres://localhost/clippyos",
    GROK_AUTH_CLIENT_ID: PREVIEW_CLIENT_ID,
    GROK_AUTH_CLIENT_SECRET: "preview-secret",
  });
  assert.equal(resolved.usingPreviewClient, false);
  assert.equal(resolved.clientId, undefined);
});
