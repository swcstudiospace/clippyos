import assert from "node:assert/strict";
import { test } from "node:test";
import { loginSocialProviders } from "./providers.ts";

test("published host without Google, X, or broker still shows native Google and X", () => {
  assert.deepEqual(
    loginSocialProviders({
      googleConfigured: false,
      twitterConfigured: false,
      brokerConfigured: false,
    }),
    [
      { providerId: "google", idp: "google", label: "Google" },
      { providerId: "twitter", idp: "twitter", label: "X" },
    ],
  );
});

test("native Google and X win over the Grok broker on a published host", () => {
  assert.deepEqual(
    loginSocialProviders({
      googleConfigured: true,
      twitterConfigured: true,
      brokerConfigured: true,
    }),
    [
      { providerId: "google", idp: "google", label: "Google" },
      { providerId: "twitter", idp: "twitter", label: "X" },
    ],
  );
});

test("broker Google/X appear only when native social is missing", () => {
  assert.deepEqual(
    loginSocialProviders({
      googleConfigured: false,
      twitterConfigured: false,
      brokerConfigured: true,
    }),
    [
      { providerId: "grok-google", idp: "google", label: "Google" },
      { providerId: "grok-x", idp: "twitter", label: "X" },
    ],
  );
});

test("native Google can pair with broker X", () => {
  assert.deepEqual(
    loginSocialProviders({
      googleConfigured: true,
      twitterConfigured: false,
      brokerConfigured: true,
    }),
    [
      { providerId: "google", idp: "google", label: "Google" },
      { providerId: "grok-x", idp: "twitter", label: "X" },
    ],
  );
});
