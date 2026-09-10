import assert from "node:assert/strict";
import { test } from "node:test";
import { isAuthConfigured } from "./auth-configured.ts";

const none = {
  authDisabled: false,
  grokBroker: false,
  googleSocial: false,
  emailPassword: false,
};

test("disabled always false", () => {
  assert.equal(isAuthConfigured({ ...none, authDisabled: true }), false);
  assert.equal(
    isAuthConfigured({
      authDisabled: true,
      grokBroker: true,
      googleSocial: true,
      emailPassword: true,
    }),
    false,
  );
});

test("email-only true", () => {
  assert.equal(isAuthConfigured({ ...none, emailPassword: true }), true);
});

test("google-only true", () => {
  assert.equal(isAuthConfigured({ ...none, googleSocial: true }), true);
});

test("twitter-only true", () => {
  assert.equal(isAuthConfigured({ ...none, twitterSocial: true }), true);
});

test("broker-only true", () => {
  assert.equal(isAuthConfigured({ ...none, grokBroker: true }), true);
});

test("none of the three false", () => {
  assert.equal(isAuthConfigured(none), false);
});
