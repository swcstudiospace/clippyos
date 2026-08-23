/**
 * library.* tools for Agent / MCP / API. Never returns storage keys or signing secrets.
 */
import { sanitizeText } from "@/lib/sanitize";
import type { RenderPreset } from "@/lib/library";
import { RENDER_PRESETS } from "@/lib/library";
import { getAsset, listAssets, listCaptions, listRenders, readMediaSettings } from "@/lib/server/library.server";
import {
  ingestFromUrl,
  ingestStreamClip,
  queueRender,
  resolvePublishAsset,
} from "@/lib/server/library-pipeline.server";

function str(payload: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export async function handleLibraryAction(
  action: string,
  payload: Record<string, unknown>,
  actorId: string,
): Promise<unknown> {
  switch (action) {
    case "library.search_assets": {
      const limitRaw = Number(payload.limit);
      const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(80, Math.floor(limitRaw)) : 40;
      const assets = await listAssets(
        {
          clientId: str(payload, "clientId") || undefined,
          kind: payload.kind as never,
          source: payload.source as never,
          status: payload.status as never,
          search: str(payload, "search", "q", "query") || undefined,
          tag: str(payload, "tag") || undefined,
        },
        limit,
      );
      return {
        assets: assets.map((row) => ({
          id: row.id,
          clientId: row.clientId,
          kind: row.kind,
          title: row.title,
          source: row.source,
          status: row.status,
          durationSec: row.durationSec,
          aspectRatio: row.aspectRatio,
          tags: row.tags,
          previewUrl: row.previewUrl,
        })),
      };
    }
    case "library.get_asset": {
      const id = str(payload, "id", "assetId");
      if (!id) throw new Error("VALIDATION");
      const asset = await getAsset(id);
      if (!asset) throw new Error("ASSET_MISSING");
      const captions = await listCaptions(asset.id);
      return {
        asset: {
          id: asset.id,
          clientId: asset.clientId,
          kind: asset.kind,
          title: asset.title,
          source: asset.source,
          status: asset.status,
          durationSec: asset.durationSec,
          aspectRatio: asset.aspectRatio,
          previewUrl: asset.previewUrl,
          tags: asset.tags,
        },
        captions: captions.map((row) => ({
          id: row.id,
          status: row.status,
          language: row.language,
          cueCount: row.cues.length,
          engine: row.engine,
        })),
      };
    }
    case "library.ingest_url": {
      const url = str(payload, "url");
      const clientId = str(payload, "clientId") || null;
      if (!url) throw new Error("VALIDATION");
      return ingestFromUrl({
        actorId,
        clientId,
        url,
        title: str(payload, "title") || undefined,
      });
    }
    case "library.ingest_stream_clip": {
      const clipId = str(payload, "clipId", "streamClipId");
      if (!clipId) throw new Error("VALIDATION");
      const asset = await ingestStreamClip({ actorId, clipId });
      return { assetId: asset.id, title: asset.title, status: asset.status };
    }
    case "library.ingest_thumbnail": {
      const messageId = str(payload, "messageId", "thumbnailMessageId");
      if (!messageId) throw new Error("VALIDATION");
      const { ingestThumbnailMessage } = await import("@/lib/server/library-pipeline.server");
      const asset = await ingestThumbnailMessage({ actorId, messageId });
      return { assetId: asset.id, title: asset.title, status: asset.status };
    }
    case "library.queue_render": {
      const assetId = str(payload, "assetId", "id");
      const presetRaw = str(payload, "preset") || "REELS_9x16";
      if (!assetId) throw new Error("VALIDATION");
      const preset = (RENDER_PRESETS as readonly string[]).includes(presetRaw)
        ? (presetRaw as RenderPreset)
        : "REELS_9x16";
      const job = await queueRender({
        actorId,
        assetId,
        preset,
        captionTrackId: str(payload, "captionTrackId") || null,
        options: {
          burnInCaptions: payload.burnInCaptions === true,
          loudnorm: payload.loudnorm !== false,
          format: "mp4",
        },
      });
      return {
        jobId: job.id,
        status: job.status,
        preset: job.preset,
      };
    }
    case "library.list_renders": {
      const jobs = await listRenders({
        sourceAssetId: str(payload, "assetId") || undefined,
      });
      return {
        jobs: jobs.map((row) => ({
          id: row.id,
          status: row.status,
          preset: row.preset,
          progressPercent: row.progressPercent,
          outputAssetId: row.outputAssetId,
          error: row.error,
          sourceTitle: row.sourceTitle,
        })),
      };
    }
    case "library.attach_to_social_job": {
      const clientId = str(payload, "clientId");
      const mediaAssetId = str(payload, "mediaAssetId", "assetId");
      if (!clientId || !mediaAssetId) throw new Error("VALIDATION");
      const resolved = await resolvePublishAsset({
        mediaAssetId,
        clientId,
        platforms: Array.isArray(payload.platforms) ? payload.platforms.map(String) : undefined,
      });
      const platforms = Array.isArray(payload.platforms)
        ? payload.platforms.map(String)
        : ["instagram", "tiktok"];
      const { handleSocialAction } = await import("@/lib/server/social-ops.server");
      return handleSocialAction(
        "social.create_upload_job",
        {
          clientId,
          mediaAssetId: resolved.asset.id,
          assetId: resolved.asset.id,
          platforms,
          caption: sanitizeText(str(payload, "caption")).slice(0, 2200),
          mediaUrl: resolved.mediaUrl,
          mode: payload.mode === "publish" ? "publish" : "draft",
          preferredRail: "AUTO",
          fallbackToBrowser: true,
        },
        actorId,
      );
    }
    case "library.get_pipeline_status": {
      const settings = await readMediaSettings();
      return {
        transcriptionConfigured: settings.transcriptionConfigured,
        transcriptionEngine: settings.transcriptionEngine,
        ffmpegAvailable: settings.ffmpegAvailable,
        defaultPreset: settings.defaultPreset,
        concurrentRenders: settings.concurrentRenders,
      };
    }
    default:
      return undefined;
  }
}
