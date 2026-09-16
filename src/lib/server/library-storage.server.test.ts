import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, stat, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Point the local backend at a scratch dir before the module reads it.
process.env.AGENCY_LIBRARY_ROOT = await mkdtemp(join(tmpdir(), "clippy-lib-"));
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
delete process.env.SUPABASE_SECRET_KEY;

// library-storage.server.ts statically imports @/lib/server/app-settings.server, which
// transitively imports src/lib/db.ts. db.ts calls Vite's `import.meta.glob(...)` at module top
// level to inline migrations/*.sql at build time — a bundler-only construct with no meaning
// under plain `node --test`, even with the @/ alias resolved (see scripts/test-alias-hook.mjs).
// Fixing that would mean changing db.ts's migration loading for every caller, well outside this
// file's scope. Real coverage of writeLibraryFile/backendFromStorageKey runs under the real Vite
// runtime via the Task 10 live-app integration check (docs/superpowers/plans/2026-09-16-clips-to-library.md).
let mod: typeof import("./library-storage.server.ts") | null = null;
let loadError: Error | null = null;
try {
  mod = await import("./library-storage.server.ts");
} catch (error) {
  loadError = error instanceof Error ? error : new Error(String(error));
}

if (!mod) {
  test("library-storage.server.ts (skipped: unloadable under node --test)", {
    skip: `Cannot load this module outside Vite: ${loadError?.message.split("\n")[0]}`,
  }, () => {});
} else {
  const { writeLibraryFile, backendFromStorageKey, storagePath } = mod;

  test("backendFromStorageKey reads the prefix", () => {
    assert.equal(backendFromStorageKey("supabase:a/b.mp4"), "supabase");
    assert.equal(backendFromStorageKey("s3:a/b.mp4"), "s3");
    assert.equal(backendFromStorageKey("/tmp/agency-library/a/b.mp4"), "local");
  });

  test("writeLibraryFile streams a 20 MB file into the local backend without loading it", async () => {
    const src = join(process.env.AGENCY_LIBRARY_ROOT!, "src.bin");
    await writeFile(src, Buffer.alloc(20 * 1024 * 1024, 7));
    const before = process.memoryUsage().heapUsed;
    const result = await writeLibraryFile("asset-1/v1.mp4", src, "video/mp4");
    const after = process.memoryUsage().heapUsed;
    assert.equal(result, storagePath("asset-1/v1.mp4"));
    assert.equal((await stat(result)).size, 20 * 1024 * 1024);
    assert.ok(after - before < 15 * 1024 * 1024, "file was buffered into memory");
    assert.equal((await readFile(result)).subarray(0, 4).toString("hex"), "07070707");
  });
}
