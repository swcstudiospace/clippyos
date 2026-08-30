import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CONTENT_SECURITY_POLICY,
  SECURITY_HEADERS,
  applySecurityHeaders,
  sanitizeRequestId,
} from "./security-headers.ts";

test("security headers cover CSP, HSTS, nosniff, and permissions policy", () => {
  assert.match(SECURITY_HEADERS["Content-Security-Policy"] ?? "", /object-src 'none'/);
  assert.match(SECURITY_HEADERS["Strict-Transport-Security"] ?? "", /max-age=31536000/);
  assert.equal(SECURITY_HEADERS["X-Content-Type-Options"], "nosniff");
  assert.match(SECURITY_HEADERS["Permissions-Policy"] ?? "", /camera=\(\)/);
  assert.equal(SECURITY_HEADERS["Cross-Origin-Opener-Policy"], "same-origin-allow-popups");
  assert.doesNotMatch(CONTENT_SECURITY_POLICY, /unsafe-eval/);
  assert.match(CONTENT_SECURITY_POLICY, /frame-ancestors 'self'/);
  assert.equal("X-Frame-Options" in SECURITY_HEADERS, false);
});

test("applySecurityHeaders does not clobber an existing CSP", () => {
  const headers = new Headers({ "Content-Security-Policy": "default-src 'none'" });
  applySecurityHeaders(headers);
  assert.equal(headers.get("Content-Security-Policy"), "default-src 'none'");
  assert.equal(headers.get("X-Content-Type-Options"), "nosniff");
});

test("request ids accept only a safe charset and otherwise mint a UUID", () => {
  assert.equal(sanitizeRequestId("req_abc-123.OK"), "req_abc-123.OK");
  assert.notEqual(sanitizeRequestId("id with spaces"), "id with spaces");
  assert.notEqual(sanitizeRequestId("a\nb"), "a\nb");
  assert.notEqual(sanitizeRequestId("short"), "short");
  assert.match(sanitizeRequestId(null), /^[0-9a-f-]{36}$/i);
});

test("vercel.json ships the production header set", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { dirname, join } = await import("node:path");
  const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
  const raw = readFileSync(join(root, "vercel.json"), "utf8");
  assert.match(raw, /X-Content-Type-Options/);
  assert.match(raw, /Strict-Transport-Security/);
  assert.match(raw, /Content-Security-Policy/);
  assert.match(raw, /object-src 'none'/);
});
