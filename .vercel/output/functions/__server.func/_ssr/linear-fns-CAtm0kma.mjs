import { Bt as _enum, Ht as array, Jt as object, Ut as boolean, Zt as string, qt as number } from "../_libs/@better-auth/core+[...].mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { n as getUserRole, r as requireAdmin } from "./access-CV3glphY.mjs";
import { o as LINEAR_ENTITY_TYPES, s as LINEAR_KANBAN_COLUMNS } from "./linear-CrgEmECq.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/linear-fns-CAtm0kma.js
async function requireMember(userId) {
	const role = await getUserRole(userId);
	if (!role) throw new Error("Forbidden");
	return role;
}
async function requireCreate(userId) {
	if (await requireMember(userId) === "admin") return;
	const { readLinearConfig } = await import("./linear.server-DI-z011N.mjs").then((n) => n.n);
	if (!(await readLinearConfig()).flags.membersCanCreate) throw new Error("Forbidden");
}
var getLinearStatusFn_createServerFn_handler = createServerRpc({
	id: "dbab82b8ff52acd6722205c7d6d00930fb79810bdf93995f60d23dcc4127020d",
	name: "getLinearStatusFn",
	filename: "src/lib/server/linear-fns.ts"
}, (opts) => getLinearStatusFn.__executeServer(opts));
var getLinearStatusFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getLinearStatusFn_createServerFn_handler, async ({ context }) => {
	await requireMember(context.userId);
	const { publicLinearStatus, sweepLinearQueue } = await import("./linear.server-DI-z011N.mjs").then((n) => n.n);
	sweepLinearQueue(4).catch(() => 0);
	return publicLinearStatus();
});
var saveLinearApiKeyFn_createServerFn_handler = createServerRpc({
	id: "7a5bc5bce12d82d34dfa2416e649f3001a363244f7ee3d10f658094d3b85daec",
	name: "saveLinearApiKeyFn",
	filename: "src/lib/server/linear-fns.ts"
}, (opts) => saveLinearApiKeyFn.__executeServer(opts));
var saveLinearApiKeyFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ apiKey: string().trim().min(12).max(400) }).parse(input)).handler(saveLinearApiKeyFn_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const { persistLinearApiKey } = await import("./linear.server-DI-z011N.mjs").then((n) => n.n);
	await persistLinearApiKey(data.apiKey);
	return { ok: true };
});
var saveLinearOauthAppFn_createServerFn_handler = createServerRpc({
	id: "dc5ce359248374d5dfd2356a69845e9ff3dd7e4f95c6fa561e3847602431ff0a",
	name: "saveLinearOauthAppFn",
	filename: "src/lib/server/linear-fns.ts"
}, (opts) => saveLinearOauthAppFn.__executeServer(opts));
var saveLinearOauthAppFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	clientId: string().trim().min(8).max(200),
	clientSecret: string().trim().min(8).max(400)
}).parse(input)).handler(saveLinearOauthAppFn_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const { persistLinearOauthApp } = await import("./linear.server-DI-z011N.mjs").then((n) => n.n);
	await persistLinearOauthApp(data);
	return { ok: true };
});
var testLinearFn_createServerFn_handler = createServerRpc({
	id: "16d0b82dab672e3b7b760fe1457cf2abf93adf53da073b0513bc248e1383c30a",
	name: "testLinearFn",
	filename: "src/lib/server/linear-fns.ts"
}, (opts) => testLinearFn.__executeServer(opts));
var testLinearFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(testLinearFn_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	const { testLinearConnection } = await import("./linear.server-DI-z011N.mjs").then((n) => n.n);
	try {
		const status = await testLinearConnection();
		try {
			const { onIntegrationChanged } = await import("./safety-hooks.server-CNuRbzza.mjs");
			await onIntegrationChanged({
				actorId: context.userId,
				provider: "linear",
				action: "connected"
			});
		} catch {}
		return status;
	} catch (error) {
		const message = error instanceof Error ? error.message : "LINEAR_UNAVAILABLE";
		throw new Error(message);
	}
});
var loadLinearCatalogFn_createServerFn_handler = createServerRpc({
	id: "eefd455d5edc448f24b54784500b1a8e00d3cee087d09166fa3a792f9072ad76",
	name: "loadLinearCatalogFn",
	filename: "src/lib/server/linear-fns.ts"
}, (opts) => loadLinearCatalogFn.__executeServer(opts));
var loadLinearCatalogFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ teamId: string().optional() }).parse(input ?? {})).handler(loadLinearCatalogFn_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const { loadLinearCatalog } = await import("./linear.server-DI-z011N.mjs").then((n) => n.n);
	return loadLinearCatalog(data.teamId);
});
var BindingSchema = object({
	teamId: string().nullable().optional(),
	projectId: string().nullable().optional(),
	stateMap: object({
		backlog: string().nullable().optional(),
		ready: string().nullable().optional(),
		inProgress: string().nullable().optional(),
		inReview: string().nullable().optional(),
		done: string().nullable().optional()
	}).optional(),
	flags: object({
		enabled: boolean().optional(),
		syncJobs: boolean().optional(),
		autoIssueOnFail: boolean().optional(),
		autoIssueOnProposal: boolean().optional(),
		membersCanCreate: boolean().optional(),
		failColumn: _enum(LINEAR_KANBAN_COLUMNS).optional()
	}).optional()
});
var saveLinearBindingFn_createServerFn_handler = createServerRpc({
	id: "74790204ebaf276017ca70573c20c80bcd1674f6ab972948adedb98291da2515",
	name: "saveLinearBindingFn",
	filename: "src/lib/server/linear-fns.ts"
}, (opts) => saveLinearBindingFn.__executeServer(opts));
var saveLinearBindingFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => BindingSchema.parse(input)).handler(saveLinearBindingFn_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const { saveLinearBinding } = await import("./linear.server-DI-z011N.mjs").then((n) => n.n);
	return saveLinearBinding({
		teamId: data.teamId,
		projectId: data.projectId,
		stateMap: data.stateMap,
		flags: data.flags
	});
});
var disconnectLinearFn_createServerFn_handler = createServerRpc({
	id: "bbed08cef4855935de33a350c23823736454129406477e2a26d3961ded80c031",
	name: "disconnectLinearFn",
	filename: "src/lib/server/linear-fns.ts"
}, (opts) => disconnectLinearFn.__executeServer(opts));
var disconnectLinearFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(disconnectLinearFn_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	const { disconnectLinear } = await import("./linear.server-DI-z011N.mjs").then((n) => n.n);
	await disconnectLinear();
	try {
		const { onIntegrationChanged } = await import("./safety-hooks.server-CNuRbzza.mjs");
		await onIntegrationChanged({
			actorId: context.userId,
			provider: "linear",
			action: "disconnected"
		});
	} catch {}
	return { ok: true };
});
var startLinearOAuthFn_createServerFn_handler = createServerRpc({
	id: "d9aee8add62757752f46eee9c75f5420e1eaa99a4bdf2af8bad5654a85df89b7",
	name: "startLinearOAuthFn",
	filename: "src/lib/server/linear-fns.ts"
}, (opts) => startLinearOAuthFn.__executeServer(opts));
var startLinearOAuthFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(startLinearOAuthFn_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	const { startLinearOAuth } = await import("./linear.server-DI-z011N.mjs").then((n) => n.n);
	return startLinearOAuth(context.userId);
});
var ensureLinearMilestonesFn_createServerFn_handler = createServerRpc({
	id: "00a8922a9369ba396f51f6c855d55f5c7ea26c6cfbc0152320818a9a67a0cde3",
	name: "ensureLinearMilestonesFn",
	filename: "src/lib/server/linear-fns.ts"
}, (opts) => ensureLinearMilestonesFn.__executeServer(opts));
var ensureLinearMilestonesFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(ensureLinearMilestonesFn_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	const { ensureProjectMilestones } = await import("./linear.server-DI-z011N.mjs").then((n) => n.n);
	return { items: await ensureProjectMilestones() };
});
var CreateIssueSchema = object({
	title: string().trim().min(3).max(250),
	description: string().max(8e3).optional(),
	state: _enum(LINEAR_KANBAN_COLUMNS).optional(),
	labels: array(string().max(40)).max(8).optional(),
	priority: number().int().min(0).max(4).optional(),
	entityType: _enum(LINEAR_ENTITY_TYPES).optional(),
	entityId: string().max(80).optional()
});
var createLinearIssueFn_createServerFn_handler = createServerRpc({
	id: "78b10d897224704e6fd33023ccd5511378801b19ed00870e83668472721117fc",
	name: "createLinearIssueFn",
	filename: "src/lib/server/linear-fns.ts"
}, (opts) => createLinearIssueFn.__executeServer(opts));
var createLinearIssueFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => CreateIssueSchema.parse(input)).handler(createLinearIssueFn_createServerFn_handler, async ({ context, data }) => {
	await requireCreate(context.userId);
	const { createLinearIssue } = await import("./linear.server-DI-z011N.mjs").then((n) => n.n);
	return createLinearIssue({
		title: data.title,
		description: data.description ?? null,
		state: data.state ?? "backlog",
		labels: data.labels ?? [],
		priority: data.priority ?? 0,
		linkTo: data.entityType && data.entityId ? {
			type: data.entityType,
			id: data.entityId
		} : null,
		actorId: context.userId
	});
});
var getLinearLinkFn_createServerFn_handler = createServerRpc({
	id: "0853cb4ad9da6ecd34f530de4b6985cc4e9caa2c0507c4eb287b60ee2cef74d4",
	name: "getLinearLinkFn",
	filename: "src/lib/server/linear-fns.ts"
}, (opts) => getLinearLinkFn.__executeServer(opts));
var getLinearLinkFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	entityType: _enum(LINEAR_ENTITY_TYPES),
	entityId: string().min(1)
}).parse(input)).handler(getLinearLinkFn_createServerFn_handler, async ({ context, data }) => {
	await requireMember(context.userId);
	const { findLinearLink } = await import("./linear.server-DI-z011N.mjs").then((n) => n.n);
	return findLinearLink(data.entityType, data.entityId);
});
var listLinearLinksFn_createServerFn_handler = createServerRpc({
	id: "f23e54a9689407f4165876f04173ad73903216201dbdd840cc3b972b62a63bd4",
	name: "listLinearLinksFn",
	filename: "src/lib/server/linear-fns.ts"
}, (opts) => listLinearLinksFn.__executeServer(opts));
var listLinearLinksFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listLinearLinksFn_createServerFn_handler, async ({ context }) => {
	await requireMember(context.userId);
	const { listLinearLinks } = await import("./linear.server-DI-z011N.mjs").then((n) => n.n);
	return listLinearLinks();
});
//#endregion
export { createLinearIssueFn_createServerFn_handler, disconnectLinearFn_createServerFn_handler, ensureLinearMilestonesFn_createServerFn_handler, getLinearLinkFn_createServerFn_handler, getLinearStatusFn_createServerFn_handler, listLinearLinksFn_createServerFn_handler, loadLinearCatalogFn_createServerFn_handler, saveLinearApiKeyFn_createServerFn_handler, saveLinearBindingFn_createServerFn_handler, saveLinearOauthAppFn_createServerFn_handler, startLinearOAuthFn_createServerFn_handler, testLinearFn_createServerFn_handler };
