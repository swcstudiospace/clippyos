import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { desktopLoadingPageHtml, stageSidecar } from "./build-desktop-server.ts";

test("loading page is standalone HTML with the ClippyOS mark and no external fetches", () => {
  const html = desktopLoadingPageHtml();
  assert.match(html, /<!DOCTYPE html>/i);
  assert.match(html, /ClippyOS/);
  assert.match(html, /Starting local engine/);
  assert.doesNotMatch(html, /https?:\/\//i); // fully offline — no CDN fonts/scripts
});

test("stageSidecar copies the nitro output and rejects a missing server entry", () => {
  const work = mkdtempSync(join(tmpdir(), "desktop-stage-"));
  try {
    const nitro = join(work, ".output");
    const out = join(work, "dist-desktop");

    // Missing entry -> throws instead of staging a broken bundle.
    mkdirSync(nitro, { recursive: true });
    writeFileSync(join(nitro, "placeholder.txt"), "x");
    assert.throws(() => stageSidecar({ root: work }), /index\.mjs/);

    // Present entry -> staged with the loading page at the frontendDist root.
    mkdirSync(join(nitro, "server"), { recursive: true });
    writeFileSync(join(nitro, "server", "index.mjs"), "export {};");
    writeFileSync(join(nitro, "dist-marker.txt"), "client-assets");
    const staged = stageSidecar({ root: work });
    assert.equal(staged.serverEntry, join(out, "server", "index.mjs"));
    assert.ok(existsSync(staged.serverEntry));
    assert.ok(existsSync(join(out, "index.html")));
    assert.ok(!existsSync(join(out, "placeholder.txt"))); // stale files never leak
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});
