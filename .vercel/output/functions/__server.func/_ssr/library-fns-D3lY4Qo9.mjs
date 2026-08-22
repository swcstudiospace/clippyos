import { Bt as _enum, Ht as array, Jt as object, Ut as boolean, Zt as string, qt as number } from "../_libs/@better-auth/core+[...].mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
import { m as RENDER_PRESETS, n as ASSET_SOURCES, r as ASSET_STATUSES, t as ASSET_KINDS } from "./library-D-Mt5rXw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/library-fns-D3lY4Qo9.js
var getLibrarySnapshot = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("d0e3d1841310274b49a75af743dd6b116a736e81bf21aedc84ad785b7c3c94fb"));
var listLibraryAssetsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	clientId: string().optional(),
	kind: _enum(ASSET_KINDS).optional(),
	source: _enum(ASSET_SOURCES).optional(),
	status: _enum(ASSET_STATUSES).optional(),
	tag: string().max(40).optional(),
	search: string().max(80).optional()
}).parse(input ?? {})).handler(createSsrRpc("ce907075aa811b7a33b3fbbce9a506aa7cd93e193fe5fa4e03d4ead80b0f7b07"));
var getLibraryAssetFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ id: string().min(1) }).parse(input)).handler(createSsrRpc("0c4dea40ef2609ea73b9f5ad7ce80b441ac0a3f84db7e36afd19eea2a98ad3da"));
var ingestLibraryUrlFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	clientId: string().nullable().optional(),
	url: string().min(8).max(2e3),
	title: string().max(160).optional()
}).parse(input)).handler(createSsrRpc("8cd268b64497df1971ccdf2eea2e8d343b39570ec452e3c33d993fbbf6b09534"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	clientId: string().nullable().optional(),
	title: string().max(160).optional(),
	filename: string().max(180).optional(),
	mime: string().max(80).optional(),
	dataBase64: string().min(8),
	tags: array(string()).optional()
}).parse(input)).handler(createSsrRpc("0a5e0ddad676dccceee79144c78a3d30848ac949d7f0a07eb8815b772494a2d9"));
var generateCaptionsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	assetId: string().min(1),
	language: string().max(8).optional()
}).parse(input)).handler(createSsrRpc("c1c5166b9aef0e93bc069976fd6f059fcc43c20893ce3a6be21f372ba4f0853a"));
var uploadSrtFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	assetId: string().min(1),
	srt: string().min(8).max(4e5)
}).parse(input)).handler(createSsrRpc("b510f5b1f6600c51a18b832b31d44726caacc99dd9de084e23d4d1c25801095b"));
var saveCuesFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	trackId: string().min(1),
	cues: array(object({
		startMs: number(),
		endMs: number(),
		text: string().max(280)
	}))
}).parse(input)).handler(createSsrRpc("a5bac6be63116f6b17e3334e26b94fff950cef6e326630909f743203f182d218"));
var exportCaptionsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	trackId: string().min(1),
	format: _enum(["SRT", "VTT"])
}).parse(input)).handler(createSsrRpc("8616b6192c1497a01fe98d51fca135903f9e5bd856dfcf6b114e9668b3c24217"));
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
}).parse(input)).handler(createSsrRpc("91aeaa0ffbf547bf7a0a377199b025c2dee4e8d2da0df41acbbb801953152d7c"));
var bulkQueueRenderFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	assetIds: array(string().min(1)).min(1).max(12),
	preset: _enum(RENDER_PRESETS),
	burnInCaptions: boolean().optional()
}).parse(input)).handler(createSsrRpc("8e06189f183f0d1e17e41a9b36469f29cded5fb1ab3c19ac899e2cc306bc1eee"));
var cancelRenderFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ jobId: string().min(1) }).parse(input)).handler(createSsrRpc("7968d3ca6d2f33b141b26506af8c9a5bbf3807f46b5d4fb58646cd5f7f3ee40e"));
var retryRenderFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ jobId: string().min(1) }).parse(input)).handler(createSsrRpc("45b6458e1676ad1d3694d9285e4e678ad5a3081432242146c824ffe98dc19b6f"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("8619bd3adb97964ea7c8251e1dc809aedefd6388da5b65bed9b81b6b88921d41"));
var archiveAssetFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ assetId: string().min(1) }).parse(input)).handler(createSsrRpc("b1ef0dd1304a6e90397c0b9dcf2249ba79829b30e9eebe1479a009c4af21dd71"));
var tagAssetsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	assetIds: array(string()).min(1).max(24),
	tag: string().min(1).max(32)
}).parse(input)).handler(createSsrRpc("4708da782d8d6b6cb27c1b40f5215b4b433d4f60d61990e242aaa6643e7e6ba5"));
var getMediaSettingsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("350e708e65ab01e6f641c4db3d223d03aaf11b448238f149c187522ef60491a2"));
var saveS3SettingsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	endpoint: string().max(200).optional(),
	region: string().max(40).optional(),
	bucket: string().max(80).optional(),
	accessKey: string().max(120).optional(),
	secret: string().max(200).optional()
}).parse(input)).handler(createSsrRpc("d6760d2a159ba071c3d9f7533e41d776fc1794546b92f67153b878069d9b870f"));
var saveIpfsSettingsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	pinataJwt: string().max(800).optional(),
	gateway: string().max(200).optional(),
	strategy: _enum([
		"eager",
		"on_publish",
		"replicate",
		"manual"
	]).optional()
}).parse(input)).handler(createSsrRpc("f7a2af6a7b1d8f002d3de16445f39a8ed50718ed27fea5dd00f29b71872abf5b"));
var saveMediaSettingsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	defaultPreset: _enum(RENDER_PRESETS).optional(),
	maxUploadMb: number().min(8).max(512).optional(),
	concurrentRenders: number().min(1).max(2).optional(),
	daytonaRender: boolean().optional()
}).parse(input)).handler(createSsrRpc("1843d440e87a2cf7b8f9a2f0ea5c69c39eb0bf046b5467ec26943fa2f3af38ee"));
var testRenderFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("3990431803cea5a9f827818bb7462199d1173f5e53af7ae273c6a69466aee8bd"));
var ingestStreamClipFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ clipId: string().min(1) }).parse(input)).handler(createSsrRpc("2813ed329744fd7e1e97a3381d76b88095f3e26be4f4fedb7df9c29a941a2f74"));
var ingestThumbnailFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ messageId: string().min(1) }).parse(input)).handler(createSsrRpc("54c6a79317bfe61816f7c98a9cb3468ce3565db7ae9c7df96c3810444d11ff29"));
var listClientClipsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ clientId: string().min(1) }).parse(input)).handler(createSsrRpc("5410f1f97907126c7d58368b6ba6c8c258c56646fbc9ec8d72c65be7eeb45255"));
//#endregion
export { uploadSrtFn as S, saveIpfsSettingsFn as _, generateCaptionsFn as a, tagAssetsFn as b, getMediaSettingsFn as c, ingestThumbnailFn as d, listClientClipsFn as f, saveCuesFn as g, retryRenderFn as h, exportCaptionsFn as i, ingestLibraryUrlFn as l, queueRenderFn as m, bulkQueueRenderFn as n, getLibraryAssetFn as o, listLibraryAssetsFn as p, cancelRenderFn as r, getLibrarySnapshot as s, archiveAssetFn as t, ingestStreamClipFn as u, saveMediaSettingsFn as v, testRenderFn as x, saveS3SettingsFn as y };
