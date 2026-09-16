# Clips to Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After a Crayo AutoClip finishes, export every clip project to an mp4, store it in the library (Supabase Storage bucket `clippy-library`, with the existing S3 → local-disk fallback), and let operators preview and download it from the Library and the Agent results panel.

**Architecture:** A new server module `clip-export.server.ts` owns "Crayo clip project → stored library asset" and is called by both the synchronous `runAutoclip` path and a new `exporting` phase of the background media-fetch job. Files stream from Crayo's CDN to a temp file on disk, are probed there, then streamed into storage, so a Vercel function never holds a clip in memory. Idempotency is keyed on a new `external_ref` column (`crayo:project:<id>`); the clip thumbnail is stored as a second version row referenced by a new `thumbnail_version_id` column.

**Tech Stack:** TypeScript (TanStack Start server functions, Node 24), Supabase Storage via `@supabase/supabase-js`, node:test with `--experimental-strip-types`, Playwright Firefox for the manual integration check.

**Spec:** `docs/superpowers/specs/2026-09-16-clips-to-library-design.md`

## Global Constraints

- Tests run with `npm test` → `node --test --experimental-strip-types --test-reporter=spec 'scripts/**/*.test.ts' 'src/**/*.test.ts'`. Test files import siblings with explicit `.ts` extensions. Run a single file with `node --experimental-strip-types --test <file>`.
- Dependency injection style: the unit under test takes its dependencies as plain parameters (see `src/lib/server/cron-auth.server.test.ts`). No module mocking.
- Server-only modules end in `.server.ts` and are imported from client-reachable files only via dynamic `import()` inside server function handlers.
- Never log, echo, or store the Crayo key. Never put secrets in test fixtures.
- Storage bucket: `LIBRARY_BUCKET = "clippy-library"` (`src/lib/social-machine.ts:439`), per-object limit 512 MB. Hard export ceiling per run: 10. Concurrent exports in the job: 2.
- Progress lines go through the existing `progress()` helper in `media-fetch-job.server.ts`; error codes are UPPER_SNAKE strings matching `/^[A-Z_]{3,60}$/`.
- Commit after every task; commit messages in the repo's `type: summary` style.
- Branch: `feat/clips-to-library` (already exists, based on `origin/main`).

---

## File structure

| File | Responsibility |
|---|---|
| `src/lib/server/library.server.ts` (modify) | DDL + insert/patch helpers gain `external_ref` and `thumbnail_version_id`; new `findAssetByExternalRef`. |
| `src/lib/library.ts` (modify) | `LibraryAsset` gains `externalRef`, `thumbnailVersionId`, `thumbnailUrl`. |
| `src/lib/server/library-storage.server.ts` (modify) | New `writeLibraryFile(key, path, contentType)` streaming write; new `backendFromStorageKey`. |
| `src/lib/server/library-pipeline.server.ts` (modify) | New `ingestFile(...)` (path-based twin of `ingestBytes`) that streams and probes from disk. |
| `src/lib/clip-export.ts` (new, client-safe) | Pure helpers: `planExportBudget`, `readExportPayload`, `readAutoclipClips`, `clipExternalRef`. Unit tested. |
| `src/lib/server/clip-export.server.ts` (new) | `exportClipToLibrary`, `exportClipStep`, `downloadToTempFile`. Takes a `CrayoExportClient` parameter. |
| `src/lib/server/media-fetch-job.server.ts` (modify) | New `exporting` phase; thumbnail-only ingest removed. |
| `src/lib/server/crayo-tools.server.ts` (modify) | `runAutoclip` and `crayo.export_project` call `exportClipToLibrary`. |
| `src/lib/server/library-fns.ts` (modify or create) | `signLibraryAssetsFn` server function returning preview + download URLs for asset ids. |
| `src/routes/api/library.file.ts` (modify) | `download=1` → attachment with the asset title as filename. |
| `src/lib/agent-results.ts` + `src/components/agent/results.tsx` (modify) | Structured clip results with player, Download, Retry. |
| `src/components/library/asset-card.tsx`, `asset-drawer.tsx` (modify) | Download button, backend label. |
| `src/lib/agent.ts`, `src/components/agent/tool-cards.tsx` (modify) | "Filebase library" copy → "Library". |
| Tests | `src/lib/clip-export.test.ts`, `src/lib/server/clip-export.server.test.ts`, `src/lib/server/library-storage.server.test.ts`, `src/lib/media-fetch.test.ts` (extended). |

---

### Task 1: Schema and lookup for external refs and thumbnails

**Files:**
- Modify: `src/lib/server/library.server.ts` (DDL at lines 47-71, `insertAsset` at 344-403, `patchAsset`, row mapper, `findByChecksum` neighbourhood)
- Modify: `src/lib/library.ts:81-105` (`LibraryAsset`)
- Test: `src/lib/library.test.ts` (create if absent)

**Interfaces:**
- Produces: `LibraryAsset.externalRef: string | null`, `LibraryAsset.thumbnailVersionId: string | null`, `LibraryAsset.thumbnailUrl: string | null`; `insertAsset` and `patchAsset` accept `external_ref?: string | null` and `thumbnail_version_id?: string | null`; `findAssetByExternalRef(ref: string): Promise<LibraryAsset | null>`; pure helper `clipExternalRef(projectId: string): string` in `src/lib/clip-export.ts`.

- [ ] **Step 1: Write the failing test for the pure helper**

Create `src/lib/clip-export.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { clipExternalRef } from "./clip-export.ts";

test("clipExternalRef is stable and namespaced", () => {
  assert.equal(clipExternalRef("proj_123"), "crayo:project:proj_123");
  assert.equal(clipExternalRef(" proj_123 "), "crayo:project:proj_123");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --experimental-strip-types --test src/lib/clip-export.test.ts`
Expected: FAIL, cannot find module `./clip-export.ts`.

- [ ] **Step 3: Create the helper module**

Create `src/lib/clip-export.ts`:

```ts
/** Client-safe helpers for the Crayo clip → Library export flow. No secrets, no I/O. */

export function clipExternalRef(projectId: string): string {
  return `crayo:project:${projectId.trim()}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --experimental-strip-types --test src/lib/clip-export.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Add the columns to the DDL**

In `src/lib/server/library.server.ts`, inside the `create table if not exists media_assets (...)` statement (lines 47-70), add after `parent_asset_id text,`:

```sql
  external_ref        text,
  thumbnail_version_id text,
```

Directly after the `media_assets_client_idx` index line add:

```sql
create index if not exists media_assets_external_ref_idx on media_assets (external_ref);
```

Then find where the schema is applied on an existing database (the function that runs this DDL, `ensureLibrarySchema`). If it only runs `create table if not exists`, add two idempotent statements right after it, in the same style the file already uses for the local SQL path:

```ts
await sql.query("alter table media_assets add column if not exists external_ref text");
await sql.query("alter table media_assets add column if not exists thumbnail_version_id text");
```

For Supabase, the existing code tolerates `isMissingColumn(error)` on insert; the production column is added by a migration file. Create `migrations/2026-09-16-media-assets-external-ref.sql`:

```sql
alter table media_assets add column if not exists external_ref text;
alter table media_assets add column if not exists thumbnail_version_id text;
create index if not exists media_assets_external_ref_idx on media_assets (external_ref);
```

(Check `migrations/` for the naming convention already used and match it.)

- [ ] **Step 6: Extend the type, insert, patch, and mapper**

In `src/lib/library.ts` add to `LibraryAsset` after `parentAssetId: string | null;`:

```ts
  externalRef: string | null;
  thumbnailVersionId: string | null;
  thumbnailUrl: string | null;
```

In `src/lib/server/library.server.ts`:

1. `insertAsset` row type: add `external_ref?: string | null;` and `thumbnail_version_id?: string | null;`. In `payload` add `external_ref: row.external_ref ?? null,` and `thumbnail_version_id: row.thumbnail_version_id ?? null,`. Add both columns to the local `insert into media_assets (...)` column list and the values list (`$23`, `$24`) and to the parameter array.
2. `patchAsset`: allow the same two keys (follow how `duration_sec` is handled there).
3. The row → `LibraryAsset` mapper (the function that produces `parentAssetId`): add `externalRef: row.external_ref ?? null`, `thumbnailVersionId: row.thumbnail_version_id ?? null`, `thumbnailUrl: null`.
4. `withPreview` (line ~230): also sign the thumbnail when present:

```ts
async function withPreview(asset: LibraryAsset): Promise<LibraryAsset> {
  const previewUrl = asset.currentVersionId ? await signVersionUrl(asset.currentVersionId).catch(() => null) : null;
  const thumbnailUrl = asset.thumbnailVersionId ? await signVersionUrl(asset.thumbnailVersionId).catch(() => null) : null;
  return { ...asset, previewUrl, thumbnailUrl };
}
```

