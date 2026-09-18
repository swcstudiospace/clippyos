import assert from "node:assert/strict";
import { test } from "node:test";
import {
  exportClipStep,
  readExportCredits,
  type ClipExportDeps,
  type ClipExportState,
} from "./clip-export.server.ts";

function fakeDeps(
  over: Partial<ClipExportDeps> & { exportStatuses?: string[] } = {},
): ClipExportDeps & { calls: string[] } {
  const calls: string[] = [];
  const statuses = [...(over.exportStatuses ?? ["processing", "completed"])];
  return {
    calls,
    crayo: {
      async exportProject(id) {
        calls.push(`export:${id}`);
        return { export: { id: "exp_1", status: "queued" } };
      },
      async getExport(id) {
        calls.push(`poll:${id}`);
        const s = statuses.shift() ?? "completed";
        return {
          export: { id, status: s, video_url: "https://cdn-crayo.com/c.mp4", file_size: 1000 },
        };
      },
      async getAccount() {
        return { credits: { export: 7 } };
      },
    },
    findByExternalRef: over.findByExternalRef ?? (async () => null),
    download:
      over.download ??
      (async (url) => {
        calls.push(`download:${url}`);
        return {
          path: "/tmp/fake.mp4",
          bytes: 1000,
          mime: "video/mp4",
          cleanup: async () => {
            calls.push("cleanup");
          },
        };
      }),
    ingest:
      over.ingest ??
      (async () => {
        calls.push("ingest");
        return { assetId: "asset_1" };
      }),
    attachThumbnail:
      over.attachThumbnail ??
      (async () => {
        calls.push("thumb");
      }),
  };
}
const base = (): ClipExportState => ({
  projectId: "p1",
  title: "Clip",
  thumbnailUrl: "https://cdn-crayo.com/t.jpg",
  exportId: null,
  status: "pending",
  assetId: null,
  error: null,
  bytes: null,
});
const ctx = {
  actorId: "u1",
  clientId: null,
  sourceUrl: "https://www.youtube.com/watch?v=x",
  tags: ["autoclip"],
};

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
  s = await exportClipStep(s, ctx, deps); // processing
  assert.equal(s.status, "exporting");
  s = await exportClipStep(s, ctx, deps); // completed
  assert.equal(s.status, "stored");
  assert.equal(s.assetId, "asset_1");
  assert.equal(s.bytes, 1000);
  assert.deepEqual(deps.calls, [
    "export:p1",
    "poll:exp_1",
    "poll:exp_1",
    "download:https://cdn-crayo.com/c.mp4",
    "ingest",
    "thumb",
    "cleanup",
  ]);
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
  const deps = fakeDeps({
    exportStatuses: ["completed"],
    ingest: async () => {
      throw new Error("SUPABASE_DOWN");
    },
  });
  let s = await exportClipStep(base(), ctx, deps);
  s = await exportClipStep(s, ctx, deps);
  assert.equal(s.status, "failed");
  assert.equal(s.error, "SUPABASE_DOWN");
  assert.ok(deps.calls.includes("cleanup"));
});

test("oversized export is refused before download", async () => {
  const deps = fakeDeps();
  deps.crayo.getExport = async (id) => ({
    export: {
      id,
      status: "completed",
      video_url: "https://cdn-crayo.com/big.mp4",
      file_size: 600 * 1024 * 1024,
    },
  });
  let s = await exportClipStep(base(), ctx, deps);
  s = await exportClipStep(s, ctx, deps);
  assert.equal(s.status, "failed");
  assert.match(s.error ?? "", /512 MB/);
  assert.ok(!deps.calls.some((c) => c.startsWith("download:")));
});

test("readExportCredits tolerates a failing account call", async () => {
  assert.equal(
    await readExportCredits({
      async exportProject() {
        return null;
      },
      async getExport() {
        return null;
      },
      async getAccount() {
        return { credits: { export: 7 } };
      },
    }),
    7,
  );
  assert.equal(
    await readExportCredits({
      async exportProject() {
        return null;
      },
      async getExport() {
        return null;
      },
      async getAccount() {
        throw new Error("x");
      },
    }),
    null,
  );
});
