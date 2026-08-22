import { t as sanitizeText } from "./sanitize-DAA2oq7r.mjs";
import { m as RENDER_PRESETS } from "./library-D-Mt5rXw.mjs";
import { b as readMediaSettings, g as listRenders, h as listCaptions, i as getAsset, m as listAssets } from "./library.server-vya-JVML.mjs";
import { a as queueRender, n as ingestFromUrl, o as resolvePublishAsset, r as ingestStreamClip } from "./library-pipeline.server-Cj0cLHTT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/library-tools.server--PSoEAfd.js
/**
* library.* tools for Agent / MCP / API. Never returns storage keys or signing secrets.
*/
function str(payload, ...keys) {
	for (const key of keys) {
		const value = payload[key];
		if (typeof value === "string" && value.trim()) return value.trim();
	}
	return "";
}
async function handleLibraryAction(action, payload, actorId) {
	switch (action) {
		case "library.search_assets": return { assets: (await listAssets({
			clientId: str(payload, "clientId") || void 0,
			kind: payload.kind,
			source: payload.source,
			status: payload.status,
			search: str(payload, "search", "q") || void 0,
			tag: str(payload, "tag") || void 0
		}, 40)).map((row) => ({
			id: row.id,
			clientId: row.clientId,
			kind: row.kind,
			title: row.title,
			source: row.source,
			status: row.status,
			durationSec: row.durationSec,
			aspectRatio: row.aspectRatio,
			tags: row.tags,
			previewUrl: row.previewUrl
		})) };
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
					tags: asset.tags
				},
				captions: captions.map((row) => ({
					id: row.id,
					status: row.status,
					language: row.language,
					cueCount: row.cues.length,
					engine: row.engine
				}))
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
				title: str(payload, "title") || void 0
			});
		}
		case "library.ingest_stream_clip": {
			const clipId = str(payload, "clipId", "streamClipId");
			if (!clipId) throw new Error("VALIDATION");
			const asset = await ingestStreamClip({
				actorId,
				clipId
			});
			return {
				assetId: asset.id,
				title: asset.title,
				status: asset.status
			};
		}
		case "library.ingest_thumbnail": {
			const messageId = str(payload, "messageId", "thumbnailMessageId");
			if (!messageId) throw new Error("VALIDATION");
			const { ingestThumbnailMessage } = await import("./library-pipeline.server-Cj0cLHTT.mjs").then((n) => n.i);
			const asset = await ingestThumbnailMessage({
				actorId,
				messageId
			});
			return {
				assetId: asset.id,
				title: asset.title,
				status: asset.status
			};
		}
		case "library.queue_render": {
			const assetId = str(payload, "assetId", "id");
			const presetRaw = str(payload, "preset") || "REELS_9x16";
			if (!assetId) throw new Error("VALIDATION");
			const preset = RENDER_PRESETS.includes(presetRaw) ? presetRaw : "REELS_9x16";
			const job = await queueRender({
				actorId,
				assetId,
				preset,
				captionTrackId: str(payload, "captionTrackId") || null,
				options: {
					burnInCaptions: payload.burnInCaptions === true,
					loudnorm: payload.loudnorm !== false,
					format: "mp4"
				}
			});
			return {
				jobId: job.id,
				status: job.status,
				preset: job.preset
			};
		}
		case "library.list_renders": return { jobs: (await listRenders({ sourceAssetId: str(payload, "assetId") || void 0 })).map((row) => ({
			id: row.id,
			status: row.status,
			preset: row.preset,
			progressPercent: row.progressPercent,
			outputAssetId: row.outputAssetId,
			error: row.error,
			sourceTitle: row.sourceTitle
		})) };
		case "library.attach_to_social_job": {
			const clientId = str(payload, "clientId");
			const mediaAssetId = str(payload, "mediaAssetId", "assetId");
			if (!clientId || !mediaAssetId) throw new Error("VALIDATION");
			const resolved = await resolvePublishAsset({
				mediaAssetId,
				clientId,
				platforms: Array.isArray(payload.platforms) ? payload.platforms.map(String) : void 0
			});
			const platforms = Array.isArray(payload.platforms) ? payload.platforms.map(String) : ["instagram", "tiktok"];
			const { handleSocialAction } = await import("./social-ops.server-B3WyGuEW.mjs");
			return handleSocialAction("social.create_upload_job", {
				clientId,
				mediaAssetId: resolved.asset.id,
				assetId: resolved.asset.id,
				platforms,
				caption: sanitizeText(str(payload, "caption")).slice(0, 2200),
				mediaUrl: resolved.mediaUrl,
				mode: payload.mode === "publish" ? "publish" : "draft",
				preferredRail: "AUTO",
				fallbackToBrowser: true
			}, actorId);
		}
		case "library.get_pipeline_status": {
			const settings = await readMediaSettings();
			return {
				transcriptionConfigured: settings.transcriptionConfigured,
				transcriptionEngine: settings.transcriptionEngine,
				ffmpegAvailable: settings.ffmpegAvailable,
				defaultPreset: settings.defaultPreset,
				concurrentRenders: settings.concurrentRenders
			};
		}
		default: return;
	}
}
//#endregion
export { handleLibraryAction };