5. Add next to `findByChecksum`:

```ts
export async function findAssetByExternalRef(ref: string): Promise<LibraryAsset | null> {
  await ensureLibrarySchema();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin.from("media_assets").select("*").eq("external_ref", ref).is("deleted_at", null).limit(1).maybeSingle();
    if (!error && data) return withPreview(mapAssetRow(data as Record<string, unknown>));
    if (error && !isMissingTable(error) && !isMissingColumn(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await localSql();
  const rows = await sql.query<Record<string, unknown>>(
    "select * from media_assets where external_ref = $1 and deleted_at is null limit 1",
    [ref],
  );
  return rows[0] ? withPreview(mapAssetRow(rows[0])) : null;
}
```

Use the file's real names for the row mapper and the soft-delete column (`deleted_at` is used by `archiveAsset`; if the column is named differently, match it).

- [ ] **Step 7: Type-check and run the existing library tests**

Run: `npx tsc --noEmit -p . 2>&1 | grep -E "library|clip-export"` → no output. Run: `npm test 2>&1 | tail -5` → all pass.

- [ ] **Step 8: Commit**

```bash
git add src/lib/library.ts src/lib/server/library.server.ts src/lib/clip-export.ts src/lib/clip-export.test.ts migrations/
git commit -m "feat(library): external_ref + thumbnail_version_id columns and lookup"
```

---

### Task 2: Pure export helpers (budget, payload readers)

**Files:**
- Modify: `src/lib/clip-export.ts`
- Test: `src/lib/clip-export.test.ts`

**Interfaces:**
- Produces:
  - `planExportBudget(input: { exportCredits: number | null; clipCount: number; ceiling?: number }): { ok: true; count: number } | { ok: false; reason: string }`
  - `readExportPayload(payload: unknown): { status: "pending" | "done" | "failed"; url: string | null; bytes: number | null; exportId: string | null }`
  - `readAutoclipClips(payload: unknown): { title: string; projectId: string; thumbnailUrl: string | null }[]`
  - `MAX_EXPORTS_PER_RUN = 10`, `EXPORT_CONCURRENCY = 2`, `BUCKET_OBJECT_LIMIT_BYTES = 512 * 1024 * 1024`

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/clip-export.test.ts`:

```ts
import { MAX_EXPORTS_PER_RUN, planExportBudget, readAutoclipClips, readExportPayload } from "./clip-export.ts";

test("planExportBudget refuses when credits are short and caps at the ceiling", () => {
  assert.deepEqual(planExportBudget({ exportCredits: 1, clipCount: 3 }), {
    ok: false,
    reason: "3 clips need 3 export credits; the Crayo account has 1. Nothing was exported.",
  });
  assert.deepEqual(planExportBudget({ exportCredits: 50, clipCount: 3 }), { ok: true, count: 3 });
  assert.deepEqual(planExportBudget({ exportCredits: 50, clipCount: 25 }), { ok: true, count: MAX_EXPORTS_PER_RUN });
  // unknown credits (account call failed) → proceed, Crayo enforces
  assert.deepEqual(planExportBudget({ exportCredits: null, clipCount: 2 }), { ok: true, count: 2 });
});

test("readExportPayload handles wrapped and flat shapes", () => {
  assert.deepEqual(readExportPayload({ export: { id: "exp_1", status: "processing" } }), {
    status: "pending", url: null, bytes: null, exportId: "exp_1",
  });
  assert.deepEqual(readExportPayload({ id: "exp_2", status: "completed", video_url: "https://cdn-crayo.com/x.mp4", file_size: 123 }), {
    status: "done", url: "https://cdn-crayo.com/x.mp4", bytes: 123, exportId: "exp_2",
  });
  assert.deepEqual(readExportPayload({ export: { id: "exp_3", status: "failed", error: "boom" } }), {
    status: "failed", url: null, bytes: null, exportId: "exp_3",
  });
  assert.equal(readExportPayload({ status: "completed", url: "http://insecure/x.mp4" }).url, null);
});

