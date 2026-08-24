import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getUserRole } from "@/lib/server/access";
import { readClients } from "@/lib/server/clients";
import {
  ASSET_KINDS,
  ASSET_SOURCES,
  ASSET_STATUSES,
  RENDER_PRESETS,
  type CaptionCue,
  type LibraryFilters,
} from "@/lib/library";

async function requireUser(userId: string) {
  const role = await getUserRole(userId);
  if (!role) throw new Error("Forbidden");
  return role;
}

export const getLibrarySnapshot = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const role = await requireUser(context.userId);
    const { listAssets, listRenders, readMediaSettings } = await import("@/lib/server/library.server");
    const clients = await readClients();
    const [assets, renders, settings] = await Promise.all([
      listAssets({}, 80),
      listRenders(),
      readMediaSettings(),
    ]);
    let rollups: Awaited<ReturnType<typeof import("@/lib/server/performance.server").listAssetRollups>> = [];
    try {
      const perf = await import("@/lib/server/performance.server");
      rollups = await perf.listAssetRollups();
    } catch {
      rollups = [];
    }
    return {
      assets,
      renders,
      clients: clients
        .filter((row) => !row.deletedAt)
        .map((row) => ({ id: row.id, name: row.name, status: row.status, deletedAt: row.deletedAt })),
      role,
      settings,
      rollups,
    };
  });

export const listLibraryAssetsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        clientId: z.string().optional(),
        kind: z.enum(ASSET_KINDS).optional(),
        source: z.enum(ASSET_SOURCES).optional(),
        status: z.enum(ASSET_STATUSES).optional(),
        tag: z.string().max(40).optional(),
        search: z.string().max(80).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    await requireUser(context.userId);
    const { listAssets } = await import("@/lib/server/library.server");
    const filters: LibraryFilters = data;
    return { assets: await listAssets(filters, 80) };
  });

export const getLibraryAssetFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ id: z.string().min(1) }).parse(input))
  .handler(async ({ context, data }) => {
    await requireUser(context.userId);
    const { getAsset, listVersions, listCaptions, derivedRenders, listRenders } = await import(
      "@/lib/server/library.server"
    );
    const asset = await getAsset(data.id);
    if (!asset) throw new Error("ASSET_MISSING");
    const [versions, captions, derived, renders] = await Promise.all([
      listVersions(asset.id),
      listCaptions(asset.id),
      derivedRenders(asset.id),
      listRenders({ sourceAssetId: asset.id }),
    ]);
    let performance = null as Awaited<ReturnType<typeof import("@/lib/server/performance.server").getAssetRollup>>;
    let snapshots: Awaited<ReturnType<typeof import("@/lib/server/performance.server").listPostPerformance>> = [];
    try {
      const perf = await import("@/lib/server/performance.server");
      performance = await perf.getAssetRollup(asset.id);
      snapshots = await perf.listPostPerformance({ mediaAssetId: asset.id, limit: 20 });
    } catch {
      performance = null;
      snapshots = [];
    }
    return { asset, versions, captions, derived, renders, performance, snapshots };
  });

export const ingestLibraryUrlFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        clientId: z.string().nullable().optional(),
        url: z.string().min(8).max(2000),
        title: z.string().max(160).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireUser(context.userId);
    const { ingestFromUrl } = await import("@/lib/server/library-pipeline.server");
    return ingestFromUrl({
      actorId: context.userId,
      clientId: data.clientId ?? null,
      url: data.url,
      title: data.title,
    });
  });

export const ingestLibraryFileFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        clientId: z.string().nullable().optional(),
        title: z.string().max(160).optional(),
        filename: z.string().max(180).optional(),
        mime: z.string().max(80).optional(),
        dataBase64: z.string().min(8),
        tags: z.array(z.string()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireUser(context.userId);
    const settings = await (await import("@/lib/server/library.server")).readMediaSettings();
    const buf = Buffer.from(data.dataBase64, "base64");
    if (buf.length > settings.maxUploadMb * 1024 * 1024) throw new Error("MEDIA_TOO_LARGE");
    const { ingestBytes } = await import("@/lib/server/library-pipeline.server");
    return ingestBytes({
      actorId: context.userId,
      clientId: data.clientId ?? null,
      title: data.title || data.filename || "Upload",
      filename: data.filename,
      mimeHint: data.mime,
      bytes: buf,
      source: "UPLOAD",
      tags: data.tags,
    });
  });

