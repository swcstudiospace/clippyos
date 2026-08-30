import assert from "node:assert/strict";
import { test } from "node:test";
import { requireOAuthRedirectUrl } from "./client.ts";

test("google social without a redirect URL is a configuration error", () => {
  assert.throws(
    () => requireOAuthRedirectUrl("google", null, null),
    { message: "Google sign-in is not configured on this host." },
  );
  assert.throws(
    () => requireOAuthRedirectUrl("google", undefined, undefined),
    { message: "Google sign-in is not configured on this host." },
  );
  assert.throws(
    () => requireOAuthRedirectUrl("google", {}, null),
    { message: "Google sign-in is not configured on this host." },
  );
  assert.throws(
    () => requireOAuthRedirectUrl("google", { url: "" }, null),
    { message: "Google sign-in is not configured on this host." },
  );
});

test("non-google oauth without a redirect URL fails sign-in", () => {
  assert.throws(
    () => requireOAuthRedirectUrl("grok-google", null, null),
    { message: "Google sign-in is not configured on this host." },
  );
  assert.throws(
    () => requireOAuthRedirectUrl("grok-x", { url: null }, null),
    { message: "X sign-in is not configured on this host." },
  );
  assert.throws(
    () => requireOAuthRedirectUrl("twitter", {}, null),
    { message: "X sign-in is not configured on this host." },
  );
});

test("provider-not-found is a configuration error", () => {
  assert.throws(
    () => requireOAuthRedirectUrl("google", null, { message: "Provider not found" }),
    { message: "Google sign-in is not configured on this host." },
  );
});

test("oauth errors throw instead of returning", () => {
  assert.throws(
    () => requireOAuthRedirectUrl("google", { url: "https://accounts.google.com" }, { message: "Invalid origin" }),
    { message: "Invalid origin" },
  );
  assert.throws(
    () => requireOAuthRedirectUrl("grok-x", null, { message: null }),
    { message: "Sign-in failed" },
  );
});

test("a redirect URL is returned so sign-in can navigate", () => {
  assert.equal(
    requireOAuthRedirectUrl("google", { url: "https://accounts.google.com/o/oauth2" }, null),
    "https://accounts.google.com/o/oauth2",
  );
  assert.equal(
    requireOAuthRedirectUrl("grok-google", { url: "https://auth.grok.me/authorize" }, null),
    "https://auth.grok.me/authorize",
  );
});