test("readAutoclipClips keeps only clips with a project id", () => {
  const rows = readAutoclipClips({
    autoclip: { status: "completed", clips: [
      { title: "A", project_id: "p1", thumbnail_url: "https://cdn-crayo.com/a.jpg" },
      { title: "", project_id: "p2" },
      { title: "no project" },
    ] },
  });
  assert.deepEqual(rows, [
    { title: "A", projectId: "p1", thumbnailUrl: "https://cdn-crayo.com/a.jpg" },
    { title: "AutoClip", projectId: "p2", thumbnailUrl: null },
  ]);
  // flat shape used by the sync path
  assert.equal(readAutoclipClips({ clips: [{ title: "B", id: "p3" }] })[0]?.projectId, "p3");
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --experimental-strip-types --test src/lib/clip-export.test.ts`
Expected: FAIL, `planExportBudget` is not exported.

- [ ] **Step 3: Implement**

Append to `src/lib/clip-export.ts`:

```ts
export const MAX_EXPORTS_PER_RUN = 10;
export const EXPORT_CONCURRENCY = 2;
export const BUCKET_OBJECT_LIMIT_BYTES = 512 * 1024 * 1024;

export function planExportBudget(input: {
  exportCredits: number | null;
  clipCount: number;
  ceiling?: number;
}): { ok: true; count: number } | { ok: false; reason: string } {
  const ceiling = input.ceiling ?? MAX_EXPORTS_PER_RUN;
  const count = Math.max(0, Math.min(ceiling, Math.floor(input.clipCount)));
  if (count === 0) return { ok: false, reason: "AutoClip returned no clips to export." };
  if (input.exportCredits != null && input.exportCredits < count) {
    return {
      ok: false,
      reason: `${count} clips need ${count} export credits; the Crayo account has ${input.exportCredits}. Nothing was exported.`,
    };
  }
  return { ok: true, count };
}

type Rec = Record<string, unknown>;
const rec = (v: unknown): Rec => (v && typeof v === "object" && !Array.isArray(v) ? (v as Rec) : {});
const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function readExportPayload(payload: unknown): {
  status: "pending" | "done" | "failed";
  url: string | null;
  bytes: number | null;
  exportId: string | null;
} {
  const outer = rec(payload);
  const inner = "export" in outer ? rec(outer.export) : outer;
  const raw = str(inner.status).toLowerCase();
  const status = raw === "completed" || raw === "complete" || raw === "succeeded" ? "done" : raw === "failed" || raw === "error" ? "failed" : "pending";
  const candidates = [inner.video_url, inner.videoUrl, inner.download_url, inner.downloadUrl, inner.url, rec(inner.output).url, rec(inner.result).url];
  const url = candidates.map(str).find((u) => u.startsWith("https://")) ?? null;
  const bytes = num(inner.file_size) ?? num(inner.bytes) ?? num(inner.size) ?? null;
  return { status, url: status === "done" ? url : null, bytes, exportId: str(inner.id) || null };
}

export function readAutoclipClips(payload: unknown): { title: string; projectId: string; thumbnailUrl: string | null }[] {
  const outer = rec(payload);
  const inner = "autoclip" in outer ? rec(outer.autoclip) : outer;
  const list = Array.isArray(inner.clips) ? inner.clips : [];
  const out: { title: string; projectId: string; thumbnailUrl: string | null }[] = [];
  for (const item of list.slice(0, 20)) {
    const clip = rec(item);
    const projectId = str(clip.project_id) || str(clip.projectId) || str(clip.id);
    if (!projectId) continue;
    const thumb = str(clip.thumbnail_url) || str(clip.thumbnailUrl);
    out.push({ title: str(clip.title) || "AutoClip", projectId, thumbnailUrl: thumb.startsWith("https://") ? thumb : null });
  }
  return out;
}
```

- [ ] **Step 4: Run tests**

Run: `node --experimental-strip-types --test src/lib/clip-export.test.ts` → PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/clip-export.ts src/lib/clip-export.test.ts
git commit -m "feat(clip-export): budget guard and Crayo payload readers"
```

---

### Task 3: Streaming file write in library storage

**Files:**
- Modify: `src/lib/server/library-storage.server.ts` (after `writeLibraryBytes`, lines 239-268)
- Test: `src/lib/server/library-storage.server.test.ts` (create)

**Interfaces:**
- Produces: `writeLibraryFile(key: string, filePath: string, contentType: string): Promise<string>` (same return contract as `writeLibraryBytes`: `supabase:<key>` | `s3:<key>` | local absolute path); `backendFromStorageKey(storageKey: string): "supabase" | "s3" | "local"`.
- Consumes: `storageClient()`, `ensureLibraryBucket()`, `loadS3Config()`, `storagePath()`, `ensureLibraryDir()`, `writeAppSetting`, `LIBRARY_BUCKET`, all already in the file.

- [ ] **Step 1: Write the failing test (local backend only, no Supabase/S3 env)**

Create `src/lib/server/library-storage.server.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, stat, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Point the local backend at a scratch dir before the module reads it.
process.env.AGENCY_LIBRARY_ROOT = await mkdtemp(join(tmpdir(), "clippy-lib-"));
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
delete process.env.SUPABASE_SECRET_KEY;

const { writeLibraryFile, backendFromStorageKey, storagePath } = await import("./library-storage.server.ts");

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
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --experimental-strip-types --test src/lib/server/library-storage.server.test.ts`
Expected: FAIL, `writeLibraryFile` is not a function.

- [ ] **Step 3: Implement**

In `src/lib/server/library-storage.server.ts` add imports `import { createReadStream } from "node:fs";` and `import { copyFile, stat } from "node:fs/promises";` (merge with existing imports), then after `writeLibraryBytes`:

```ts
export function backendFromStorageKey(storageKey: string): "supabase" | "s3" | "local" {
  if (storageKey.startsWith("supabase:")) return "supabase";
  if (storageKey.startsWith("s3:")) return "s3";
  return "local";
}

/**
 * Streaming twin of writeLibraryBytes for files already on disk (clip exports). Supabase gets a
 * readable stream with a known length; S3 falls back to a single read because s3Put takes a
 * Buffer; local copies the file into the spool. Unlike writeLibraryBytes, the local spool is NOT
 * written for cloud backends — the caller already has the file on disk for probing.
 */
export async function writeLibraryFile(key: string, filePath: string, contentType: string): Promise<string> {
  const size = (await stat(filePath)).size;
  const client = await storageClient();
  if (client && (await ensureLibraryBucket())) {
    const { error } = await client.storage.from(LIBRARY_BUCKET).upload(key, createReadStream(filePath), {
      upsert: true,
      contentType,
      duplex: "half",
      // @ts-expect-error supabase-js forwards unknown options to fetch; length lets it stream
      headers: { "content-length": String(size) },
    });
    if (!error) {
      await writeAppSetting(BACKEND_KEY, "supabase");
      return `supabase:${key}`;
    }
    console.error("[library-storage] supabase stream upload failed", scrubError(error));
  }
  const s3 = await loadS3Config();
  if (s3) {
    try {
      const { s3Put } = await import("@/lib/server/s3.server");
      await s3Put(s3, key, await readFile(filePath));
      await writeAppSetting(BACKEND_KEY, "s3");
      return `s3:${key}`;
    } catch {
      /* fall through */
    }
  }
  await ensureLibraryDir();
  const path = storagePath(key);
  await mkdir(dirname(path), { recursive: true });
  await copyFile(filePath, path);
  await writeAppSetting(BACKEND_KEY, "local");
  return path;
}

function scrubError(error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String((error as { message: unknown }).message) : String(error);
  return message.replace(/https?:\/\/\S+/g, "<url>").slice(0, 200);
}
```

If `client.storage.from().upload` rejects the stream at type level in this supabase-js version, wrap the stream: `Readable.toWeb(createReadStream(filePath)) as unknown as Blob` and drop the `headers`/`duplex` options; verify with a real upload in Task 9. Keep whichever form compiles and uploads.

- [ ] **Step 4: Run tests**

Run: `node --experimental-strip-types --test src/lib/server/library-storage.server.test.ts` → PASS (2 tests). Run `npx tsc --noEmit -p . 2>&1 | grep library-storage` → no output.

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/library-storage.server.ts src/lib/server/library-storage.server.test.ts
git commit -m "feat(library-storage): streaming writeLibraryFile and backendFromStorageKey"
```

---

### Task 4: Path-based ingest that probes from disk

**Files:**
- Modify: `src/lib/server/library-pipeline.server.ts` (next to `ingestBytes`, lines 184-249; `finalizeProbe` 251-279)

**Interfaces:**
- Produces: `ingestFile(input: { actorId: string; clientId: string | null; title: string; filePath: string; mimeHint: string; filename: string; source: AssetSource; sourceRef?: string | null; externalRef?: string | null; tags?: string[]; note?: string }): Promise<{ asset: LibraryAsset; duplicate: boolean }>`
- Produces: `attachThumbnail(input: { assetId: string; bytes: Buffer; mimeHint: string }): Promise<string>` returning the thumbnail version id.
- Consumes: Task 1 columns, Task 3 `writeLibraryFile`.

- [ ] **Step 1: Implement `ingestFile`**

Add after `ingestBytes`:

```ts
async function hashFile(path: string): Promise<string> {
  const { createHash } = await import("node:crypto");
  const { createReadStream } = await import("node:fs");
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    createReadStream(path).on("data", (chunk) => hash.update(chunk)).on("error", reject).on("end", () => resolve(hash.digest("hex")));
  });
}

/** Disk-backed twin of ingestBytes: streams into storage and probes the file where it sits. */
export async function ingestFile(input: {
  actorId: string;
  clientId: string | null;
  title: string;
  filePath: string;
  mimeHint: string;
  filename: string;
  source: AssetSource;
  sourceRef?: string | null;
  externalRef?: string | null;
  tags?: string[];
  note?: string;
}): Promise<{ asset: LibraryAsset; duplicate: boolean }> {
  const { stat } = await import("node:fs/promises");
  const { writeLibraryFile } = await import("@/lib/server/library-storage.server");
  const byteSize = (await stat(input.filePath)).size;
  const mime = input.mimeHint || "application/octet-stream";
  const kind = kindFromMime(mime);
  const checksum = await hashFile(input.filePath);
  const existing = await findByChecksum(input.clientId, checksum);
  if (existing) return { asset: existing, duplicate: true };

  const assetId = libraryNewId();
  const versionId = libraryNewId();
  const ext = extFromMime(mime, input.filename);
  const key = makeStorageKey(assetId, versionId, ext);
  const storageKey = await writeLibraryFile(key, input.filePath, mime);
  const title = sanitizeText(input.title || input.filename || "Untitled").slice(0, 160) || "Untitled";
  await insertAsset({
    id: assetId,
    client_id: input.clientId,
    kind,
    title,
    source: input.source,
    source_ref: input.sourceRef ?? null,
    external_ref: input.externalRef ?? null,
    status: "PROCESSING",
    mime_type: mime,
    byte_size: byteSize,
    checksum,
    current_version_id: versionId,
    tags: input.tags,
    created_by: input.actorId,
  });
  await insertVersion({
    id: versionId,
    asset_id: assetId,
    version_number: 1,
    storage_key: storageKey,
    mime_type: mime,
    byte_size: byteSize,
    checksum,
    note: input.note ?? "original",
  });
  await finalizeProbeFromPath(assetId, versionId, input.filePath, mime, byteSize, checksum);
  await audit(input.actorId, "library.ingest", assetId);
  emitAutonomyEvent({ type: "library.asset.ready", entityType: "media_asset", entityId: assetId, data: { source: input.source, kind, clientId: input.clientId } });
  const asset = await getAsset(assetId);
  if (!asset) throw new Error("ASSET_MISSING");
  return { asset, duplicate: false };
}

async function finalizeProbeFromPath(assetId: string, versionId: string, path: string, mime: string, byteSize: number, checksum: string) {
  try {
    await assertReadableMedia(path);
  } catch {
    await patchAsset(assetId, { status: "FAILED" });
    return;
  }
  const probe = await probeFile(path);
  await patchAsset(assetId, {
    status: "READY",
    mime_type: mime,
    byte_size: byteSize,
    checksum,
    current_version_id: versionId,
    duration_sec: probe.durationSec,
    width: probe.width,
    height: probe.height,
    aspect_ratio: aspectLabel(probe.width, probe.height),
  });
}

/** Store a small thumbnail as an extra version row and point the asset at it. */
export async function attachThumbnail(input: { assetId: string; bytes: Buffer; mimeHint: string }): Promise<string> {
  const { writeLibraryBytes } = await import("@/lib/server/library-storage.server");
  const mime = sniffMime(input.bytes, input.mimeHint, "thumb.jpg");
  const versionId = libraryNewId();
  const key = makeStorageKey(input.assetId, versionId, extFromMime(mime, "thumb.jpg"));
  const storageKey = await writeLibraryBytes(key, input.bytes);
  await insertVersion({
    id: versionId,
    asset_id: input.assetId,
    version_number: 0,
    storage_key: storageKey,
    mime_type: mime,
    byte_size: input.bytes.length,
    checksum: await hashBytes(input.bytes),
    note: "thumbnail",
  });
  await patchAsset(input.assetId, { thumbnail_version_id: versionId });
  return versionId;
}
```

Note: `writeLibraryBytes` in the existing code passes `storage_key: key` (unprefixed) to `insertVersion` in `ingestBytes` but returns the prefixed form; `readLibraryBytes` strips the prefix, so both forms work. `ingestFile` stores the prefixed form so `backendFromStorageKey` can label it.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit -p . 2>&1 | grep library-pipeline` → no output. Fix any name mismatches against the file's real helpers (`hashBytes`, `assertReadableMedia`, `probeFile`, `aspectLabel`, `audit`, `emitAutonomyEvent` all exist per the survey).

