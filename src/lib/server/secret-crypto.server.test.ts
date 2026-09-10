import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SECRET_ENVELOPE_PREFIX,
  bearerSecretEqual,
  decryptSecret,
  encryptSecret,
  looksEncryptedSecret,
  isEncryptedSettingKey,
  secretsEqual,
} from "./secret-crypto.server.ts";

const ENV = { BETTER_AUTH_SECRET: "unit-test-better-auth-secret" };

test("timing-safe secret compare matches only identical strings", () => {
  assert.equal(secretsEqual("abc", "abc"), true);
  assert.equal(secretsEqual("abc", "abd"), false);
  assert.equal(secretsEqual("abc", "ab"), false);
  assert.equal(bearerSecretEqual("Bearer s3cret", "s3cret"), true);
  assert.equal(bearerSecretEqual("Bearer s3cret", "other"), false);
  assert.equal(bearerSecretEqual("s3cret", "s3cret"), false);
});

test("AES-256-GCM envelope round-trips and refuses a wrong key", () => {
  const cipher = encryptSecret("daytona-key-value", ENV);
  assert.equal(looksEncryptedSecret(cipher), true);
  assert.ok(cipher.startsWith(SECRET_ENVELOPE_PREFIX));
  assert.notEqual(cipher, "daytona-key-value");
  assert.equal(decryptSecret(cipher, ENV), "daytona-key-value");
  assert.throws(() => decryptSecret(cipher, { BETTER_AUTH_SECRET: "different-secret-16" }));
});

test("legacy plaintext rows pass through until rewritten", () => {
  assert.equal(decryptSecret("already-plain", ENV), "already-plain");
  assert.equal(encryptSecret("x", {}), "x");
});

test("only credential-shaped setting keys are enveloped", () => {
  assert.equal(isEncryptedSettingKey("DAYTONA_API_KEY"), true);
  assert.equal(isEncryptedSettingKey("WEBHOOK_SIGNING_SECRET"), true);
  assert.equal(isEncryptedSettingKey("MCP_TOKEN_HASH"), true);
  assert.equal(isEncryptedSettingKey("WEBHOOK_OUTBOUND_JSON"), false);
  assert.equal(isEncryptedSettingKey("MCP_LAST_USED_AT"), false);
  assert.equal(isEncryptedSettingKey("OPENAI_COMPAT_BASE"), false);
  assert.equal(isEncryptedSettingKey("BRAND_ACCENT_HEX"), false);
});
