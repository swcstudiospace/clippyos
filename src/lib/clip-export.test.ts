import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clipExternalRef,
  MAX_EXPORTS_PER_RUN,
  planExportBudget,
  readAutoclipClips,
  readExportPayload,
} from "./clip-export.ts";

test("clipExternalRef is stable and namespaced", () => {
  assert.equal(clipExternalRef("proj_123"), "crayo:project:proj_123");
  assert.equal(clipExternalRef(" proj_123 "), "crayo:project:proj_123");
});

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