- [ ] **Step 3: Commit**

```bash
git add src/lib/server/library-pipeline.server.ts
git commit -m "feat(library-pipeline): ingestFile (disk-streamed) and attachThumbnail"
```

---

### Task 5: `clip-export.server.ts` with an injectable Crayo client

**Files:**
- Create: `src/lib/server/clip-export.server.ts`
- Test: `src/lib/server/clip-export.server.test.ts`

**Interfaces:**
- Produces:

```ts
export type CrayoExportClient = {
  exportProject(projectId: string): Promise<unknown>;
  getExport(exportId: string): Promise<unknown>;
  getAccount(): Promise<unknown>;
};
export type ClipExportState = {
  projectId: string;
  title: string;
  thumbnailUrl: string | null;
  exportId: string | null;
  status: "pending" | "exporting" | "stored" | "failed";
  assetId: string | null;
  error: string | null;
  bytes: number | null;
};
export type ClipExportDeps = {
  crayo: CrayoExportClient;
  findByExternalRef(ref: string): Promise<{ id: string } | null>;
  download(url: string, maxBytes: number): Promise<{ path: string; bytes: number; mime: string; cleanup(): Promise<void> }>;
  ingest(input: { path: string; bytes: number; mime: string; title: string; externalRef: string; sourceRef: string; actorId: string; clientId: string | null; tags: string[] }): Promise<{ assetId: string }>;
  attachThumbnail(assetId: string, thumbnailUrl: string): Promise<void>;
};
export function exportClipStep(state: ClipExportState, ctx: { actorId: string; clientId: string | null; sourceUrl: string; tags: string[] }, deps: ClipExportDeps): Promise<ClipExportState>;
export function exportClipToLibrary(input: { projectId: string; title: string; thumbnailUrl: string | null; actorId: string; clientId: string | null; sourceUrl: string; tags?: string[] }, deps?: ClipExportDeps): Promise<ClipExportState>;
export function readExportCredits(crayo: CrayoExportClient): Promise<number | null>;
export function defaultClipExportDeps(): ClipExportDeps;  // wires the real crayo.server, library-pipeline, storage
```

- `exportClipStep` performs exactly one transition per call: `pending` → (idempotency check; start export) → `exporting`; `exporting` → poll once → stays `exporting`, or downloads+ingests → `stored`, or → `failed`. `exportClipToLibrary` loops `exportClipStep` with a 3 s sleep until terminal (max 60 polls), for the synchronous callers.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/server/clip-export.server.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { exportClipStep, readExportCredits, type ClipExportDeps, type ClipExportState } from "./clip-export.server.ts";

function fakeDeps(over: Partial<ClipExportDeps> & { exportStatuses?: string[] } = {}): ClipExportDeps & { calls: string[] } {
  const calls: string[] = [];
  const statuses = [...(over.exportStatuses ?? ["processing", "completed"])];
  return {
    calls,
    crayo: {
      async exportProject(id) { calls.push(`export:${id}`); return { export: { id: "exp_1", status: "queued" } }; },
      async getExport(id) { calls.push(`poll:${id}`); const s = statuses.shift() ?? "completed"; return { export: { id, status: s, video_url: "https://cdn-crayo.com/c.mp4", file_size: 1000 } }; },
      async getAccount() { return { credits: { export: 7 } }; },
    },
    findByExternalRef: over.findByExternalRef ?? (async () => null),
    download: over.download ?? (async (url) => { calls.push(`download:${url}`); return { path: "/tmp/fake.mp4", bytes: 1000, mime: "video/mp4", cleanup: async () => { calls.push("cleanup"); } }; }),
    ingest: over.ingest ?? (async () => { calls.push("ingest"); return { assetId: "asset_1" }; }),
    attachThumbnail: over.attachThumbnail ?? (async () => { calls.push("thumb"); }),
  };
}
const base = (): ClipExportState => ({ projectId: "p1", title: "Clip", thumbnailUrl: "https://cdn-crayo.com/t.jpg", exportId: null, status: "pending", assetId: null, error: null, bytes: null });
const ctx = { actorId: "u1", clientId: null, sourceUrl: "https://www.youtube.com/watch?v=x", tags: ["autoclip"] };

test("pending → exporting starts the export once", async () => {
  const deps = fakeDeps();
  const s1 = await exportClipStep(base(), ctx, deps);
  assert.equal(s1.status, "exporting");
  assert.equal(s1.exportId, "exp_1");
  assert.deepEqual(deps.calls, ["export:p1"]);
});

test("exporting polls until done, then downloads, ingests, attaches thumbnail, cleans up", async () => {
  const deps = fakeDeps();
  let s = await exportClipStep(base(), ctx, deps);
  s = await exportClipStep(s, ctx, deps);            // processing
  assert.equal(s.status, "exporting");
  s = await exportClipStep(s, ctx, deps);            // completed
  assert.equal(s.status, "stored");
  assert.equal(s.assetId, "asset_1");
  assert.equal(s.bytes, 1000);
  assert.deepEqual(deps.calls, ["export:p1", "poll:exp_1", "poll:exp_1", "download:https://cdn-crayo.com/c.mp4", "ingest", "thumb", "cleanup"]);
});

test("already-stored project is a no-op via external ref", async () => {
  const deps = fakeDeps({ findByExternalRef: async () => ({ id: "asset_9" }) });
  const s = await exportClipStep(base(), ctx, deps);
  assert.equal(s.status, "stored");
  assert.equal(s.assetId, "asset_9");
  assert.deepEqual(deps.calls, []);
});

test("failed export marks only this clip failed with the provider message", async () => {
  const deps = fakeDeps({ exportStatuses: ["failed"] });
  let s = await exportClipStep(base(), ctx, deps);
  s = await exportClipStep(s, ctx, deps);
  assert.equal(s.status, "failed");
  assert.match(s.error ?? "", /export failed/i);
});

test("storage failure cleans up and fails the clip", async () => {
  const deps = fakeDeps({ exportStatuses: ["completed"], ingest: async () => { throw new Error("SUPABASE_DOWN"); } });
  let s = await exportClipStep(base(), ctx, deps);
  s = await exportClipStep(s, ctx, deps);
  assert.equal(s.status, "failed");
  assert.equal(s.error, "SUPABASE_DOWN");
  assert.ok(deps.calls.includes("cleanup"));
});

test("oversized export is refused before download", async () => {
  const deps = fakeDeps();
  deps.crayo.getExport = async (id) => ({ export: { id, status: "completed", video_url: "https://cdn-crayo.com/big.mp4", file_size: 600 * 1024 * 1024 } });
  let s = await exportClipStep(base(), ctx, deps);
  s = await exportClipStep(s, ctx, deps);
  assert.equal(s.status, "failed");
  assert.match(s.error ?? "", /512 MB/);
  assert.ok(!deps.calls.some((c) => c.startsWith("download:")));
});

