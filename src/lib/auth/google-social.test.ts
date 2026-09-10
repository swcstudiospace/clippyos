import assert from "node:assert/strict";
import { test } from "node:test";
import { brokerButtonsEnabled, publishedBrokerConfigured, resolveGoogleSocial, resolveTwitterSocial } from "./google-social.ts";

test("TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET configure native X", () => {
  const resolved = resolveTwitterSocial({
    TWITTER_CLIENT_ID: "tid",
    TWITTER_CLIENT_SECRET: "tsecret",
  });
  assert.deepEqual(resolved, { clientId: "tid", clientSecret: "tsecret" });
});

test("X_CLIENT_ID aliases configure native X", () => {
  const resolved = resolveTwitterSocial({
    X_CLIENT_ID: "xid",
    X_CLIENT_SECRET: "xsecret",
  });
  assert.deepEqual(resolved, { clientId: "xid", clientSecret: "xsecret" });
});

test("missing or blank X credentials resolve to null", () => {
  assert.equal(resolveTwitterSocial({}), null);
  assert.equal(resolveTwitterSocial({ TWITTER_CLIENT_ID: "tid" }), null);
  assert.equal(resolveTwitterSocial({ X_CLIENT_SECRET: "xsecret" }), null);
});

test("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET configure native Google", () => {
  const resolved = resolveGoogleSocial({
    GOOGLE_CLIENT_ID: "gid",
    GOOGLE_CLIENT_SECRET: "gsecret",
  });
  assert.deepEqual(resolved, { clientId: "gid", clientSecret: "gsecret" });
});

test("missing or blank Google credentials resolve to null", () => {
  assert.equal(resolveGoogleSocial({}), null);
  assert.equal(resolveGoogleSocial({ GOOGLE_CLIENT_ID: "gid" }), null);
  assert.equal(resolveGoogleSocial({ GOOGLE_CLIENT_SECRET: "gsecret" }), null);
  assert.equal(
    resolveGoogleSocial({ GOOGLE_CLIENT_ID: "  ", GOOGLE_CLIENT_SECRET: "gsecret" }),
    null,
  );
  assert.equal(
    resolveGoogleSocial({ GOOGLE_CLIENT_ID: "gid", GOOGLE_CLIENT_SECRET: "" }),
    null,
  );
});

test("AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET aliases configure native Google", () => {
  const resolved = resolveGoogleSocial({
    AUTH_GOOGLE_ID: "alias-id",
    AUTH_GOOGLE_SECRET: "alias-secret",
  });
  assert.deepEqual(resolved, { clientId: "alias-id", clientSecret: "alias-secret" });
});

test("missing or blank broker credentials are not published-configured", () => {
  assert.equal(publishedBrokerConfigured({}), false);
  assert.equal(publishedBrokerConfigured({ GROK_AUTH_CLIENT_ID: "app_id" }), false);
  assert.equal(publishedBrokerConfigured({ GROK_AUTH_CLIENT_SECRET: "secret" }), false);
  assert.equal(
    publishedBrokerConfigured({ GROK_AUTH_CLIENT_ID: "  ", GROK_AUTH_CLIENT_SECRET: "secret" }),
    false,
  );
  assert.equal(
    publishedBrokerConfigured({ GROK_AUTH_CLIENT_ID: "app_id", GROK_AUTH_CLIENT_SECRET: "" }),
    false,
  );
});

test("grok_preview client is not published-configured", () => {
  assert.equal(
    publishedBrokerConfigured({
      GROK_AUTH_CLIENT_ID: "grok_preview",
      GROK_AUTH_CLIENT_SECRET: "preview-secret",
    }),
    false,
  );
  assert.equal(
    publishedBrokerConfigured({
      GROK_AUTH_CLIENT_ID: "  grok_preview  ",
      GROK_AUTH_CLIENT_SECRET: "preview-secret",
    }),
    false,
  );
});

test("real GROK_AUTH_CLIENT_ID and SECRET are published-configured", () => {
  assert.equal(
    publishedBrokerConfigured({
      GROK_AUTH_CLIENT_ID: "app_clippyos_prod",
      GROK_AUTH_CLIENT_SECRET: "secret",
    }),
    true,
  );
});

test("live preview without DATABASE_URL offers broker Google/X buttons", () => {
  assert.equal(brokerButtonsEnabled({}), true);
  assert.equal(
    brokerButtonsEnabled({
      GROK_AUTH_CLIENT_ID: "grok_preview",
      GROK_AUTH_CLIENT_SECRET: "preview-secret",
    }),
    true,
  );
});

test("published deploy without GROK_AUTH hides broker buttons", () => {
  assert.equal(brokerButtonsEnabled({ DATABASE_URL: "postgres://localhost/clippyos" }), false);
});

test("published deploy with real GROK_AUTH offers broker buttons", () => {
  assert.equal(
    brokerButtonsEnabled({
      DATABASE_URL: "postgres://localhost/clippyos",
      GROK_AUTH_CLIENT_ID: "app_clippyos_prod",
      GROK_AUTH_CLIENT_SECRET: "secret",
    }),
    true,
  );
});
