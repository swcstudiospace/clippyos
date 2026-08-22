import { Bt as _enum, Ht as array, Jt as object, Ut as boolean, Zt as string, qt as number } from "../_libs/@better-auth/core+[...].mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { n as getUserRole } from "./access-CV3glphY.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { T as parseMetrics, l as PERFORMANCE_WINDOWS, o as PERFORMANCE_PLATFORMS, p as PROPOSAL_STATUSES } from "./performance-Cj9pmeSi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/performance-fns-2bQQiByh.js
async function requireUser(userId) {
	const role = await getUserRole(userId);
	if (!role) throw new Error("Forbidden");
	return role;
}
var getPerformanceSnapshot_createServerFn_handler = createServerRpc({
	id: "e40ef17a58079a1223552dacb50e4740953660e08588390c89e939c786f5b042",
	name: "getPerformanceSnapshot",
	filename: "src/lib/server/performance-fns.ts"
}, (opts) => getPerformanceSnapshot.__executeServer(opts));
var getPerformanceSnapshot = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getPerformanceSnapshot_createServerFn_handler, async ({ context }) => {
	await requireUser(context.userId);
	try {
		const { sweepDuePerformanceFetches } = await import("./performance-fetch.server-BDzg5W1p.mjs");
		await sweepDuePerformanceFetches(8).catch(() => 0);
		const { listPostPerformance, listAssetRollups, readLearningPolicy } = await import("./performance.server-kOlT5k3Z.mjs");
		const { listKnowledgeProposals } = await import("./knowledge-proposals.server-C0stV1-L.mjs");
		const { metricsApiStatus } = await import("./performance-fetch.server-BDzg5W1p.mjs");
		const [posts, rollups, proposals, policy, metricsApi] = await Promise.all([
			listPostPerformance({ limit: 200 }),
			listAssetRollups(),
			listKnowledgeProposals({ limit: 80 }),
			readLearningPolicy(),
			metricsApiStatus()
		]);
		return {
			posts,
			rollups,
			proposals,
			policy,
			metricsApi
		};
	} catch {
		const { DEFAULT_LEARNING_POLICY } = await import("./performance-Cj9pmeSi.mjs").then((n) => n.D).then((n) => n.D);
		return {
			posts: [],
			rollups: [],
			proposals: [],
			policy: { ...DEFAULT_LEARNING_POLICY },
			metricsApi: {
				youtube: false,
				x: false,
				tiktok: false,
				instagram: false
			}
		};
	}
});
var listWinnersFn_createServerFn_handler = createServerRpc({
	id: "5fc058a7f914bdf6ef28435922bf88e869f94dfe791eafed5a1a6aae91fad1a6",
	name: "listWinnersFn",
	filename: "src/lib/server/performance-fns.ts"
}, (opts) => listWinnersFn.__executeServer(opts));
var listWinnersFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	clientId: string().optional(),
	platform: _enum(PERFORMANCE_PLATFORMS).optional()
}).parse(input ?? {})).handler(listWinnersFn_createServerFn_handler, async ({ context, data }) => {
	await requireUser(context.userId);
	const { listWinners } = await import("./performance.server-kOlT5k3Z.mjs");
	return { winners: await listWinners(data) };
});
var refreshPostPerformanceFn_createServerFn_handler = createServerRpc({
	id: "849808394499fcd764d4263517531e7ddc22b5a9c62e4ab7c994f71a74ce786b",
	name: "refreshPostPerformanceFn",
	filename: "src/lib/server/performance-fns.ts"
}, (opts) => refreshPostPerformanceFn.__executeServer(opts));
var refreshPostPerformanceFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	socialPostId: string().optional(),
	sweep: boolean().optional()
}).parse(input ?? {})).handler(refreshPostPerformanceFn_createServerFn_handler, async ({ context, data }) => {
	await requireUser(context.userId);
	const fetch = await import("./performance-fetch.server-BDzg5W1p.mjs");
	if (data.sweep) {
		const due = await fetch.sweepDuePerformanceFetches(12);
		const stale = await fetch.sweepStalePublishedPosts();
		const { distillWinnersToProposals } = await import("./knowledge-proposals.server-C0stV1-L.mjs");
		return {
			ok: true,
			due,
			stale,
			distilled: await distillWinnersToProposals(context.userId, 3).catch(() => 0)
		};
	}
	if (!data.socialPostId) throw new Error("POST_MISSING");
	const result = await fetch.refreshPostById(data.socialPostId, context.userId);
	if (!result.ok) throw new Error(result.reason ?? "METRICS_UNAVAILABLE");
	return {
		ok: true,
		due: 0,
		stale: 0
	};
});
var recordManualMetricsFn_createServerFn_handler = createServerRpc({
	id: "974cf93e7247d3021175a4d1b1ba2d96426f26af3b41ae16e472a0e0a5d68fa7",
	name: "recordManualMetricsFn",
	filename: "src/lib/server/performance-fns.ts"
}, (opts) => recordManualMetricsFn.__executeServer(opts));
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
}).parse(input)).handler(recordManualMetricsFn_createServerFn_handler, async ({ context, data }) => {
	await requireUser(context.userId);
	const { upsertPostPerformance } = await import("./performance.server-kOlT5k3Z.mjs");
	const metrics = parseMetrics(data.metrics);
	if (!Object.values(metrics).some((n) => n != null)) throw new Error("METRICS_EMPTY");
	let publishedAt = null;
	let socialJobId = null;
	let mediaAssetId = data.mediaAssetId ?? null;
	let clientId = data.clientId ?? null;
	let externalUrl = data.externalUrl ?? null;
	if (data.socialPostId) {
		const { readSocialPosts } = await import("./social-Cwlrz0WD.mjs");
		const post = (await readSocialPosts()).find((row) => row.id === data.socialPostId);
		if (post) {
			publishedAt = post.createdAt;
			socialJobId = post.jobId;
			mediaAssetId = mediaAssetId ?? post.contentRef;
			clientId = clientId ?? post.clientId;
			externalUrl = externalUrl ?? post.externalUrl;
		}
	}
	const snapshot = await upsertPostPerformance({
		clientId,
		socialJobId,
		socialPostId: data.socialPostId ?? null,
		platform: data.platform,
		externalPostId: data.externalPostId,
		externalUrl,
		mediaAssetId,
		publishedAt,
		metrics,
		metricsSource: "MANUAL",
		window: data.window,
		createdBy: context.userId
	});
	try {
		const { writeAuditEvent } = await import("./audit.server-B2Y-2eMJ.mjs");
		await writeAuditEvent({
			actorUserId: context.userId,
			actorType: "USER",
			action: "performance.fetched",
			entityType: "post_performance",
			entityId: snapshot.id,
			clientId: snapshot.clientId,
			summary: "Manual performance snapshot",
			metadata: {
				source: "MANUAL",
				window: snapshot.window,
				views: snapshot.metrics.views
			}
		});
	} catch {}
	try {
		const { maybeProposeFromWinner } = await import("./knowledge-proposals.server-C0stV1-L.mjs");
		await maybeProposeFromWinner(snapshot, context.userId);
	} catch {}
	return snapshot;
});
var proposeKnowledgeFromAssetFn_createServerFn_handler = createServerRpc({
	id: "0c95c067593e270f2f0a099d4ac074e7a039153aca37148a6aec7cdff868b275",
	name: "proposeKnowledgeFromAssetFn",
	filename: "src/lib/server/performance-fns.ts"
}, (opts) => proposeKnowledgeFromAssetFn.__executeServer(opts));
var proposeKnowledgeFromAssetFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ assetId: string().min(1) }).parse(input)).handler(proposeKnowledgeFromAssetFn_createServerFn_handler, async ({ context, data }) => {
	await requireUser(context.userId);
	const { listPostPerformance, listWinners } = await import("./performance.server-kOlT5k3Z.mjs");
	const rows = await listPostPerformance({
		mediaAssetId: data.assetId,
		limit: 50
	});
	const winner = rows.find((row) => row.verdict === "WINNER") ?? (await listWinners()).find((row) => row.mediaAssetId === data.assetId) ?? rows[0];
	if (!winner) throw new Error("NO_PERFORMANCE");
	const { createProposalFromPerformance } = await import("./knowledge-proposals.server-C0stV1-L.mjs");
	const proposal = await createProposalFromPerformance(winner, context.userId, { force: true });
	if (!proposal) throw new Error("PROPOSAL_DUPLICATE");
	return proposal;
});
var listKnowledgeProposalsFn_createServerFn_handler = createServerRpc({
	id: "1d6b260aae6ac6f63b34b41442364b517f864d99b5319f7e7a44169f1d814b5d",
	name: "listKnowledgeProposalsFn",
	filename: "src/lib/server/performance-fns.ts"
}, (opts) => listKnowledgeProposalsFn.__executeServer(opts));
var listKnowledgeProposalsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	status: _enum(PROPOSAL_STATUSES).optional(),
	clientId: string().optional()
}).parse(input ?? {})).handler(listKnowledgeProposalsFn_createServerFn_handler, async ({ context, data }) => {
	await requireUser(context.userId);
	const { listKnowledgeProposals } = await import("./knowledge-proposals.server-C0stV1-L.mjs");
	return { items: await listKnowledgeProposals(data) };
});
var decideKnowledgeProposalFn_createServerFn_handler = createServerRpc({
	id: "02489103f887f9df6f7df94b30a6b2743ded3de11be4c2b956f9a98ae083b9d7",
	name: "decideKnowledgeProposalFn",
	filename: "src/lib/server/performance-fns.ts"
}, (opts) => decideKnowledgeProposalFn.__executeServer(opts));
var decideKnowledgeProposalFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	id: string().min(1),
	decision: _enum(["APPROVED", "REJECTED"]),
	note: string().max(400).optional()
}).parse(input)).handler(decideKnowledgeProposalFn_createServerFn_handler, async ({ context, data }) => {
	if (await requireUser(context.userId) !== "admin") throw new Error("Forbidden");
	const { decideProposal } = await import("./knowledge-proposals.server-C0stV1-L.mjs");
	return decideProposal({
		id: data.id,
		decision: data.decision,
		actorId: context.userId,
		note: data.note
	});
});
var getLearningPolicyFn_createServerFn_handler = createServerRpc({
	id: "23c9e8c426f80a1e9ea259a9f218bd8bf96f81be5fa71e55e60018636d9981fe",
	name: "getLearningPolicyFn",
	filename: "src/lib/server/performance-fns.ts"
}, (opts) => getLearningPolicyFn.__executeServer(opts));
var getLearningPolicyFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getLearningPolicyFn_createServerFn_handler, async ({ context }) => {
	await requireUser(context.userId);
	const { readLearningPolicy } = await import("./performance.server-kOlT5k3Z.mjs");
	const { metricsApiStatus } = await import("./performance-fetch.server-BDzg5W1p.mjs");
	const [policy, metricsApi] = await Promise.all([readLearningPolicy(), metricsApiStatus()]);
	return {
		policy,
		metricsApi
	};
});
var saveLearningPolicyFn_createServerFn_handler = createServerRpc({
	id: "473a271b06021773d54bdbcd4da9967197e3ef73a0f6e06968a1fe25a8ec7d11",
	name: "saveLearningPolicyFn",
	filename: "src/lib/server/performance-fns.ts"
}, (opts) => saveLearningPolicyFn.__executeServer(opts));
var saveLearningPolicyFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	enabled: boolean(),
	autoMerge: boolean(),
	winnerPercentile: number().int().min(50).max(99),
	minScore: number().int().min(0).max(100),
	minViews: number().int().min(0).max(1e6),
	fetchDelaysHours: array(number().min(0).max(720)).max(6)
}).parse(input)).handler(saveLearningPolicyFn_createServerFn_handler, async ({ context, data }) => {
	if (await requireUser(context.userId) !== "admin") throw new Error("Forbidden");
	const { writeLearningPolicy } = await import("./performance.server-kOlT5k3Z.mjs");
	return writeLearningPolicy(data);
});
//#endregion
export { decideKnowledgeProposalFn_createServerFn_handler, getLearningPolicyFn_createServerFn_handler, getPerformanceSnapshot_createServerFn_handler, listKnowledgeProposalsFn_createServerFn_handler, listWinnersFn_createServerFn_handler, proposeKnowledgeFromAssetFn_createServerFn_handler, recordManualMetricsFn_createServerFn_handler, refreshPostPerformanceFn_createServerFn_handler, saveLearningPolicyFn_createServerFn_handler };