test("readExportCredits tolerates a failing account call", async () => {
  assert.equal(await readExportCredits({ async exportProject() { return null; }, async getExport() { return null; }, async getAccount() { return { credits: { export: 7 } }; } }), 7);
  assert.equal(await readExportCredits({ async exportProject() { return null; }, async getExport() { return null; }, async getAccount() { throw new Error("x"); } }), null);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --experimental-strip-types --test src/lib/server/clip-export.server.test.ts` → FAIL, module not found.

- [ ] **Step 3: Implement the module**

Create `src/lib/server/clip-export.server.ts`:

```ts
/**
 * Crayo clip project → stored Library asset. Pure orchestration over injected deps so the
 * transitions are unit-testable; `defaultClipExportDeps()` wires the real Crayo client,
 * library pipeline and storage. Never import from client code.
 */
import { BUCKET_OBJECT_LIMIT_BYTES, clipExternalRef, readExportPayload } from "@/lib/clip-export";

export type CrayoExportClient = {
  exportProject(projectId: string): Promise<unknown>;
  getExport(exportId: string): Promise<unknown>;
  getAccount(): Promise<unknown>;
};

export type ClipExportState = {
  projectId: string;
  title: string;
  thumbnailUrl: string | null;
  exportId: string | null;
  status: "pending" | "exporting" | "stored" | "failed";
  assetId: string | null;
  error: string | null;
  bytes: number | null;
};

export type ClipExportDeps = {
  crayo: CrayoExportClient;
  findByExternalRef(ref: string): Promise<{ id: string } | null>;
  download(url: string, maxBytes: number): Promise<{ path: string; bytes: number; mime: string; cleanup(): Promise<void> }>;
  ingest(input: {
    path: string; bytes: number; mime: string; title: string; externalRef: string; sourceRef: string;
    actorId: string; clientId: string | null; tags: string[];
  }): Promise<{ assetId: string }>;
  attachThumbnail(assetId: string, thumbnailUrl: string): Promise<void>;
};

export type ClipExportContext = { actorId: string; clientId: string | null; sourceUrl: string; tags: string[] };

const POLL_MS = 3000;
const MAX_POLLS = 60;

function message(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).replace(/https?:\/\/\S+/g, "<url>").slice(0, 300);
}

export async function readExportCredits(crayo: CrayoExportClient): Promise<number | null> {
  try {
    const raw = (await crayo.getAccount()) as { credits?: { export?: unknown } } | null;
    const value = raw?.credits?.export;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

/** One transition. Safe to call repeatedly; terminal states return unchanged. */
export async function exportClipStep(state: ClipExportState, ctx: ClipExportContext, deps: ClipExportDeps): Promise<ClipExportState> {
  if (state.status === "stored" || state.status === "failed") return state;
  const ref = clipExternalRef(state.projectId);
  try {
    if (state.status === "pending") {
      const existing = await deps.findByExternalRef(ref);
      if (existing) return { ...state, status: "stored", assetId: existing.id, error: null };
      const queued = readExportPayload(await deps.crayo.exportProject(state.projectId));
      if (!queued.exportId) return { ...state, status: "failed", error: "Crayo did not return an export id." };
      return { ...state, status: "exporting", exportId: queued.exportId };
    }
    // exporting
    const polled = readExportPayload(await deps.crayo.getExport(state.exportId!));
    if (polled.status === "pending") return state;
    if (polled.status === "failed" || !polled.url) return { ...state, status: "failed", error: "Crayo export failed." };
    if (polled.bytes != null && polled.bytes > BUCKET_OBJECT_LIMIT_BYTES) {
      return { ...state, status: "failed", error: `Export is ${Math.round(polled.bytes / 1048576)} MB; the library bucket allows 512 MB per file.` };
    }
    const file = await deps.download(polled.url, BUCKET_OBJECT_LIMIT_BYTES);
    try {
      const { assetId } = await deps.ingest({
        path: file.path, bytes: file.bytes, mime: file.mime, title: state.title, externalRef: ref,
        sourceRef: ctx.sourceUrl, actorId: ctx.actorId, clientId: ctx.clientId, tags: ctx.tags,
      });
      if (state.thumbnailUrl) await deps.attachThumbnail(assetId, state.thumbnailUrl).catch(() => {});
      return { ...state, status: "stored", assetId, bytes: file.bytes, error: null };
    } finally {
      await file.cleanup();
    }
  } catch (error) {
    return { ...state, status: "failed", error: message(error) };
  }
}

/** Synchronous convenience for callers that can wait (direct-file /autoclip, /export). */
export async function exportClipToLibrary(
  input: { projectId: string; title: string; thumbnailUrl: string | null; actorId: string; clientId: string | null; sourceUrl: string; tags?: string[] },
  deps: ClipExportDeps = defaultClipExportDeps(),
): Promise<ClipExportState> {
  let state: ClipExportState = { projectId: input.projectId, title: input.title, thumbnailUrl: input.thumbnailUrl, exportId: null, status: "pending", assetId: null, error: null, bytes: null };
  const ctx: ClipExportContext = { actorId: input.actorId, clientId: input.clientId, sourceUrl: input.sourceUrl, tags: input.tags ?? ["crayo", "autoclip"] };
  for (let i = 0; i < MAX_POLLS + 2; i += 1) {
    const next = await exportClipStep(state, ctx, deps);
    if (next.status === "stored" || next.status === "failed") return next;
    if (next.status === "exporting" && state.status === "exporting") await new Promise((r) => setTimeout(r, POLL_MS));
    state = next;
  }
  return { ...state, status: "failed", error: "Crayo export is still processing." };
}

/** Stream an https URL to a temp file with a byte ceiling. */
export async function downloadToTempFile(url: string, maxBytes: number): Promise<{ path: string; bytes: number; mime: string; cleanup(): Promise<void> }> {
  const { mkdtemp, rm } = await import("node:fs/promises");
  const { createWriteStream } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { pipeline } = await import("node:stream/promises");
  const { Readable, Transform } = await import("node:stream");
  const { isTrustedLibraryUrl } = await import("@/lib/server/library-pipeline.server");
  if (!isTrustedLibraryUrl(url)) throw new Error("UNTRUSTED_URL");
  const response = await fetch(url, { redirect: "follow", headers: { "User-Agent": "ClippyAdmin/1.0" }, signal: AbortSignal.timeout(10 * 60 * 1000) });
  if (!response.ok || !response.body) throw new Error("UNTRUSTED_URL");
  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new Error("MEDIA_TOO_LARGE");
  const dir = await mkdtemp(join(tmpdir(), "clip-export-"));
  const path = join(dir, "clip.mp4");
  let bytes = 0;
  const limiter = new Transform({
    transform(chunk, _enc, cb) {
      bytes += chunk.length;
      if (bytes > maxBytes) cb(new Error("MEDIA_TOO_LARGE"));
      else cb(null, chunk);
    },
  });
  const cleanup = async () => { await rm(dir, { recursive: true, force: true }); };
  try {
    await pipeline(Readable.fromWeb(response.body as never), limiter, createWriteStream(path));
  } catch (error) {
    await cleanup();
    throw error;
  }
  const mime = response.headers.get("content-type")?.split(";")[0]?.trim() || "video/mp4";
  return { path, bytes, mime, cleanup };
}

export function defaultClipExportDeps(): ClipExportDeps {
  return {
    crayo: {
      exportProject: async (id) => (await import("@/lib/server/crayo.server")).crayoExportProject(id),
      getExport: async (id) => (await import("@/lib/server/crayo.server")).crayoGetExport(id),
      getAccount: async () => (await import("@/lib/server/crayo.server")).crayoGetAccount(),
    },
    findByExternalRef: async (ref) => (await import("@/lib/server/library.server")).findAssetByExternalRef(ref),
    download: downloadToTempFile,
    ingest: async (input) => {
      const { ingestFile } = await import("@/lib/server/library-pipeline.server");
      const { asset } = await ingestFile({
        actorId: input.actorId, clientId: input.clientId, title: input.title, filePath: input.path,
        mimeHint: input.mime, filename: `${input.title}.mp4`, source: "AGENT", sourceRef: input.sourceRef.slice(0, 500),
        externalRef: input.externalRef, tags: ["crayo", ...input.tags], note: "crayo export",
      });
      return { assetId: asset.id };
    },
    attachThumbnail: async (assetId, thumbnailUrl) => {
      const { isTrustedLibraryUrl, attachThumbnail } = await import("@/lib/server/library-pipeline.server");
      if (!isTrustedLibraryUrl(thumbnailUrl)) return;
      const response = await fetch(thumbnailUrl, { signal: AbortSignal.timeout(20_000) });
      if (!response.ok) return;
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length > 5 * 1024 * 1024) return;
      await attachThumbnail({ assetId, bytes, mimeHint: response.headers.get("content-type") ?? "image/jpeg" });
    },
  };
}
```

- [ ] **Step 4: Run tests and type-check**

Run: `node --experimental-strip-types --test src/lib/server/clip-export.server.test.ts` → PASS (7 tests). `npx tsc --noEmit -p . 2>&1 | grep clip-export` → no output.

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/clip-export.server.ts src/lib/server/clip-export.server.test.ts
git commit -m "feat(clip-export): resumable Crayo export → library asset with injectable deps"
```

---

### Task 6: `exporting` phase in the background job

**Files:**
- Modify: `src/lib/server/media-fetch-job.server.ts` (types 43-77; upload→autoclipping transition 428-436; autoclipping block 439-490)
- Test: `src/lib/media-fetch.test.ts` (extend) — only if `parseMediaJobStatus`/state parsing lives there; otherwise the phase is covered by Task 5 tests plus the integration check.

**Interfaces:**
- Consumes: `exportClipStep`, `defaultClipExportDeps`, `readExportCredits` (Task 5); `planExportBudget`, `readAutoclipClips`, `EXPORT_CONCURRENCY` (Task 2).
- Produces: `MediaFetchJobState.phase` includes `"exporting"`; `SegmentState.clips: ClipExportState[]`; `run.outputs.libraryClips: { title, projectId, assetId, status, error }[]` on completion.

- [ ] **Step 1: Update the types**

Replace `clips?: { title: string; projectId: string | null; thumbnailUrl: string | null; library: unknown }[];` in `SegmentState` with:

```ts
  clips?: import("@/lib/server/clip-export.server").ClipExportState[];
```

Add `"exporting"` to the `phase` union of `MediaFetchJobState`, and add `exportBudget?: { count: number; credits: number | null } | null;` to the state.

- [ ] **Step 2: Replace the autoclipping completion block**

Replace lines 445-457 (the `if (status === "completed" ...)` branch inside the `autoclipping` loop) with:

```ts
        if (status === "completed" || status === "complete" || status === "succeeded") {
          const { readAutoclipClips } = await import("@/lib/clip-export");
          seg.clips = readAutoclipClips(payload).map((clip) => ({
            projectId: clip.projectId, title: clip.title, thumbnailUrl: clip.thumbnailUrl,
            exportId: null, status: "pending" as const, assetId: null, error: null, bytes: null,
          }));
          seg.state = "done";
          await progress(runId, state, `Segment ${seg.index + 1}: ${seg.clips.length} clip(s) ready in Crayo. Exporting next.`);
        }
```

Then replace the `if (state.segments.every((seg) => seg.state === "done")) { state.phase = "done"; ... return "done"; }` block with a transition into the export phase:

```ts
      if (state.segments.every((seg) => seg.state === "done")) {
        const { planExportBudget } = await import("@/lib/clip-export");
        const { readExportCredits, defaultClipExportDeps } = await import("@/lib/server/clip-export.server");
        const allClips = state.segments.flatMap((seg) => seg.clips ?? []);
        const credits = await readExportCredits(defaultClipExportDeps().crayo);
        const budget = planExportBudget({ exportCredits: credits, clipCount: allClips.length });
        if (!budget.ok) return await fail("EXPORT_BUDGET", budget.reason);
        // Trim to the budget: clips beyond the ceiling stay in Crayo untouched.
        let remaining = budget.count;
        for (const seg of state.segments) {
          seg.clips = (seg.clips ?? []).map((clip) => (remaining-- > 0 ? clip : { ...clip, status: "failed" as const, error: "Over the per-run export ceiling; still available in Crayo." }));
        }
        state.exportBudget = { count: budget.count, credits };
        state.phase = "exporting";
        await progress(runId, state, `Exporting ${budget.count} clip(s) to the Library${credits != null ? ` (${credits} export credits available)` : ""}.`);
      }
      await saveState(runId, run.outputs, { ...state, lockUntil: null });
      return "advanced";
    }
```

- [ ] **Step 3: Add the exporting phase block (before `return "idle";`)**

```ts
    if (state.phase === "exporting") {
      const { EXPORT_CONCURRENCY } = await import("@/lib/clip-export");
      const { exportClipStep, defaultClipExportDeps } = await import("@/lib/server/clip-export.server");
      const deps = defaultClipExportDeps();
      const ctx = { actorId: state.actorId, clientId: state.clientId, sourceUrl: state.url, tags: ["autoclip"] };
      const active = state.segments.flatMap((seg) => seg.clips ?? []).filter((c) => c.status === "pending" || c.status === "exporting");
      const batch = active.slice(0, EXPORT_CONCURRENCY);
      for (const clip of batch) {
        const before = clip.status;
        const next = await exportClipStep(clip, ctx, deps);
        Object.assign(clip, next);
        const all = state.segments.flatMap((seg) => seg.clips ?? []);
        const idx = all.indexOf(clip) + 1;
        if (next.status === "stored" && before !== "stored") {
          await progress(runId, state, `Stored clip ${idx} of ${all.length} (${Math.round((next.bytes ?? 0) / 1048576)} MB): ${next.title}`);
        } else if (next.status === "failed" && before !== "failed") {
          await progress(runId, state, `Clip ${idx} of ${all.length} failed: ${next.error ?? "unknown error"}`);
        } else if (next.status === "exporting" && before === "pending") {
          await progress(runId, state, `Exporting clip ${idx} of ${all.length}: ${next.title}`);
        }
      }
      const all = state.segments.flatMap((seg) => seg.clips ?? []);
      if (all.every((c) => c.status === "stored" || c.status === "failed")) {
        state.phase = "done";
        state.lockUntil = null;
        const stored = all.filter((c) => c.status === "stored");
        const failed = all.filter((c) => c.status === "failed");
        const summary = `AutoClip finished: ${stored.length} clip(s) in the Library${failed.length ? `, ${failed.length} failed` : ""} from “${state.probe?.title ?? "video"}”. ${stored.map((c) => c.title).slice(0, 8).join(" · ")}`;
        await saveState(runId, run.outputs, state);
        await insertIteration({ runId, index: state.iterationIndex + 1, kind: "complete", resultSummary: summary.slice(0, 2000), status: "ok" }).catch(() => {});
        await patchAgentRun(runId, {
          status: "succeeded",
          errorCode: null,
          summary: summary.slice(0, 800),
          finishedAt: new Date().toISOString(),
          outputs: {
            ...(run.outputs ?? {}),
            mediaFetch: state as unknown as JsonValue,
            libraryClips: all.map((c) => ({ title: c.title, projectId: c.projectId, assetId: c.assetId, status: c.status, error: c.error })) as unknown as JsonValue,
          },
        });
        return "done";
      }
      await saveState(runId, run.outputs, { ...state, lockUntil: null });
      return "advanced";
    }
```

Remove the now-unused `ingestCrayoMedia` import inside this file if the type-checker flags it. Add `"EXPORT_BUDGET"` to `explainAgentToolError` in `src/lib/agent.ts` with the text `"Not enough Crayo export credits for these clips."` (follow the existing `case`/`if` style there).

- [ ] **Step 4: Type-check and run all tests**

Run: `npx tsc --noEmit -p . 2>&1 | grep -E "media-fetch-job|agent\.ts"` → no output. `npm test 2>&1 | tail -4` → pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/media-fetch-job.server.ts src/lib/agent.ts
git commit -m "feat(media-fetch-job): export AutoClip projects to the Library (exporting phase)"
```

---

### Task 7: Synchronous `/autoclip` and `/export` paths

**Files:**
- Modify: `src/lib/server/crayo-tools.server.ts` (`runAutoclip` 274-295; `crayo.export_project` 369-380)

**Interfaces:**
- Consumes: `exportClipToLibrary`, `readExportCredits`, `defaultClipExportDeps` (Task 5); `planExportBudget`, `readAutoclipClips` (Task 2).
- Produces: `runAutoclip` returns `{ autoclipId, assetId, clips: ClipExportState[], libraryClips: {...}[] }`.

- [ ] **Step 1: Replace lines 275-294 of `runAutoclip`**

```ts
  const { readAutoclipClips, planExportBudget } = await import("@/lib/clip-export");
  const { exportClipToLibrary, readExportCredits, defaultClipExportDeps } = await import("@/lib/server/clip-export.server");
  const found = readAutoclipClips(finished);
  const deps = defaultClipExportDeps();
  const budget = planExportBudget({ exportCredits: await readExportCredits(deps.crayo), clipCount: found.length });
  if (!budget.ok) throw new CrayoToolError("EXPORT_BUDGET", budget.reason);
  const clips = [];
  for (const [i, clip] of found.slice(0, budget.count).entries()) {
    await onProgress?.(`Exporting clip ${i + 1} of ${budget.count}: ${clip.title}`);
    const result = await exportClipToLibrary(
      { projectId: clip.projectId, title: clip.title, thumbnailUrl: clip.thumbnailUrl, actorId, clientId, sourceUrl: url, tags: ["autoclip"] },
      deps,
    );
    clips.push(result);
    await onProgress?.(result.status === "stored" ? `Stored clip ${i + 1} of ${budget.count} (${Math.round((result.bytes ?? 0) / 1048576)} MB).` : `Clip ${i + 1} failed: ${result.error}`);
  }
  const libraryClips = clips.map((c) => ({ title: c.title, projectId: c.projectId, assetId: c.assetId, status: c.status, error: c.error }));
  return { autoclipId, assetId, clips, libraryClips, ...(fetched ? { source: fetched } : {}) };
```

- [ ] **Step 2: Replace the `crayo.export_project` case**

```ts
    case "crayo.export_project": {
      const id = str(payload, "projectId", "id");
      if (!id) throw new Error("VALIDATION");
      const { exportClipToLibrary } = await import("@/lib/server/clip-export.server");
      const result = await exportClipToLibrary({
        projectId: id, title: sanitizeText(str(payload, "title")).slice(0, 160) || `Crayo project ${id}`,
        thumbnailUrl: null, actorId, clientId: str(payload, "clientId") || null, sourceUrl: `crayo:project:${id}`, tags: ["export"],
      });
      if (result.status === "failed") throw new CrayoToolError("EXPORT_FAILED", result.error ?? "");
      return { libraryClips: [{ title: result.title, projectId: id, assetId: result.assetId, status: result.status, error: null }] };
    }
```

Add `"EXPORT_FAILED"` to `explainAgentToolError` in `src/lib/agent.ts` with `"Crayo could not export that project."`.

- [ ] **Step 3: Type-check, run tests, commit**

`npx tsc --noEmit -p . 2>&1 | grep crayo-tools` → no output. `npm test 2>&1 | tail -3` → pass.

```bash
git add src/lib/server/crayo-tools.server.ts src/lib/agent.ts
git commit -m "feat(crayo-tools): sync /autoclip and /export store mp4s in the Library"
```

---

### Task 8: Download route and signed-URL server function

**Files:**
- Modify: `src/routes/api/library.file.ts`
- Create or modify: `src/lib/server/library-fns.ts` (find the file that already exports the Library tab's server functions, e.g. where `listLibraryAssetsFn`/`getAssetDetailFn` live, and add there instead if it exists)

**Interfaces:**
- Produces: `GET /api/library/file?t=<token>&download=1` → `content-disposition: attachment; filename="<title>.<ext>"`.
- Produces: `signLibraryAssetsFn({ data: { assetIds: string[] } })` → `{ assetId: string; title: string; previewUrl: string | null; downloadUrl: string | null; thumbnailUrl: string | null; backend: "supabase" | "s3" | "local"; status: string }[]`.

- [ ] **Step 1: Download variant of the file route**

Replace the handler body of `src/routes/api/library.file.ts` from `const mime = ...` to the end of the `return new Response(...)`:

```ts
        const mime = version.mimeType || "application/octet-stream";
        const unsafe = /svg|xml|html|javascript/i.test(mime) || !/^(video|image|audio)\//i.test(mime);
        const wantsDownload = url.searchParams.get("download") === "1";
        let disposition = unsafe ? "attachment" : "inline";
        if (wantsDownload && !unsafe) {
          const { getAsset } = await import("@/lib/server/library.server");
          const asset = await getAsset(version.assetId);
          const ext = (version.mimeType?.split("/")[1] ?? "bin").replace(/[^a-z0-9]/gi, "").slice(0, 5) || "bin";
          const base = (asset?.title ?? "clip").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").slice(0, 80) || "clip";
          disposition = `attachment; filename="${base}.${ext}"`;
        }
        return new Response(new Uint8Array(bytes), {
          status: 200,
          headers: {
            "content-type": unsafe ? "application/octet-stream" : mime,
            "x-content-type-options": "nosniff",
            "cache-control": "private, max-age=60",
            "content-disposition": disposition,
          },
        });
```

(`version.assetId` — confirm the property name on the row returned by `getVersionRow`; the survey shows `asset_id` in the table and camelCase in `LibraryAssetVersion`.)

- [ ] **Step 2: Server function for signed URLs**

In the Library server-functions file, add:

```ts
export const signLibraryAssetsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ assetIds: z.array(z.string().min(1)).max(50) }).parse(input))
  .handler(async ({ context, data }) => {
    await requireUser(context.userId);
    const { getAsset, getVersionRow } = await import("@/lib/server/library.server");
    const { signVersionUrl, backendFromStorageKey } = await import("@/lib/server/library-storage.server");
    const rows = [];
    for (const assetId of data.assetIds) {
      const asset = await getAsset(assetId);
      if (!asset) continue;
      const version = asset.currentVersionId ? await getVersionRow(asset.currentVersionId) : null;
      const previewUrl = asset.currentVersionId ? await signVersionUrl(asset.currentVersionId).catch(() => null) : null;
      rows.push({
        assetId, title: asset.title, status: asset.status,
        previewUrl,
        downloadUrl: previewUrl ? `${previewUrl}&download=1` : null,
        thumbnailUrl: asset.thumbnailUrl,
        backend: backendFromStorageKey(version?.storageKey ?? ""),
      });
    }
    return rows;
  });
