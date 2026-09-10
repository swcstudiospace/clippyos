import assert from "node:assert/strict";
import { test } from "node:test";
import { oauthNavigationMode } from "./oauth-navigation.ts";

test("desktop deployed login stays in the same window", () => {
  assert.equal(
    oauthNavigationMode({ livePreview: false, standalone: false, userAgent: "Mozilla/5.0 Chrome/120" }),
    "same-window",
  );
});

test("mobile Google OAuth uses a browser tab, not the system Google app", () => {
  assert.equal(
    oauthNavigationMode({
      livePreview: false,
      standalone: false,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    }),
    "browser-tab",
  );
  assert.equal(
    oauthNavigationMode({
      livePreview: false,
      standalone: false,
      userAgent: "Mozilla/5.0 (Linux; Android 14) Chrome/120.0.0.0 Mobile",
    }),
    "browser-tab",
  );
});

test("installed PWA standalone also uses a browser tab", () => {
  assert.equal(
    oauthNavigationMode({ livePreview: false, standalone: true, userAgent: "Mozilla/5.0 Chrome/120" }),
    "browser-tab",
  );
});

test("live preview still uses the existing popup path", () => {
  assert.equal(
    oauthNavigationMode({
      livePreview: true,
      standalone: true,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    }),
    "popup-preview",
  );
});
