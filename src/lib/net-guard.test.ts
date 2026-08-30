import assert from "node:assert/strict";
import { test } from "node:test";
import { isBlockedFetchHost, isPrivateOrLocalHostname } from "./net-guard.ts";

test("loopback, RFC1918, link-local, and metadata hosts are blocked", () => {
  for (const host of [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "10.0.0.4",
    "192.168.1.9",
    "172.16.0.1",
    "169.254.169.254",
    "metadata.google.internal",
    "foo.internal",
    "app.localhost",
  ]) {
    assert.equal(isPrivateOrLocalHostname(host), true, host);
    assert.equal(isBlockedFetchHost(host), true, host);
  }
});

test("public hostnames are allowed; raw IP literals are not", () => {
  assert.equal(isBlockedFetchHost("clips.twitch.tv"), false);
  assert.equal(isBlockedFetchHost("cdn-crayo.com"), false);
  assert.equal(isBlockedFetchHost("1.1.1.1"), true);
  assert.equal(isBlockedFetchHost("8.8.8.8"), true);
  assert.equal(isBlockedFetchHost(""), true);
});