```

Match the file's existing imports for `createServerFn`, `authMiddleware`, `requireUser`, `z`.

- [ ] **Step 3: Type-check and commit**

```bash
npx tsc --noEmit -p . 2>&1 | grep -E "library.file|library-fns"
git add src/routes/api/library.file.ts src/lib/server/library-fns.ts
git commit -m "feat(library): download variant of the file route and signLibraryAssetsFn"
```

---

### Task 9: UI — Download buttons, backend label, structured Agent results with Retry

**Files:**
- Modify: `src/components/library/asset-card.tsx` (footer, lines 87-108)
- Modify: `src/components/library/asset-drawer.tsx` (after the media block, line ~100)
- Modify: `src/components/agent/results.tsx`
- Modify: `src/lib/agent-results.ts` (add `libraryClips` extraction)
- Modify: `src/lib/server/agent-fns.ts` (add `retryClipExportFn`)

**Interfaces:**
- Consumes: `signLibraryAssetsFn` (Task 8), `run.outputs.libraryClips` (Tasks 6/7).
- Produces: `collectAgentVisualResults(detail).libraryClips: { title; projectId; assetId: string | null; status; error }[]`; `retryClipExportFn({ data: { runId, projectId } })`.

- [ ] **Step 1: Extract structured clips in `agent-results.ts`**

Add to `AgentVisualResults`: `libraryClips: { title: string; projectId: string; assetId: string | null; status: string; error: string | null }[];`. In `collectAgentVisualResults`, before `return`:

```ts
  const rawClips = (detail.run.outputs as Record<string, unknown> | null)?.libraryClips;
  const libraryClips = Array.isArray(rawClips)
    ? rawClips.flatMap((row) => {
        const r = row as Record<string, unknown>;
        if (typeof r.projectId !== "string") return [];
        return [{ title: String(r.title ?? "Clip"), projectId: r.projectId, assetId: typeof r.assetId === "string" ? r.assetId : null, status: String(r.status ?? "failed"), error: typeof r.error === "string" ? r.error : null }];
      })
    : [];