export const generateCaptionsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ assetId: z.string().min(1), language: z.string().max(8).optional() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireUser(context.userId);
    const { generateCaptions } = await import("@/lib/server/library-pipeline.server");
    return generateCaptions({
      actorId: context.userId,
      assetId: data.assetId,
      language: data.language,
    });
  });

export const uploadSrtFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ assetId: z.string().min(1), srt: z.string().min(8).max(400_000) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireUser(context.userId);
    const { uploadSrt } = await import("@/lib/server/library-pipeline.server");
    return uploadSrt({ actorId: context.userId, assetId: data.assetId, srt: data.srt });
  });

export const saveCuesFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        trackId: z.string().min(1),
        cues: z.array(
          z.object({
            startMs: z.number(),
            endMs: z.number(),
            text: z.string().max(280),
          }),
        ),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireUser(context.userId);
    const { saveCues } = await import("@/lib/server/library-pipeline.server");
    return saveCues({
      actorId: context.userId,
      trackId: data.trackId,
      cues: data.cues as CaptionCue[],
    });
  });

export const exportCaptionsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ trackId: z.string().min(1), format: z.enum(["SRT", "VTT"]) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireUser(context.userId);
    const { captionExport } = await import("@/lib/server/library-pipeline.server");
    return captionExport(data.trackId, data.format);
  });

export const queueRenderFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        assetId: z.string().min(1),
        preset: z.enum(RENDER_PRESETS),
        burnInCaptions: z.boolean().optional(),
        captionTrackId: z.string().nullable().optional(),
        loudnorm: z.boolean().optional(),
        trim: z.object({ startMs: z.number(), endMs: z.number() }).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireUser(context.userId);
    const { queueRender } = await import("@/lib/server/library-pipeline.server");
    return queueRender({
      actorId: context.userId,
      assetId: data.assetId,
      preset: data.preset,
      captionTrackId: data.captionTrackId,
      options: {
        burnInCaptions: data.burnInCaptions,
        loudnorm: data.loudnorm,
        trim: data.trim,
        format: "mp4",
      },
    });
  });

export const bulkQueueRenderFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        assetIds: z.array(z.string().min(1)).min(1).max(12),
        preset: z.enum(RENDER_PRESETS),
        burnInCaptions: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireUser(context.userId);
    const { queueRender } = await import("@/lib/server/library-pipeline.server");
    const jobs = [];
    for (const assetId of data.assetIds) {
      jobs.push(
        await queueRender({
          actorId: context.userId,
          assetId,
          preset: data.preset,
          options: { burnInCaptions: data.burnInCaptions, format: "mp4" },
        }),
      );
    }
    return { jobs };
  });

export const cancelRenderFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ jobId: z.string().min(1) }).parse(input))
  .handler(async ({ context, data }) => {
    await requireUser(context.userId);
    const { cancelRender } = await import("@/lib/server/library-pipeline.server");
    return cancelRender({ actorId: context.userId, jobId: data.jobId });
  });

export const retryRenderFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ jobId: z.string().min(1) }).parse(input))
  .handler(async ({ context, data }) => {
    await requireUser(context.userId);
    const { retryRender } = await import("@/lib/server/library-pipeline.server");
    return retryRender({ actorId: context.userId, jobId: data.jobId });
  });

export const listRendersFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireUser(context.userId);
    const { listRenders } = await import("@/lib/server/library.server");
    return { renders: await listRenders() };
  });

export const archiveAssetFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ assetId: z.string().min(1) }).parse(input))
  .handler(async ({ context, data }) => {
    const role = await requireUser(context.userId);
    const { archiveAsset } = await import("@/lib/server/library-pipeline.server");
    await archiveAsset({ actorId: context.userId, assetId: data.assetId, role });
    return { ok: true as const };
  });

