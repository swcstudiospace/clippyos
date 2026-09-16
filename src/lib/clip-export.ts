/** Client-safe helpers for the Crayo clip → Library export flow. No secrets, no I/O. */

export function clipExternalRef(projectId: string): string {
  return `crayo:project:${projectId.trim()}`;
}

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
const rec = (v: unknown): Rec =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Rec) : {};
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
  const status =
    raw === "completed" || raw === "complete" || raw === "succeeded"
      ? "done"
      : raw === "failed" || raw === "error"
        ? "failed"
        : "pending";
  const candidates = [
    inner.video_url,
    inner.videoUrl,
    inner.download_url,
    inner.downloadUrl,
    inner.url,
    rec(inner.output).url,
    rec(inner.result).url,
  ];
  const url = candidates.map(str).find((u) => u.startsWith("https://")) ?? null;
  const bytes = num(inner.file_size) ?? num(inner.bytes) ?? num(inner.size) ?? null;
  return { status, url: status === "done" ? url : null, bytes, exportId: str(inner.id) || null };
}

export function readAutoclipClips(
  payload: unknown,
): { title: string; projectId: string; thumbnailUrl: string | null }[] {
  const outer = rec(payload);
  const inner = "autoclip" in outer ? rec(outer.autoclip) : outer;
  const list = Array.isArray(inner.clips) ? inner.clips : [];
  const out: { title: string; projectId: string; thumbnailUrl: string | null }[] = [];
  for (const item of list.slice(0, 20)) {
    const clip = rec(item);
    const projectId = str(clip.project_id) || str(clip.projectId) || str(clip.id);
    if (!projectId) continue;
    const thumb = str(clip.thumbnail_url) || str(clip.thumbnailUrl);
    out.push({
      title: str(clip.title) || "AutoClip",
      projectId,
      thumbnailUrl: thumb.startsWith("https://") ? thumb : null,
    });
  }
  return out;
}
