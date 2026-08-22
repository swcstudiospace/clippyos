import { Bt as _enum, Ht as array, Jt as object, Ut as boolean, Zt as string, qt as number } from "../_libs/@better-auth/core+[...].mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
import { l as PERFORMANCE_WINDOWS, o as PERFORMANCE_PLATFORMS, p as PROPOSAL_STATUSES } from "./performance-Cj9pmeSi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/performance-fns-BnwGGujQ.js
var getPerformanceSnapshot = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("e40ef17a58079a1223552dacb50e4740953660e08588390c89e939c786f5b042"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	clientId: string().optional(),
	platform: _enum(PERFORMANCE_PLATFORMS).optional()
}).parse(input ?? {})).handler(createSsrRpc("5fc058a7f914bdf6ef28435922bf88e869f94dfe791eafed5a1a6aae91fad1a6"));
var refreshPostPerformanceFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	socialPostId: string().optional(),
	sweep: boolean().optional()
}).parse(input ?? {})).handler(createSsrRpc("849808394499fcd764d4263517531e7ddc22b5a9c62e4ab7c994f71a74ce786b"));
var recordManualMetricsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	socialPostId: string().optional(),
	clientId: string().nullable().optional(),
	platform: _enum(PERFORMANCE_PLATFORMS),
	externalPostId: string().min(1).max(200),
	externalUrl: string().max(500).nullable().optional(),
	mediaAssetId: string().nullable().optional(),
	window: _enum(PERFORMANCE_WINDOWS).default("LIFETIME"),
	metrics: object({
		views: number().nonnegative().nullable().optional(),
		likes: number().nonnegative().nullable().optional(),
		comments: number().nonnegative().nullable().optional(),
		shares: number().nonnegative().nullable().optional(),
		saves: number().nonnegative().nullable().optional(),
		watchTimeSec: number().nonnegative().nullable().optional(),
		avgWatchPct: number().nonnegative().nullable().optional(),
		impressions: number().nonnegative().nullable().optional(),
		clicks: number().nonnegative().nullable().optional(),
		ctr: number().nonnegative().nullable().optional()
	})
}).parse(input)).handler(createSsrRpc("974cf93e7247d3021175a4d1b1ba2d96426f26af3b41ae16e472a0e0a5d68fa7"));
var proposeKnowledgeFromAssetFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ assetId: string().min(1) }).parse(input)).handler(createSsrRpc("0c95c067593e270f2f0a099d4ac074e7a039153aca37148a6aec7cdff868b275"));
var listKnowledgeProposalsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	status: _enum(PROPOSAL_STATUSES).optional(),
	clientId: string().optional()
}).parse(input ?? {})).handler(createSsrRpc("1d6b260aae6ac6f63b34b41442364b517f864d99b5319f7e7a44169f1d814b5d"));
var decideKnowledgeProposalFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	id: string().min(1),
	decision: _enum(["APPROVED", "REJECTED"]),
	note: string().max(400).optional()
}).parse(input)).handler(createSsrRpc("02489103f887f9df6f7df94b30a6b2743ded3de11be4c2b956f9a98ae083b9d7"));
var getLearningPolicyFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("23c9e8c426f80a1e9ea259a9f218bd8bf96f81be5fa71e55e60018636d9981fe"));
var saveLearningPolicyFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	enabled: boolean(),
	autoMerge: boolean(),
	winnerPercentile: number().int().min(50).max(99),
	minScore: number().int().min(0).max(100),
	minViews: number().int().min(0).max(1e6),
	fetchDelaysHours: array(number().min(0).max(720)).max(6)
}).parse(input)).handler(createSsrRpc("473a271b06021773d54bdbcd4da9967197e3ef73a0f6e06968a1fe25a8ec7d11"));
//#endregion
export { proposeKnowledgeFromAssetFn as a, saveLearningPolicyFn as c, listKnowledgeProposalsFn as i, getLearningPolicyFn as n, recordManualMetricsFn as o, getPerformanceSnapshot as r, refreshPostPerformanceFn as s, decideKnowledgeProposalFn as t };