export const tagAssetsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ assetIds: z.array(z.string()).min(1).max(24), tag: z.string().min(1).max(32) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireUser(context.userId);
    const { getAsset, patchAsset } = await import("@/lib/server/library.server");
    const tag = data.tag.trim().toLowerCase().replace(/\s+/g, "-");
    for (const id of data.assetIds) {
      const asset = await getAsset(id);
      if (!asset) continue;
      if (asset.tags.includes(tag)) continue;
      await patchAsset(id, { tags: [...asset.tags, tag].slice(0, 24) });
    }
    return { ok: true as const };
  });

export const getMediaSettingsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireUser(context.userId);
    const { readMediaSettings } = await import("@/lib/server/library.server");
    return readMediaSettings();
  });

export const saveS3SettingsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        endpoint: z.string().max(200).optional(),
        region: z.string().max(40).optional(),
        bucket: z.string().max(80).optional(),
        accessKey: z.string().max(120).optional(),
        secret: z.string().max(200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const role = await requireUser(context.userId);
    if (role !== "admin") throw new Error("Forbidden");
    const { persistS3Settings } = await import("@/lib/server/library-storage.server");
    await persistS3Settings(data);
    const { readMediaSettings } = await import("@/lib/server/library.server");
    return readMediaSettings();
  });

export const saveIpfsSettingsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        pinataJwt: z.string().max(800).optional(),
        gateway: z.string().max(200).optional(),
        strategy: z.enum(["eager", "on_publish", "replicate", "manual"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const role = await requireUser(context.userId);
    if (role !== "admin") throw new Error("Forbidden");
    const { persistIpfsSettings, testPinataConnection } = await import(
      "@/lib/server/library-storage.server"
    );
    await persistIpfsSettings(data);
    if (data.pinataJwt?.trim()) await testPinataConnection();
    const { readMediaSettings } = await import("@/lib/server/library.server");
    return readMediaSettings();
  });

export const saveMediaSettingsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        defaultPreset: z.enum(RENDER_PRESETS).optional(),
        maxUploadMb: z.number().min(8).max(512).optional(),
        concurrentRenders: z.number().min(1).max(2).optional(),
        daytonaRender: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const role = await requireUser(context.userId);
    if (role !== "admin") throw new Error("Forbidden");
    const { writeMediaSettings } = await import("@/lib/server/library.server");
    return writeMediaSettings(data);
  });

export const testRenderFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const role = await requireUser(context.userId);
    if (role !== "admin") throw new Error("Forbidden");
    const { testRender } = await import("@/lib/server/library-pipeline.server");
    return testRender(context.userId);
  });

export const ingestStreamClipFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ clipId: z.string().min(1) }).parse(input))
  .handler(async ({ context, data }) => {
    await requireUser(context.userId);
    const { ingestStreamClip } = await import("@/lib/server/library-pipeline.server");
    return ingestStreamClip({ actorId: context.userId, clipId: data.clipId });
  });

export const ingestThumbnailFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ messageId: z.string().min(1) }).parse(input))
  .handler(async ({ context, data }) => {
    await requireUser(context.userId);
    const { ingestThumbnailMessage } = await import("@/lib/server/library-pipeline.server");
    return ingestThumbnailMessage({ actorId: context.userId, messageId: data.messageId });
  });

export const listClientClipsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ clientId: z.string().min(1) }).parse(input))
  .handler(async ({ context, data }) => {
    await requireUser(context.userId);
    const { listClipsForClient } = await import("@/lib/server/stream.server");
    const clips = await listClipsForClient(data.clientId);
    return {
      clips: clips
        .filter((row) => row.status === "READY")
        .slice(0, 12)
        .map((row) => ({
          id: row.id,
          title: row.title,
          durationSec: row.durationSec,
          thumbnailUrl: row.thumbnailUrl,
          url: row.url,
        })),
    };
  });
