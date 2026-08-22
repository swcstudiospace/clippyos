import assert from "node:assert/strict";
import { test } from "node:test";
import { APP_NAME, APP_TAGLINE, BRAND_ACCENT_HEX } from "./constants.ts";

test("product identity is ClippyOS, not an admin panel", () => {
  assert.equal(APP_NAME, "ClippyOS");
  assert.doesNotMatch(APP_NAME, / /);
  assert.equal(APP_TAGLINE, "Autonomous Operating System for Clipping");
  assert.match(APP_TAGLINE, /Autonomous Operating System/i);
  assert.match(APP_TAGLINE, /Clipping/);
  assert.doesNotMatch(APP_NAME, /Admin/i);
  assert.equal(BRAND_ACCENT_HEX, "#10B981");
});
