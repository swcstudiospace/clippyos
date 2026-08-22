import { Bt as _enum, Ht as array, Jt as object, Ut as boolean, Zt as string, qt as number } from "../_libs/@better-auth/core+[...].mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { d as readClients } from "./clients-CmcyBPZd.mjs";
import { n as getUserRole } from "./access-CV3glphY.mjs";
import { m as RENDER_PRESETS, n as ASSET_SOURCES, r as ASSET_STATUSES, t as ASSET_KINDS } from "./library-D-Mt5rXw.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/library-fns-DNCSvvbl.js
async function requireUser(userId) {
	const role = await getUserRole(userId);
	if (!role) throw new Error("Forbidden");
	return role;
}
var getLibrarySnapshot_createServerFn_handler = createServerRpc({
	id: "d0e3d1841310274b49a75af743dd6b116a736e81bf21aedc84ad785b7c3c94fb",
	name: "getLibrarySnapshot",
	filename: "src/lib/server/library-fns.ts"
}, (opts) => getLibrarySnapshot.__executeServer(opts));
var getLibrarySnapshot = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getLibrarySnapshot_createServerFn_handler, async ({ context }) => {
	const role = await requireUser(context.userId);
	const { listAssets, listRenders, readMediaSettings } = await import("./library.server-vya-JVML.mjs").then((n) => n.p);
	const clients = await readClients();
	const [assets, renders, settings] = await Promise.all([
		listAssets({}, 80),
		listRenders(),
		readMediaSettings()
	]);
	let rollups = [];
	try {
		rollups = await (await import("./performance.server-kOlT5k3Z.mjs")).listAssetRollups();
	} catch {
		rollups = [];
	}
	return {
		assets,
		renders,
		clients: clients.filter((row) => !row.deletedAt).map((row) => ({
			id: row.id,
			name: row.name
		})),
		role,
		settings,
		rollups
	};
});
var listLibraryAssetsFn_createServerFn_handler = createServerRpc({
	id: "ce907075aa811b7a33b3fbbce9a506aa7cd93e193fe5fa4e03d4ead80b0f7b07",
	name: "listLibraryAssetsFn",
	filename: "src/lib/server/library-fns.ts"
}, (opts) => listLibraryAssetsFn.__executeServer(opts));
var listLibraryAssetsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	clientId: string().optional(),
	kind: _enum(ASSET_KINDS).optional(),
	source: _enum(ASSET_SOURCES).optional(),
	status: _enum(ASSET_STATUSES).optional(),
	tag: string().max(40).optional(),
	search: string().max(80).optional()
}).parse(input ?? {})).handler(listLibraryAssetsFn_createServerFn_handler, async ({ context, data }) => {
	await requireUser(context.userId);
	const { listAssets } = await import("./library.server-vya-JVML.mjs").then((n) => n.p);
	return { assets: await listAssets(data, 80) };
});
var getLibraryAssetFn_createServerFn_handler = createServerRpc({
	id: "0c4dea40ef2609ea73b9f5ad7ce80b441ac0a3f84db7e36afd19eea2a98ad3da",
	name: "getLibraryAssetFn",
	filename: "src/lib/server/library-fns.ts"
}, (opts) => getLibraryAssetFn.__executeServer(opts));
var getLibraryAssetFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ id: string().min(1) }).parse(input)).handler(getLibraryAssetFn_createServerFn_handler, async ({ context, data }) => {
	await requireUser(context.userId);
	const { getAsset, listVersions, listCaptions, derivedRenders, listRenders } = await import("./library.server-vya-JVML.mjs").then((n) => n.p);
	const asset = await getAsset(data.id);
	if (!asset) throw new Error("ASSET_MISSING");
	const [versions, captions, derived, renders] = await Promise.all([
		listVersions(asset.id),
		listCaptions(asset.id),
		derivedRenders(asset.id),
		listRenders({ sourceAssetId: asset.id })
	]);
	let performance = null;
	let snapshots = [];
	try {
		const perf = await import("./performance.server-kOlT5k3Z.mjs");
		performance = await perf.getAssetRollup(asset.id);
		snapshots = await perf.listPostPerformance({
			mediaAssetId: asset.id,
			limit: 20
		});
	} catch {
		performance = null;
		snapshots = [];
	}
	return {
		asset,
		versions,
		captions,
		derived,
		renders,
		performance,
		snapshots
	};
});
var ingestLibraryUrlFn_createServerFn_handler = createServerRpc({
	id: "8cd268b64497df1971ccdf2eea2e8d343b39570ec452e3c33d993fbbf6b09534",
	name: "ingestLibraryUrlFn",
	filename: "src/lib/server/library-fns.ts"
}, (opts) => ingestLibraryUrlFn.__executeServer(opts));
var ingestLibraryUrlFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	clientId: string().nullable().optional(),
	url: string().min(8).max(2e3),
	title: string().max(160).optional()
}).parse(input)).handler(ingestLibraryUrlFn_createServerFn_handler, async ({ context, data }) => {
	await requireUser(context.userId);
	const { ingestFromUrl } = await import("./library-pipeline.server-Cj0cLHTT.mjs").then((n) => n.i);
	return ingestFromUrl({
		actorId: context.userId,
		clientId: data.clientId ?? null,
		url: data.url,
		title: data.title
	});
});
var ingestLibraryFileFn_createServerFn_handler = createServerRpc({
	id: "0a5e0ddad676dccceee79144c78a3d30848ac949d7f0a07eb8815b772494a2d9",
	name: "ingestLibraryFileFn",
	filename: "src/lib/server/library-fns.ts"
}, (opts) => ingestLibraryFileFn.__executeServer(opts));
var ingestLibraryFileFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	clientId: string().nullable().optional(),
	title: string().max(160).optional(),
	filename: string().max(180).optional(),
	mime: string().max(80).optional(),
	dataBase64: string().min(8),
	tags: array(string()).optional()
}).parse(input)).handler(ingestLibraryFileFn_createServerFn_handler, async ({ context, data }) => {
	await requireUser(context.userId);
	const settings = await (await import("./library.server-vya-JVML.mjs").then((n) => n.p)).readMediaSettings();
	const buf = Buffer.from(data.dataBase64, "base64");
	if (buf.length > settings.maxUploadMb * 1024 * 1024) throw new Error("MEDIA_TOO_LARGE");
	const { ingestBytes } = await import("./library-pipeline.server-Cj0cLHTT.mjs").then((n) => n.i);
	return ingestBytes({
		actorId: context.userId,
		clientId: data.clientId ?? null,
		title: data.title || data.filename || "Upload",
		filename: data.filename,
		mimeHint: data.mime,
		bytes: buf,
		source: "UPLOAD",
		tags: data.tags
	});
});
var generateCaptionsFn_createServerFn_handler = createServerRpc({
	id: "c1c5166b9aef0e93bc069976fd6f059fcc43c20893ce3a6be21f372ba4f0853a",
	name: "generateCaptionsFn",
	filename: "src/lib/server/library-fns.ts"
}, (opts) => generateCaptionsFn.__executeServer(opts));
var generateCaptionsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	assetId: string().min(1),
	language: string().max(8).optional()
}).parse(input)).handler(generateCaptionsFn_createServerFn_handler, async ({ context, data }) => {
	await requireUser(context.userId);
	const { generateCaptions } = await import("./library-pipeline.server-Cj0cLHTT.mjs").then((n) => n.i);
	return generateCaptions({
		actorId: context.userId,
		assetId: data.assetId,
		language: data.language
	});
});
var uploadSrtFn_createServerFn_handler = createServerRpc({
	id: "b510f5b1f6600c51a18b832b31d44726caacc99dd9de084e23d4d1c25801095b",
	name: "uploadSrtFn",
	filename: "src/lib/server/library-fns.ts"
}, (opts) => uploadSrtFn.__executeServer(opts));
var uploadSrtFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	assetId: string().min(1),
	srt: string().min(8).max(4e5)
}).parse(input)).handler(uploadSrtFn_createServerFn_handler, async ({ context, data }) => {
	await requireUser(context.userId);
	const { uploadSrt } = await import("./library-pipeline.server-Cj0cLHTT.mjs").then((n) => n.i);
	return uploadSrt({
		actorId: context.userId,
		assetId: data.assetId,
		srt: data.srt
	});
});
var saveCuesFn_createServerFn_handler = createServerRpc({
	id: "a5bac6be63116f6b17e3334e26b94fff950cef6e326630909f743203f182d218",
	name: "saveCuesFn",
	filename: "src/lib/server/library-fns.ts"
}, (opts) => saveCuesFn.__executeServer(opts));
var saveCuesFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	trackId: string().min(1),
	cues: array(object({
		startMs: number(),
		endMs: number(),
		text: string().max(280)
	}))
}).parse(input)).handler(saveCuesFn_createServerFn_handler, async ({ context, data }) => {
	await requireUser(context.userId);
	const { saveCues } = await import("./library-pipeline.server-Cj0cLHTT.mjs").then((n) => n.i);
	return saveCues({
		actorId: context.userId,
		trackId: data.trackId,
		cues: data.cues
	});
});
var exportCaptionsFn_createServerFn_handler = createServerRpc({
	id: "8616b6192c1497a01fe98d51fca135903f9e5bd856dfcf6b114e9668b3c24217",
	name: "exportCaptionsFn",
	filename: "src/lib/server/library-fns.ts"
}, (opts) => exportCaptionsFn.__executeServer(opts));
var exportCaptionsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	trackId: string().min(1),
	format: _enum(["SRT", "VTT"])
}).parse(input)).handler(exportCaptionsFn_createServerFn_handler, async ({ context, data }) => {
	await requireUser(context.userId);
	const { captionExport } = await import("./library-pipeline.server-Cj0cLHTT.mjs").then((n) => n.i);
	return captionExport(data.trackId, data.format);
});
var queueRenderFn_createServerFn_handler = createServerRpc({
	id: "91aeaa0ffbf547bf7a0a377199b025c2dee4e8d2da0df41acbbb801953152d7c",
	name: "queueRenderFn",
	filename: "src/lib/server/library-fns.ts"
}, (opts) => queueRenderFn.__executeServer(opts));
var queueRenderFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	assetId: string().min(1),
	preset: _enum(RENDER_PRESETS),
	burnInCaptions: boolean().optional(),
	captionTrackId: string().nullable().optional(),
	loudnorm: boolean().optional(),
	trim: object({
		startMs: number(),
		endMs: number()
	}).optional()
}).parse(input)).handler(queueRenderFn_createServerFn_handler, async ({ context, data }) => {
	await requireUser(context.userId);
	const { queueRender } = await import("./library-pipeline.server-Cj0cLHTT.mjs").then((n) => n.i);
	return queueRender({
		actorId: context.userId,
		assetId: data.assetId,
		preset: data.preset,
		captionTrackId: data.captionTrackId,
		options: {
			burnInCaptions: data.burnInCaptions,
			loudnorm: data.loudnorm,
			trim: data.trim,
			format: "mp4"
		}
	});
});
var bulkQueueRenderFn_createServerFn_handler = createServerRpc({
	id: "8e06189f183f0d1e17e41a9b36469f29cded5fb1ab3c19ac899e2cc306bc1eee",
	name: "bulkQueueRenderFn",
	filename: "src/lib/server/library-fns.ts"
}, (opts) => bulkQueueRenderFn.__executeServer(opts));
var bulkQueueRenderFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	assetIds: array(string().min(1)).min(1).max(12),
	preset: _enum(RENDER_PRESETS),
	burnInCaptions: boolean().optional()
}).parse(input)).handler(bulkQueueRenderFn_createServerFn_handler, async ({ context, data }) => {
	await requireUser(context.userId);
	const { queueRender } = await import("./library-pipeline.server-Cj0cLHTT.mjs").then((n) => n.i);
	const jobs = [];
	for (const assetId of data.assetIds) jobs.push(await queueRender({
		actorId: context.userId,
		assetId,
		preset: data.preset,
		options: {
			burnInCaptions: data.burnInCaptions,
			format: "mp4"
		}
	}));
	return { jobs };
});
var cancelRenderFn_createServerFn_handler = createServerRpc({
	id: "7968d3ca6d2f33b141b26506af8c9a5bbf3807f46b5d4fb58646cd5f7f3ee40e",
	name: "cancelRenderFn",
	filename: "src/lib/server/library-fns.ts"
}, (opts) => cancelRenderFn.__executeServer(opts));
var cancelRenderFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ jobId: string().min(1) }).parse(input)).handler(cancelRenderFn_createServerFn_handler, async ({ context, data }) => {
	await requireUser(context.userId);
	const { cancelRender } = await import("./library-pipeline.server-Cj0cLHTT.mjs").then((n) => n.i);
	return cancelRender({
		actorId: context.userId,
		jobId: data.jobId
	});
});
var retryRenderFn_createServerFn_handler = createServerRpc({
	id: "45b6458e1676ad1d3694d9285e4e678ad5a3081432242146c824ffe98dc19b6f",
	name: "retryRenderFn",
	filename: "src/lib/server/library-fns.ts"
}, (opts) => retryRenderFn.__executeServer(opts));
var retryRenderFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ jobId: string().min(1) }).parse(input)).handler(retryRenderFn_createServerFn_handler, async ({ context, data }) => {
	await requireUser(context.userId);
	const { retryRender } = await import("./library-pipeline.server-Cj0cLHTT.mjs").then((n) => n.i);
	return retryRender({
		actorId: context.userId,
		jobId: data.jobId
	});
});
var listRendersFn_createServerFn_handler = createServerRpc({
	id: "8619bd3adb97964ea7c8251e1dc809aedefd6388da5b65bed9b81b6b88921d41",
	name: "listRendersFn",
	filename: "src/lib/server/library-fns.ts"
}, (opts) => listRendersFn.__executeServer(opts));
var listRendersFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listRendersFn_createServerFn_handler, async ({ context }) => {
	await requireUser(context.userId);
	const { listRenders } = await import("./library.server-vya-JVML.mjs").then((n) => n.p);
	return { renders: await listRenders() };
});
var archiveAssetFn_createServerFn_handler = createServerRpc({
	id: "b1ef0dd1304a6e90397c0b9dcf2249ba79829b30e9eebe1479a009c4af21dd71",
	name: "archiveAssetFn",
	filename: "src/lib/server/library-fns.ts"
}, (opts) => archiveAssetFn.__executeServer(opts));
var archiveAssetFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ assetId: string().min(1) }).parse(input)).handler(archiveAssetFn_createServerFn_handler, async ({ context, data }) => {
	const role = await requireUser(context.userId);
	const { archiveAsset } = await import("./library-pipeline.server-Cj0cLHTT.mjs").then((n) => n.i);
	await archiveAsset({
		actorId: context.userId,
		assetId: data.assetId,
		role
	});
	return { ok: true };
});
var tagAssetsFn_createServerFn_handler = createServerRpc({
	id: "4708da782d8d6b6cb27c1b40f5215b4b433d4f60d61990e242aaa6643e7e6ba5",
	name: "tagAssetsFn",
	filename: "src/lib/server/library-fns.ts"
}, (opts) => tagAssetsFn.__executeServer(opts));
var tagAssetsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	assetIds: array(string()).min(1).max(24),
	tag: string().min(1).max(32)
}).parse(input)).handler(tagAssetsFn_createServerFn_handler, async ({ context, data }) => {
	await requireUser(context.userId);
	const { getAsset, patchAsset } = await import("./library.server-vya-JVML.mjs").then((n) => n.p);
	const tag = data.tag.trim().toLowerCase().replace(/\s+/g, "-");
	for (const id of data.assetIds) {
		const asset = await getAsset(id);
		if (!asset) continue;
		if (asset.tags.includes(tag)) continue;
		await patchAsset(id, { tags: [...asset.tags, tag].slice(0, 24) });
	}
	return { ok: true };
});
var getMediaSettingsFn_createServerFn_handler = createServerRpc({
	id: "350e708e65ab01e6f641c4db3d223d03aaf11b448238f149c187522ef60491a2",
	name: "getMediaSettingsFn",
	filename: "src/lib/server/library-fns.ts"
}, (opts) => getMediaSettingsFn.__executeServer(opts));
var getMediaSettingsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getMediaSettingsFn_createServerFn_handler, async ({ context }) => {
	await requireUser(context.userId);
	const { readMediaSettings } = await import("./library.server-vya-JVML.mjs").then((n) => n.p);
	return readMediaSettings();
});
var saveS3SettingsFn_createServerFn_handler = createServerRpc({
	id: "d6760d2a159ba071c3d9f7533e41d776fc1794546b92f67153b878069d9b870f",
	name: "saveS3SettingsFn",
	filename: "src/lib/server/library-fns.ts"
}, (opts) => saveS3SettingsFn.__executeServer(opts));
var saveS3SettingsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	endpoint: string().max(200).optional(),
	region: string().max(40).optional(),
	bucket: string().max(80).optional(),
	accessKey: string().max(120).optional(),
	secret: string().max(200).optional()
}).parse(input)).handler(saveS3SettingsFn_createServerFn_handler, async ({ context, data }) => {
	if (await requireUser(context.userId) !== "admin") throw new Error("Forbidden");
	const { persistS3Settings } = await import("./library-storage.server-DfxOTjeL.mjs").then((n) => n.a).then((n) => n.a);
	await persistS3Settings(data);
	const { readMediaSettings } = await import("./library.server-vya-JVML.mjs").then((n) => n.p);
	return readMediaSettings();
});
var saveIpfsSettingsFn_createServerFn_handler = createServerRpc({
	id: "f7a2af6a7b1d8f002d3de16445f39a8ed50718ed27fea5dd00f29b71872abf5b",
	name: "saveIpfsSettingsFn",
	filename: "src/lib/server/library-fns.ts"
}, (opts) => saveIpfsSettingsFn.__executeServer(opts));
var saveIpfsSettingsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	pinataJwt: string().max(800).optional(),
	gateway: string().max(200).optional(),
	strategy: _enum([
		"eager",
		"on_publish",
		"replicate",
		"manual"
	]).optional()
}).parse(input)).handler(saveIpfsSettingsFn_createServerFn_handler, async ({ context, data }) => {
	if (await requireUser(context.userId) !== "admin") throw new Error("Forbidden");
	const { persistIpfsSettings, testPinataConnection } = await import("./library-storage.server-DfxOTjeL.mjs").then((n) => n.a).then((n) => n.a);
	await persistIpfsSettings(data);
	if (data.pinataJwt?.trim()) await testPinataConnection();
	const { readMediaSettings } = await import("./library.server-vya-JVML.mjs").then((n) => n.p);
	return readMediaSettings();
});
var saveMediaSettingsFn_createServerFn_handler = createServerRpc({
	id: "1843d440e87a2cf7b8f9a2f0ea5c69c39eb0bf046b5467ec26943fa2f3af38ee",
	name: "saveMediaSettingsFn",
	filename: "src/lib/server/library-fns.ts"
}, (opts) => saveMediaSettingsFn.__executeServer(opts));
var saveMediaSettingsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	defaultPreset: _enum(RENDER_PRESETS).optional(),
	maxUploadMb: number().min(8).max(512).optional(),
	concurrentRenders: number().min(1).max(2).optional(),
	daytonaRender: boolean().optional()
}).parse(input)).handler(saveMediaSettingsFn_createServerFn_handler, async ({ context, data }) => {
	if (await requireUser(context.userId) !== "admin") throw new Error("Forbidden");
	const { writeMediaSettings } = await import("./library.server-vya-JVML.mjs").then((n) => n.p);
	return writeMediaSettings(data);
});
var testRenderFn_createServerFn_handler = createServerRpc({
	id: "3990431803cea5a9f827818bb7462199d1173f5e53af7ae273c6a69466aee8bd",
	name: "testRenderFn",
	filename: "src/lib/server/library-fns.ts"
}, (opts) => testRenderFn.__executeServer(opts));
var testRenderFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(testRenderFn_createServerFn_handler, async ({ context }) => {
	if (await requireUser(context.userId) !== "admin") throw new Error("Forbidden");
	const { testRender } = await import("./library-pipeline.server-Cj0cLHTT.mjs").then((n) => n.i);
	return testRender(context.userId);
});
var ingestStreamClipFn_createServerFn_handler = createServerRpc({
	id: "2813ed329744fd7e1e97a3381d76b88095f3e26be4f4fedb7df9c29a941a2f74",
	name: "ingestStreamClipFn",
	filename: "src/lib/server/library-fns.ts"
}, (opts) => ingestStreamClipFn.__executeServer(opts));
var ingestStreamClipFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ clipId: string().min(1) }).parse(input)).handler(ingestStreamClipFn_createServerFn_handler, async ({ context, data }) => {
	await requireUser(context.userId);
	const { ingestStreamClip } = await import("./library-pipeline.server-Cj0cLHTT.mjs").then((n) => n.i);
	return ingestStreamClip({
		actorId: context.userId,
		clipId: data.clipId
	});
});
var ingestThumbnailFn_createServerFn_handler = createServerRpc({
	id: "54c6a79317bfe61816f7c98a9cb3468ce3565db7ae9c7df96c3810444d11ff29",
	name: "ingestThumbnailFn",
	filename: "src/lib/server/library-fns.ts"
}, (opts) => ingestThumbnailFn.__executeServer(opts));
var ingestThumbnailFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ messageId: string().min(1) }).parse(input)).handler(ingestThumbnailFn_createServerFn_handler, async ({ context, data }) => {
	await requireUser(context.userId);
	const { ingestThumbnailMessage } = await import("./library-pipeline.server-Cj0cLHTT.mjs").then((n) => n.i);
	return ingestThumbnailMessage({
		actorId: context.userId,
		messageId: data.messageId
	});
});
var listClientClipsFn_createServerFn_handler = createServerRpc({
	id: "5410f1f97907126c7d58368b6ba6c8c258c56646fbc9ec8d72c65be7eeb45255",
	name: "listClientClipsFn",
	filename: "src/lib/server/library-fns.ts"
}, (opts) => listClientClipsFn.__executeServer(opts));
var listClientClipsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ clientId: string().min(1) }).parse(input)).handler(listClientClipsFn_createServerFn_handler, async ({ context, data }) => {
	await requireUser(context.userId);
	const { listClipsForClient } = await import("./stream.server-Cb1Ya4Jr.mjs");
	return { clips: (await listClipsForClient(data.clientId)).filter((row) => row.status === "READY").slice(0, 12).map((row) => ({
		id: row.id,
		title: row.title,
		durationSec: row.durationSec,
		thumbnailUrl: row.thumbnailUrl,
		url: row.url
	})) };
});
//#endregion
export { archiveAssetFn_createServerFn_handler, bulkQueueRenderFn_createServerFn_handler, cancelRenderFn_createServerFn_handler, exportCaptionsFn_createServerFn_handler, generateCaptionsFn_createServerFn_handler, getLibraryAssetFn_createServerFn_handler, getLibrarySnapshot_createServerFn_handler, getMediaSettingsFn_createServerFn_handler, ingestLibraryFileFn_createServerFn_handler, ingestLibraryUrlFn_createServerFn_handler, ingestStreamClipFn_createServerFn_handler, ingestThumbnailFn_createServerFn_handler, listClientClipsFn_createServerFn_handler, listLibraryAssetsFn_createServerFn_handler, listRendersFn_createServerFn_handler, queueRenderFn_createServerFn_handler, retryRenderFn_createServerFn_handler, saveCuesFn_createServerFn_handler, saveIpfsSettingsFn_createServerFn_handler, saveMediaSettingsFn_createServerFn_handler, saveS3SettingsFn_createServerFn_handler, tagAssetsFn_createServerFn_handler, testRenderFn_createServerFn_handler, uploadSrtFn_createServerFn_handler };
