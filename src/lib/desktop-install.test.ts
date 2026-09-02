import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canOfferNativeInstall,
  captureBeforeInstallPrompt,
  DESKTOP_INSTALLED_LABEL,
  httpsInstallerUrl,
  installSurface,
  isIpadOs,
  isMacOS,
  isSafariBrowser,
  spentBeforeInstallPrompt,
} from "./desktop-install.ts";

test("macOS desktop is detected from UA and client hints, not iPadOS", () => {
  assert.equal(isMacOS({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" }), true);
  assert.equal(
    isMacOS({ userAgent: "Mozilla/5.0", userAgentData: { platform: "macOS" } }),
    true,
  );
  assert.equal(
    isMacOS({ userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)" }),
    false,
  );
  assert.equal(
    isMacOS({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", maxTouchPoints: 5 }),
    false,
  );
  assert.equal(isIpadOs({ userAgent: "Mozilla/5.0 (Macintosh)", maxTouchPoints: 5 }), true);
});

test("Safari is distinguished from Chromium on macOS", () => {
  assert.equal(
    isSafariBrowser(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    ),
    true,
  );
  assert.equal(
    isSafariBrowser(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ),
    false,
  );
});

test("installer URL must be https and otherwise empty", () => {
  assert.equal(httpsInstallerUrl(""), "");
  assert.equal(httpsInstallerUrl("  "), "");
  assert.equal(httpsInstallerUrl("http://example.com/ClippyOS.dmg"), "");
  assert.equal(httpsInstallerUrl("not a url"), "");
  assert.equal(
    httpsInstallerUrl("https://github.com/swcstudiospace/clippyos/releases/download/v1.0.0/ClippyOS.dmg"),
    "https://github.com/swcstudiospace/clippyos/releases/download/v1.0.0/ClippyOS.dmg",
  );
});

test("native DMG is offered only on online macOS browsers with a URL", () => {
  assert.equal(
    canOfferNativeInstall({
      isTauri: false,
      isMacOS: true,
      isOnline: true,
      nativeUrl: "https://example.com/ClippyOS.dmg",
    }),
    true,
  );
  assert.equal(
    canOfferNativeInstall({
      isTauri: true,
      isMacOS: true,
      isOnline: true,
      nativeUrl: "https://example.com/ClippyOS.dmg",
    }),
    false,
  );
  assert.equal(
    canOfferNativeInstall({
      isTauri: false,
      isMacOS: true,
      isOnline: false,
      nativeUrl: "https://example.com/ClippyOS.dmg",
    }),
    false,
  );
  assert.equal(
    canOfferNativeInstall({
      isTauri: false,
      isMacOS: true,
      isOnline: true,
      nativeUrl: "",
    }),
    false,
  );
});

test("install surface hides prompts inside Tauri and prefers macOS native otherwise", () => {
  assert.equal(installSurface({ isTauri: true, isMacOS: true }), "tauri");
  assert.equal(installSurface({ isTauri: false, isMacOS: true }), "macos-browser");
  assert.equal(installSurface({ isTauri: false, isMacOS: false }), "pwa");
  assert.equal(DESKTOP_INSTALLED_LABEL, "ClippyOS Desktop Installed");
});

test("beforeinstallprompt is stashed and never auto-fired", () => {
  let prompted = 0;
  let prevented = 0;
  const event = {
    preventDefault() {
      prevented += 1;
    },
    async prompt() {
      prompted += 1;
    },
    userChoice: Promise.resolve({ outcome: "dismissed" as const }),
  };
  const stashed = captureBeforeInstallPrompt(event);
  assert.equal(prevented, 1);
  assert.equal(prompted, 0);
  assert.equal(stashed, event);
  assert.equal(spentBeforeInstallPrompt(), null);
});
