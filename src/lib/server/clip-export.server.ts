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
  download(
    url: string,
    maxBytes: number,
  ): Promise<{ path: string; bytes: number; mime: string; cleanup(): Promise<void> }>;
  ingest(input: {
    path: string;
    bytes: number;
    mime: string;
    title: string;
    externalRef: string;
    sourceRef: string;
    actorId: string;
    clientId: string | null;
    tags: string[];
  }): Promise<{ assetId: string }>;
  attachThumbnail(assetId: string, thumbnailUrl: string): Promise<void>;
};

export type ClipExportContext = {
  actorId: string;
  clientId: string | null;
  sourceUrl: string;
  tags: string[];
};

const POLL_MS = 3000;
const MAX_POLLS = 60;

function message(error: unknown): string {
  return (error instanceof Error ? error.message : String(error))
    .replace(/https?:\/\/\S+/g, "<url>")
    .slice(0, 300);
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
export async function exportClipStep(
  state: ClipExportState,
  ctx: ClipExportContext,
  deps: ClipExportDeps,
): Promise<ClipExportState> {
  if (state.status === "stored" || state.status === "failed") return state;
  const ref = clipExternalRef(state.projectId);
  try {
    if (state.status === "pending") {
      const existing = await deps.findByExternalRef(ref);
      if (existing) return { ...state, status: "stored", assetId: existing.id, error: null };
      const queued = readExportPayload(await deps.crayo.exportProject(state.projectId));
      if (!queued.exportId)
        return { ...state, status: "failed", error: "Crayo did not return an export id." };
      return { ...state, status: "exporting", exportId: queued.exportId };
    }
    // exporting
    const polled = readExportPayload(await deps.crayo.getExport(state.exportId!));
    if (polled.status === "pending") return state;
    if (polled.status === "failed" || !polled.url)
      return { ...state, status: "failed", error: "Crayo export failed." };
    if (polled.bytes != null && polled.bytes > BUCKET_OBJECT_LIMIT_BYTES) {
      return {
        ...state,
        status: "failed",
        error: `Export is ${Math.round(polled.bytes / 1048576)} MB; the library bucket allows 512 MB per file.`,
      };
    }
    const file = await deps.download(polled.url, BUCKET_OBJECT_LIMIT_BYTES);
    try {
      const { assetId } = await deps.ingest({
        path: file.path,
        bytes: file.bytes,
        mime: file.mime,
        title: state.title,
        externalRef: ref,
        sourceRef: ctx.sourceUrl,
        actorId: ctx.actorId,
        clientId: ctx.clientId,
        tags: ctx.tags,
      });
      if (state.thumbnailUrl)
        await deps.attachThumbnail(assetId, state.thumbnailUrl).catch(() => {});
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
  input: {
    projectId: string;
    title: string;
    thumbnailUrl: string | null;
    actorId: string;
    clientId: string | null;
    sourceUrl: string;
    tags?: string[];
  },
  deps: ClipExportDeps = defaultClipExportDeps(),
): Promise<ClipExportState> {
  let state: ClipExportState = {
    projectId: input.projectId,
    title: input.title,
    thumbnailUrl: input.thumbnailUrl,
    exportId: null,
    status: "pending",
    assetId: null,
    error: null,
    bytes: null,
  };
  const ctx: ClipExportContext = {
    actorId: input.actorId,
    clientId: input.clientId,
    sourceUrl: input.sourceUrl,
    tags: input.tags ?? ["crayo", "autoclip"],
  };
  for (let i = 0; i < MAX_POLLS + 2; i += 1) {
    const next = await exportClipStep(state, ctx, deps);
    if (next.status === "stored" || next.status === "failed") return next;
    if (next.status === "exporting" && state.status === "exporting")
      await new Promise((r) => setTimeout(r, POLL_MS));
    state = next;
  }
  return { ...state, status: "failed", error: "Crayo export is still processing." };
}

/** Stream an https URL to a temp file with a byte ceiling. */
export async function downloadToTempFile(
  url: string,
  maxBytes: number,
): Promise<{ path: string; bytes: number; mime: string; cleanup(): Promise<void> }> {
  const { mkdtemp, rm } = await import("node:fs/promises");
  const { createWriteStream } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { pipeline } = await import("node:stream/promises");
  const { Readable, Transform } = await import("node:stream");
  const { isTrustedLibraryUrl } = await import("@/lib/server/library-pipeline.server");
  if (!isTrustedLibraryUrl(url)) throw new Error("UNTRUSTED_URL");
  const response = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "ClippyAdmin/1.0" },
    signal: AbortSignal.timeout(10 * 60 * 1000),
  });
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
  const cleanup = async () => {
    await rm(dir, { recursive: true, force: true });
  };
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
      exportProject: async (id) =>
        (await import("@/lib/server/crayo.server")).crayoExportProject(id),
      getExport: async (id) => (await import("@/lib/server/crayo.server")).crayoGetExport(id),
      getAccount: async () => (await import("@/lib/server/crayo.server")).crayoGetAccount(),
    },
    findByExternalRef: async (ref) =>
      (await import("@/lib/server/library.server")).findAssetByExternalRef(ref),
    download: downloadToTempFile,
    ingest: async (input) => {
      const { ingestFile } = await import("@/lib/server/library-pipeline.server");
      const { asset } = await ingestFile({
        actorId: input.actorId,
        clientId: input.clientId,
        title: input.title,
        filePath: input.path,
        mimeHint: input.mime,
        filename: `${input.title}.mp4`,
        source: "AGENT",
        sourceRef: input.sourceRef.slice(0, 500),
        externalRef: input.externalRef,
        tags: ["crayo", ...input.tags],
        note: "crayo export",
      });
      return { assetId: asset.id };
    },
    attachThumbnail: async (assetId, thumbnailUrl) => {
      const { isTrustedLibraryUrl, attachThumbnail } =
        await import("@/lib/server/library-pipeline.server");
      if (!isTrustedLibraryUrl(thumbnailUrl)) return;
      const response = await fetch(thumbnailUrl, { signal: AbortSignal.timeout(20_000) });
      if (!response.ok) return;
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length > 5 * 1024 * 1024) return;
      await attachThumbnail({
        assetId,
        bytes,
        mimeHint: response.headers.get("content-type") ?? "image/jpeg",
      });
    },
  };
}
