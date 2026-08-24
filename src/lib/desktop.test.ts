import assert from "node:assert/strict";
import { test } from "node:test";
import { isTauriRuntime, shouldRegisterServiceWorker } from "./desktop.ts";

test("plain browser is not the Tauri runtime and keeps PWA registration", () => {
  // node --test has no `window`; the guard must tolerate that shape.
  assert.equal(isTauriRuntime(), false);
  assert.equal(shouldRegisterServiceWorker(), true);
});

test("a window with __TAURI_INTERNALS__ is the desktop shell and skips PWA", () => {
  globalThis.window = { __TAURI_INTERNALS__: {} };
  try {
    assert.equal(isTauriRuntime(), true);
    assert.equal(shouldRegisterServiceWorker(), false);
  } finally {
    delete globalThis.window;
  }
});

test("a plain window object (no Tauri internals) still registers", () => {
  globalThis.window = { location: { search: "" } };
  try {
    assert.equal(isTauriRuntime(), false);
    assert.equal(shouldRegisterServiceWorker(), true);
  } finally {
    delete globalThis.window;
  }
});