```

Include `libraryClips` in the returned object and set `empty` to also require `libraryClips.length === 0`. Update `src/lib/agent-results.test.ts` with one test that a run whose `outputs.libraryClips` has one stored clip is not `empty` and round-trips the fields.

- [ ] **Step 2: Render clips in `results.tsx`**

Add a `LibraryClips` block above the existing `videos` grid:

```tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { signLibraryAssetsFn } from "@/lib/server/library-fns";
import { retryClipExportFn } from "@/lib/server/agent-fns";
import { agentRunQueryKey } from "@/lib/agent";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { userFacingErrorMessage } from "@/lib/errors";

function LibraryClips({ runId, clips }: { runId: string; clips: AgentVisualResults["libraryClips"] }) {
  const queryClient = useQueryClient();
  const ids = clips.map((c) => c.assetId).filter((id): id is string => Boolean(id));
  const signed = useQuery({
    queryKey: ["library-signed", ids.join(",")],
    queryFn: () => signLibraryAssetsFn({ data: { assetIds: ids } }),
    enabled: ids.length > 0,
    staleTime: 10 * 60 * 1000,
  });
  const retry = useMutation({
    mutationFn: (projectId: string) => retryClipExportFn({ data: { runId, projectId } }),
    onSuccess: async () => { toast.success("Export retried"); await queryClient.invalidateQueries({ queryKey: agentRunQueryKey(runId) }); },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {clips.map((clip) => {
        const row = signed.data?.find((r) => r.assetId === clip.assetId);
        return (
          <figure key={clip.projectId} className="overflow-hidden rounded-control bg-black/40">
            {row?.previewUrl ? (
              <video src={row.previewUrl} poster={row.thumbnailUrl ?? undefined} controls className="max-h-72 w-full" preload="metadata" />
            ) : (
              <div className="grid h-40 place-items-center text-caption text-muted">{clip.status === "failed" ? "Export failed" : "Preparing…"}</div>
            )}
            <figcaption className="flex items-center justify-between gap-2 px-2 py-1 text-caption text-muted">
              <span className="truncate">{clip.title}{row ? ` · ${row.backend === "supabase" ? "Supabase Storage" : row.backend === "s3" ? "S3" : "local disk"}` : ""}</span>
              {row?.downloadUrl ? (
                <Button size="sm" variant="secondary" asChild><a href={row.downloadUrl}>Download</a></Button>
              ) : clip.status === "failed" ? (
                <Button size="sm" variant="secondary" disabled={retry.isPending} onClick={() => retry.mutate(clip.projectId)} title={clip.error ?? undefined}>Retry</Button>
              ) : null}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
```

In `AgentResults`, render `{results.libraryClips.length > 0 ? <LibraryClips runId={detail.run.id} clips={results.libraryClips} /> : null}` before the `videos` block, and change the early-return condition to use `results.empty` (which now accounts for clips).

- [ ] **Step 3: `retryClipExportFn` in `agent-fns.ts`**

```ts
export const retryClipExportFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ runId: z.string().min(1), projectId: z.string().min(1) }).parse(input))
  .handler(async ({ context, data }) => {
    if (!context.userId) throw new Error("Unauthorized");
    const { getAgentRun, patchAgentRun } = await import("@/lib/server/agent.server");
    const run = await getAgentRun(data.runId);
    if (!run) throw new Error("RUN_MISSING");
    const clips = ((run.outputs?.libraryClips as unknown) ?? []) as { title: string; projectId: string; assetId: string | null; status: string; error: string | null }[];
    const clip = clips.find((c) => c.projectId === data.projectId);
    if (!clip) throw new Error("CLIP_MISSING");
    const { exportClipToLibrary } = await import("@/lib/server/clip-export.server");
    const mf = (run.outputs?.mediaFetch as { url?: string } | undefined) ?? {};
    const result = await exportClipToLibrary({ projectId: clip.projectId, title: clip.title, thumbnailUrl: null, actorId: context.userId, clientId: run.clientId ?? null, sourceUrl: mf.url ?? `crayo:project:${clip.projectId}`, tags: ["autoclip", "retry"] });
    const next = clips.map((c) => (c.projectId === clip.projectId ? { ...c, assetId: result.assetId, status: result.status, error: result.error } : c));
    await patchAgentRun(run.id, { outputs: { ...(run.outputs ?? {}), libraryClips: next as never } });
    return { status: result.status, assetId: result.assetId, error: result.error };
  });
```

- [ ] **Step 4: Library card and drawer Download button + backend label**

`asset-card.tsx`: add `Download` to the lucide import; in the footer `<p className="text-caption text-muted">` line, wrap it in a flex row and append:

```tsx
          {asset.previewUrl && (asset.kind === "VIDEO" || asset.kind === "IMAGE" || asset.kind === "AUDIO") ? (
            <a href={`${asset.previewUrl}&download=1`} className="inline-flex items-center gap-1 text-caption text-accent" aria-label={`Download ${asset.title}`} onClick={(e) => e.stopPropagation()}>
              <Download className="size-3.5" aria-hidden="true" />Download
            </a>
          ) : null}
```

`asset-drawer.tsx`: after the `<p className="mt-2 text-caption text-muted">{[formatBytes...` block add:

```tsx
            <div className="mt-2 flex items-center gap-2">
              {asset.previewUrl && asset.kind !== "SUBTITLE" ? (
                <Button size="sm" variant="secondary" asChild>
                  <a href={`${asset.previewUrl}&download=1`}><Download className="size-3.5" aria-hidden="true" />Download</a>
                </Button>
              ) : null}
              <span className="text-caption text-muted">
                Stored in {settings.libraryBackend === "supabase" ? "Supabase Storage" : settings.libraryBackend === "s3" ? "S3-compatible storage" : "local preview disk"}
              </span>
            </div>
```

Import `Download` from lucide-react and `Button` if not already imported in the drawer.

- [ ] **Step 5: Copy fixes**

- `src/lib/agent.ts:692`: change `"The video rendered, but Filebase/library ingest failed. …"` to `"The video rendered, but the Library ingest failed. The Crayo URL may still be in the step output."`.
- `src/components/agent/tool-cards.tsx:169`: change `"Crayo CDN https only → Filebase, source=AGENT."` to `"Crayo CDN https only → Library, source=AGENT."`.
- `src/lib/agent-crayo.ts:18,176` and `src/lib/agent.ts:252,458,482`: replace the words "Filebase library" with "Library" (goal text only; run `npm test` afterwards because `agent-crayo.test.ts` asserts on goal strings — update the expected strings there in the same commit).

- [ ] **Step 6: Type-check, run all tests, commit**

`npx tsc --noEmit -p . 2>&1 | grep -vE "^\s*$" | head` → no errors in touched files. `npm test 2>&1 | tail -4` → pass.

```bash
git add src/components/agent/results.tsx src/lib/agent-results.ts src/lib/agent-results.test.ts src/lib/server/agent-fns.ts src/components/library/asset-card.tsx src/components/library/asset-drawer.tsx src/lib/agent.ts src/lib/agent-crayo.ts src/lib/agent-crayo.test.ts src/components/agent/tool-cards.tsx
git commit -m "feat(ui): clip preview, Download and Retry in Agent results and Library"
```

---

### Task 10: Integration check on local dev and PR

**Files:** none new (harness scripts live in `/root/.clippyos-dev/qa/`, never in the repo).

- [ ] **Step 1: Confirm the dev server is running the branch**

`systemctl is-active clippyos-dev` → `active`. The unit runs `npm run dev` from the checkout; Vite hot-reloads. If the branch was switched, `systemctl restart clippyos-dev` and wait for `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/` → `200`.

- [ ] **Step 2: Enter the Crayo key locally**

Ask the operator to open `http://127.0.0.1:8080/settings` through their tunnel and save the Crayo key (the in-memory dev DB lost it on the last restart). Do not proceed until the Crayo card shows Connected.

- [ ] **Step 3: Run `/autoclip` on a direct mp4 with the minimum clip count and watch it**

Use headless Firefox (`/root/.clippyos-dev/qa/drive.mjs`): open `/agent`, click `/autoclip`, set the URL to a small public https mp4 between 1 and 3 minutes long (ask the operator for one they own if none is on hand; Crayo needs ≥ 60 s), choose 3 clips, click Cut shorts, then poll the run detail every 10 s until status is `succeeded` or `failed`. Record every progress line. Expected: "Exporting clip 1 of 3", "Stored clip 1 of 3 (… MB)", …, summary "AutoClip finished: 3 clip(s) in the Library". This spends 3 Crayo export credits; state that in the PR.

- [ ] **Step 4: Verify Library and download**

Open `/library`, confirm three new VIDEO assets with `source AGENT`, tag `autoclip`, status READY, non-null duration. Open one card, confirm the drawer plays it and shows "Stored in …". Fetch the Download link with `curl -sI "<downloadUrl>"` and confirm `content-disposition: attachment; filename="<title>.mp4"` and a `content-length` matching the asset's byte size.

- [ ] **Step 5: Verify the Agent results panel**

Reload the run page: three players render, each with Download; no Retry buttons. Then simulate a failed clip by editing nothing in code but confirming the Retry path compiles and the server function rejects an unknown project id with `CLIP_MISSING` (call it via the browser console `fetch` of the server function, or trust the unit tests if not reachable).

- [ ] **Step 6: Push and open the PR**

```bash
git push -u origin feat/clips-to-library
gh pr create --base main --title "feat: Crayo AutoClip clips exported into the Library with preview and download" --body-file /root/.clippyos-dev/qa/pr-clips-body.md
```

The body must list: the spec path, the migration file, the credit cost of the verification run, and the two known follow-ups (YouTube fetching moves to the VPS worker in sub-project 2; the file route still buffers the whole file when serving).

---

## Self-review

**Spec coverage.** Data flow steps 1-4 → Tasks 2, 5, 6, 7. New module with two functions → Task 5. Streaming write → Task 3 (via temp file, which also solves the probe-reads-spool gap). Job phase → Task 6. Sync path and `/export` → Task 7. Download route and buttons → Tasks 8, 9. Backend label → Task 9. Spend guard, ceiling, per-clip failure, storage cleanup, size check, progress lines → Tasks 2, 5, 6. Tests → Tasks 1-5, 9. Rollout (no flag, old ingest removed) → Task 6 Step 2. Out of scope unchanged.

**Deviations from the spec, deliberate.** (1) "Streams the mp4 … without buffering in memory" is met by streaming to a temp file and then streaming to storage; a direct CDN→bucket pipe would break duration probing. (2) "Which backend holds the file" is derived from the storage-key prefix, not a new column. (3) "Thumbnail attached to the same asset" is a version row with `version_number: 0` plus `thumbnail_version_id`. (4) The Results panel uses structured `outputs.libraryClips` plus a signing server function rather than regex-harvested URLs, because signed library URLs are relative and the existing harvester drops them.

**Placeholders.** None: every step has code or an exact command. Two "confirm the real name" notes remain (row mapper name, `deleted_at`, `version.assetId`) because the survey did not quote those identifiers; the executor resolves them by reading the file.

**Type consistency.** `ClipExportState` is defined once (Task 5) and reused by Tasks 6, 7, 9. `libraryClips` shape is identical in Tasks 6, 7, 9. `writeLibraryFile` returns the same string contract as `writeLibraryBytes`. `readExportCredits` takes a `CrayoExportClient` everywhere.
