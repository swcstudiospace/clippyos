import { Bt as _enum, Gt as literal, Ht as array, Jt as object, Qt as union, Ut as boolean, Zt as string, qt as number } from "../_libs/@better-auth/core+[...].mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as sanitizeText } from "./sanitize-DAA2oq7r.mjs";
import { t as DEFAULT_PLAYBOOK_POLICIES } from "./playbooks-BbqI43Jw.mjs";
import { a as DEFAULT_HERMES_SCOPES, d as WEBHOOK_EVENT_TYPES, t as API_KEY_SCOPES } from "./autonomy-CEwFxjUt.mjs";
import { r as requireAdmin } from "./access-CV3glphY.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { i as PLAYBOOK_PACKAGE_VERSION, s as deriveHermesConnection } from "./connect-Vop9T4X0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/autonomy-admin-xTLSoTKt.js
async function load_autonomy_auth() {
	return import("./autonomy-auth.server-ayVAPOsv.mjs").then((n) => n.r).then((n) => n.r);
}
async function load_autonomy_audit() {
	return import("./autonomy-audit.server-vcgB9vCa.mjs").then((n) => n.t);
}
async function load_autonomy_events() {
	return import("./autonomy-events.server-DCl-_J_B.mjs").then((n) => n.t);
}
async function load_app_settings() {
	return import("./app-settings.server-BlmGCrwi.mjs").then((n) => n.t).then((n) => n.t);
}
async function load_autonomy_policy() {
	return import("./autonomy-policy.server-HcFlL3K7.mjs").then((n) => n.n);
}
async function load_hermes_connect() {
	return import("./hermes-connect.server-teaCO3Ci.mjs");
}
function paths() {
	return {
		apiBase: "/api/v1",
		mcp: "/api/mcp",
		inboundWebhook: "/api/webhooks/inbound"
	};
}
function saneWhen(value) {
	if (!value?.trim()) return null;
	const time = new Date(value).getTime();
	if (!Number.isFinite(time)) return null;
	if (time < Date.parse("2020-01-01T00:00:00.000Z") || time > Date.now() + 12e4) return null;
	return value;
}
async function snapshot() {
	const [keys, mcpHash, mcpLast4, mcpUsed, webhookSecret, outbound, lastDelivery, byEvent, enabled, policies, audit, flags] = await Promise.all([
		(await load_autonomy_auth()).listApiKeyRows(),
		(await load_app_settings()).readAppSetting("MCP_TOKEN_HASH"),
		(await load_app_settings()).readAppSetting("MCP_TOKEN_LAST4"),
		(await load_app_settings()).readAppSetting("MCP_LAST_USED_AT"),
		(await load_app_settings()).readAppSetting("WEBHOOK_SIGNING_SECRET"),
		(await load_autonomy_events()).readOutboundConfig(),
		(await load_autonomy_events()).readLastDelivery(),
		(await load_autonomy_events()).readLastDeliveryByEvent(),
		(await load_autonomy_policy()).readAutomationEnabled(),
		(await load_autonomy_policy()).readPlaybookPolicies(),
		(await load_autonomy_audit()).listAuditLog(1),
		(await load_hermes_connect()).readConnectFlags()
	]);
	const keyUsed = keys.map((row) => saneWhen(row.lastUsedAt)).filter((value) => Boolean(value)).sort().at(-1);
	const auditAt = saneWhen(audit[0]?.createdAt);
	const lastActivityAt = [
		saneWhen(mcpUsed),
		keyUsed,
		auditAt
	].filter(Boolean).sort().at(-1) ?? null;
	const active = keys.filter((row) => !row.revokedAt);
	const hermesConnection = deriveHermesConnection({
		hasHermesKey: active.length > 0,
		keyLastUsedAt: keyUsed ?? null
	});
	return {
		keys,
		mcpConfigured: Boolean(mcpHash),
		mcpLast4: mcpLast4 || null,
		mcpLastUsedAt: saneWhen(mcpUsed),
		webhookConfigured: Boolean(webhookSecret),
		webhookLast4: webhookSecret ? webhookSecret.slice(-4) : null,
		outboundUrl: outbound.destinationUrl,
		outboundEvents: outbound.events,
		lastDelivery: {
			at: saneWhen(lastDelivery.at),
			status: lastDelivery.status,
			eventType: lastDelivery.eventType
		},
		lastDeliveryByEvent: byEvent,
		connect: {
			pastedIntoHermes: flags.pastedIntoHermes,
			pastedAt: flags.pastedAt,
			socialPolicyAckedAt: flags.socialPolicyAckedAt,
			outboundSkipped: flags.outboundSkipped,
			hermesConnection,
			playbookPackageVersion: PLAYBOOK_PACKAGE_VERSION
		},
		paths: paths(),
		automationEnabled: enabled,
		policies: policies ?? DEFAULT_PLAYBOOK_POLICIES,
		lastActivityAt
	};
}
var getAutonomySnapshot_createServerFn_handler = createServerRpc({
	id: "8937da90f4163299be87bf9d6071bb9fbad2ea3747c6142574ff2e75c72528a9",
	name: "getAutonomySnapshot",
	filename: "src/lib/server/autonomy-admin.ts"
}, (opts) => getAutonomySnapshot.__executeServer(opts));
var getAutonomySnapshot = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getAutonomySnapshot_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	return snapshot();
});
var listAutonomyAudit_createServerFn_handler = createServerRpc({
	id: "657fd6ea042a1e042fe696ce55b4825bcaea784c1b21398dbd51dbbabcf40958",
	name: "listAutonomyAudit",
	filename: "src/lib/server/autonomy-admin.ts"
}, (opts) => listAutonomyAudit.__executeServer(opts));
var listAutonomyAudit = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listAutonomyAudit_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	return (await load_autonomy_audit()).listAuditLog(100);
});
var CreateKeySchema = object({
	name: string().trim().min(1).max(80),
	scopes: array(_enum(API_KEY_SCOPES)).min(1)
});
var createAutonomyKey_createServerFn_handler = createServerRpc({
	id: "b253bf4bcc06d07005ca9c480444e73d9c9bb84115d5fdcacdf5835723e2fa04",
	name: "createAutonomyKey",
	filename: "src/lib/server/autonomy-admin.ts"
}, (opts) => createAutonomyKey.__executeServer(opts));
var createAutonomyKey = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => CreateKeySchema.parse(input)).handler(createAutonomyKey_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const plaintext = (await load_autonomy_auth()).generateApiKeyPlaintext();
	const scopes = data.scopes.length ? data.scopes : [...DEFAULT_HERMES_SCOPES];
	return {
		key: await (await load_autonomy_auth()).insertApiKey({
			name: sanitizeText(data.name),
			scopes,
			plaintext,
			actorId: context.userId
		}),
		plaintext
	};
});
var createHermesPresetKey_createServerFn_handler = createServerRpc({
	id: "f96a5625f7a1989a1d6e3d665f1e1129656137bd22abfe941a4374f64662fde3",
	name: "createHermesPresetKey",
	filename: "src/lib/server/autonomy-admin.ts"
}, (opts) => createHermesPresetKey.__executeServer(opts));
var createHermesPresetKey = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createHermesPresetKey_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	const plaintext = (await load_autonomy_auth()).generateApiKeyPlaintext();
	return {
		key: await (await load_autonomy_auth()).insertApiKey({
			name: "Hermes Agent",
			scopes: [...DEFAULT_HERMES_SCOPES],
			plaintext,
			actorId: context.userId
		}),
		plaintext
	};
});
var revokeAutonomyKey_createServerFn_handler = createServerRpc({
	id: "858b467421b7f1c053a19393460089888801f3d661537f6e173fca36dca125b9",
	name: "revokeAutonomyKey",
	filename: "src/lib/server/autonomy-admin.ts"
}, (opts) => revokeAutonomyKey.__executeServer(opts));
var revokeAutonomyKey = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(revokeAutonomyKey_createServerFn_handler, async ({ context, data: id }) => {
	await requireAdmin(context.userId);
	await (await load_autonomy_auth()).revokeApiKey(id);
	return { ok: true };
});
var rotateAutonomyKey_createServerFn_handler = createServerRpc({
	id: "00bdfe772d5999ea71dba66eeadb1f612848adb96300600031a337503406e114",
	name: "rotateAutonomyKey",
	filename: "src/lib/server/autonomy-admin.ts"
}, (opts) => rotateAutonomyKey.__executeServer(opts));
var rotateAutonomyKey = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(rotateAutonomyKey_createServerFn_handler, async ({ context, data: id }) => {
	await requireAdmin(context.userId);
	const existing = (await (await load_autonomy_auth()).listApiKeyRows()).find((row) => row.id === id);
	if (!existing) throw new Error("KEY_MISSING");
	await (await load_autonomy_auth()).revokeApiKey(id);
	const plaintext = (await load_autonomy_auth()).generateApiKeyPlaintext();
	return {
		key: await (await load_autonomy_auth()).insertApiKey({
			name: existing.name,
			scopes: existing.scopes.length ? existing.scopes : [...DEFAULT_HERMES_SCOPES],
			plaintext,
			actorId: context.userId
		}),
		plaintext
	};
});
var rotateMcpToken_createServerFn_handler = createServerRpc({
	id: "1aee9972e1a1b5f920703bb59d048365226efaee1ddcfaf5e4ce9f30d572ddd4",
	name: "rotateMcpToken",
	filename: "src/lib/server/autonomy-admin.ts"
}, (opts) => rotateMcpToken.__executeServer(opts));
var rotateMcpToken = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(rotateMcpToken_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	const plaintext = (await load_autonomy_auth()).generateMcpTokenPlaintext();
	await (await load_app_settings()).writeAppSetting("MCP_TOKEN_HASH", (await load_autonomy_auth()).hashToken(plaintext));
	await (await load_app_settings()).writeAppSetting("MCP_TOKEN_LAST4", (await load_autonomy_auth()).last4Of(plaintext));
	await (await load_app_settings()).writeAppSetting("MCP_LAST_USED_AT", "");
	return {
		plaintext,
		last4: (await load_autonomy_auth()).last4Of(plaintext)
	};
});
var rotateWebhookSecret_createServerFn_handler = createServerRpc({
	id: "3e1d51c0c2987a18eabd87052c8b213b08bbb967ed71564abe5787307576120f",
	name: "rotateWebhookSecret",
	filename: "src/lib/server/autonomy-admin.ts"
}, (opts) => rotateWebhookSecret.__executeServer(opts));
var rotateWebhookSecret = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(rotateWebhookSecret_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	const plaintext = (await load_autonomy_auth()).generateWebhookSecretPlaintext();
	await (await load_app_settings()).writeAppSetting("WEBHOOK_SIGNING_SECRET", plaintext);
	return {
		plaintext,
		last4: (await load_autonomy_auth()).last4Of(plaintext)
	};
});
var OutboundSchema = object({
	destinationUrl: string().trim().max(500).nullable(),
	events: array(_enum(WEBHOOK_EVENT_TYPES))
});
var saveOutboundWebhook_createServerFn_handler = createServerRpc({
	id: "217356f1237c46a56c2d0b831d8d2212b95aff1b2699aca987297442f30716a3",
	name: "saveOutboundWebhook",
	filename: "src/lib/server/autonomy-admin.ts"
}, (opts) => saveOutboundWebhook.__executeServer(opts));
var saveOutboundWebhook = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => OutboundSchema.parse(input)).handler(saveOutboundWebhook_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const url = data.destinationUrl?.trim() || null;
	if (url && !url.startsWith("https://")) throw new Error("HTTPS_ONLY");
	await (await load_autonomy_events()).writeOutboundConfig({
		destinationUrl: url,
		events: data.events
	});
	return { ok: true };
});
var testOutboundWebhook_createServerFn_handler = createServerRpc({
	id: "44713627e04a92e8ddcdcbc351dc43690bbd53a6e3fe6b00ef4992fc51f3af7d",
	name: "testOutboundWebhook",
	filename: "src/lib/server/autonomy-admin.ts"
}, (opts) => testOutboundWebhook.__executeServer(opts));
var testOutboundWebhook = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(testOutboundWebhook_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	return (await load_autonomy_events()).emitTestPing();
});
var markPlaybookPasted_createServerFn_handler = createServerRpc({
	id: "315893f815eee0cf6d0d88e96f294b7ee7bf76a88b224bbe808807460f7b439c",
	name: "markPlaybookPasted",
	filename: "src/lib/server/autonomy-admin.ts"
}, (opts) => markPlaybookPasted.__executeServer(opts));
var markPlaybookPasted = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(markPlaybookPasted_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	return (await load_hermes_connect()).writeConnectFlags({
		pastedIntoHermes: true,
		pastedAt: (/* @__PURE__ */ new Date()).toISOString()
	});
});
var ackSocialVmPolicy_createServerFn_handler = createServerRpc({
	id: "409b0b73bcfead3a1fad43abbf032659e99c2af21cc7d7889419852490989bc6",
	name: "ackSocialVmPolicy",
	filename: "src/lib/server/autonomy-admin.ts"
}, (opts) => ackSocialVmPolicy.__executeServer(opts));
var ackSocialVmPolicy = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(ackSocialVmPolicy_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	return (await load_hermes_connect()).writeConnectFlags({ socialPolicyAckedAt: (/* @__PURE__ */ new Date()).toISOString() });
});
var SkipOutboundSchema = object({ skipped: boolean() });
var skipOutboundConnect_createServerFn_handler = createServerRpc({
	id: "8e9b7e594033099baf73dba5f2d43d5291800a9dd929fa8de3d58aa63beb61d9",
	name: "skipOutboundConnect",
	filename: "src/lib/server/autonomy-admin.ts"
}, (opts) => skipOutboundConnect.__executeServer(opts));
var skipOutboundConnect = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => SkipOutboundSchema.parse(input)).handler(skipOutboundConnect_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	return (await load_hermes_connect()).writeConnectFlags({ outboundSkipped: data.skipped });
});
var getConnectStatus_createServerFn_handler = createServerRpc({
	id: "39a85660a3dac203702b5a6e33d2db816d3feb84c915e9deb0e27cfeceb28d87",
	name: "getConnectStatus",
	filename: "src/lib/server/autonomy-admin.ts"
}, (opts) => getConnectStatus.__executeServer(opts));
var getConnectStatus = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getConnectStatus_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	return (await load_hermes_connect()).buildConnectStatus();
});
var getPlaybookPackage_createServerFn_handler = createServerRpc({
	id: "2650d525a696af6e16df49be37ed974aeef49906c4957f483682c8222e8faa6d",
	name: "getPlaybookPackage",
	filename: "src/lib/server/autonomy-admin.ts"
}, (opts) => getPlaybookPackage.__executeServer(opts));
var getPlaybookPackage = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getPlaybookPackage_createServerFn_handler, async ({ context }) => {
	if (!context.userId) throw new Error("Unauthorized");
	return (await load_hermes_connect()).buildPlaybookPackageText();
});
var PoliciesSchema = object({
	enabled: boolean(),
	policies: object({
		autoMarkPayments: boolean(),
		autoAdvanceStageWithoutEvidence: boolean(),
		autoCreateClientFromClosedLead: boolean(),
		analyticsPullConcurrency: _enum(["low", "medium"]),
		socialAutoStartForUpload: boolean().optional(),
		socialDefaultUploadMode: _enum(["draft", "publish"]).optional(),
		socialMaxAutoRetries: union([literal(1), literal(2)]).optional(),
		socialMaxBulkJobsPerRun: number().int().min(1).max(20).optional(),
		socialIdleStopMinutes: number().int().min(5).max(240).optional(),
		socialRequireLoggedInPlatformsOnly: boolean().optional(),
		skillsAutoPublishAgent: boolean().optional(),
		skillsMinToolCallsToDistill: number().int().min(3).max(20).optional(),
		skillsAllowNetwork: boolean().optional(),
		skillsProposeOnAgentSuccess: boolean().optional()
	})
});
var saveAutomationSettings_createServerFn_handler = createServerRpc({
	id: "92ac6dfb8bb8e509397170cced213123922aad0aecabb1cd0d5ab6c61c7cf200",
	name: "saveAutomationSettings",
	filename: "src/lib/server/autonomy-admin.ts"
}, (opts) => saveAutomationSettings.__executeServer(opts));
var saveAutomationSettings = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => PoliciesSchema.parse(input)).handler(saveAutomationSettings_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const previous = await (await load_autonomy_policy()).readPlaybookPolicies();
	await (await load_autonomy_policy()).writeAutomationEnabled(data.enabled);
	const next = {
		...DEFAULT_PLAYBOOK_POLICIES,
		...data.policies,
		socialAutoStartForUpload: data.policies.socialAutoStartForUpload ?? DEFAULT_PLAYBOOK_POLICIES.socialAutoStartForUpload,
		socialDefaultUploadMode: data.policies.socialDefaultUploadMode ?? DEFAULT_PLAYBOOK_POLICIES.socialDefaultUploadMode,
		socialMaxAutoRetries: data.policies.socialMaxAutoRetries ?? DEFAULT_PLAYBOOK_POLICIES.socialMaxAutoRetries,
		socialMaxBulkJobsPerRun: data.policies.socialMaxBulkJobsPerRun ?? DEFAULT_PLAYBOOK_POLICIES.socialMaxBulkJobsPerRun,
		socialIdleStopMinutes: data.policies.socialIdleStopMinutes ?? DEFAULT_PLAYBOOK_POLICIES.socialIdleStopMinutes,
		socialRequireLoggedInPlatformsOnly: data.policies.socialRequireLoggedInPlatformsOnly ?? DEFAULT_PLAYBOOK_POLICIES.socialRequireLoggedInPlatformsOnly,
		skillsAutoPublishAgent: data.policies.skillsAutoPublishAgent ?? DEFAULT_PLAYBOOK_POLICIES.skillsAutoPublishAgent,
		skillsMinToolCallsToDistill: data.policies.skillsMinToolCallsToDistill ?? DEFAULT_PLAYBOOK_POLICIES.skillsMinToolCallsToDistill,
		skillsAllowNetwork: data.policies.skillsAllowNetwork ?? DEFAULT_PLAYBOOK_POLICIES.skillsAllowNetwork,
		skillsProposeOnAgentSuccess: data.policies.skillsProposeOnAgentSuccess ?? DEFAULT_PLAYBOOK_POLICIES.skillsProposeOnAgentSuccess
	};
	await (await load_autonomy_policy()).writePlaybookPolicies(next);
	if (previous.socialAutoStartForUpload !== next.socialAutoStartForUpload) {
		await (await load_hermes_connect()).writeConnectFlags({ socialPolicyAckedAt: (/* @__PURE__ */ new Date()).toISOString() });
		const historyRaw = await (await load_app_settings()).readAppSetting("AUTOMATION_POLICY_AUDIT") ?? "[]";
		let history = [];
		try {
			history = JSON.parse(historyRaw);
		} catch {
			history = [];
		}
		history = [{
			at: (/* @__PURE__ */ new Date()).toISOString(),
			actorId: context.userId,
			field: "social.auto_start_for_upload",
			from: previous.socialAutoStartForUpload,
			to: next.socialAutoStartForUpload
		}, ...history].slice(0, 50);
		await (await load_app_settings()).writeAppSetting("AUTOMATION_POLICY_AUDIT", JSON.stringify(history));
	}
	return {
		ok: true,
		enabled: data.enabled,
		policies: await (await load_autonomy_policy()).readPlaybookPolicies()
	};
});
var getAutonomyHealth_createServerFn_handler = createServerRpc({
	id: "80f6f4038f1dd0fe020aaf05bd439b452d5cf959dafcfa9e8a8384850f820c40",
	name: "getAutonomyHealth",
	filename: "src/lib/server/autonomy-admin.ts"
}, (opts) => getAutonomyHealth.__executeServer(opts));
var getAutonomyHealth = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getAutonomyHealth_createServerFn_handler, async ({ context }) => {
	if (!context.userId) throw new Error("Unauthorized");
	const [keys, mcpHash, webhookSecret, enabled, audit] = await Promise.all([
		(await load_autonomy_auth()).listApiKeyRows(),
		(await load_app_settings()).readAppSetting("MCP_TOKEN_HASH"),
		(await load_app_settings()).readAppSetting("WEBHOOK_SIGNING_SECRET"),
		(await load_autonomy_policy()).readAutomationEnabled(),
		(await load_autonomy_audit()).listAuditLog(1)
	]);
	const latest = audit[0];
	const keyUsed = keys.map((row) => row.lastUsedAt && new Date(row.lastUsedAt).getTime() > Date.parse("2020-01-01") ? row.lastUsedAt : null).filter((value) => Boolean(value)).sort().at(-1);
	const lastActivityAt = [latest?.createdAt, keyUsed].filter(Boolean).sort().at(-1) ?? null;
	let social = null;
	try {
		const { peekSocialHealth } = await import("./social-Cwlrz0WD.mjs");
		social = await peekSocialHealth();
	} catch {
		social = null;
	}
	return {
		automationEnabled: enabled,
		mcpConfigured: Boolean(mcpHash),
		webhookConfigured: Boolean(webhookSecret),
		activeKeys: keys.filter((row) => !row.revokedAt).length,
		lastActivityAt,
		lastAction: latest ? {
			action: latest.action,
			source: latest.source,
			playbookId: latest.playbookId,
			result: latest.result,
			at: latest.createdAt,
			actorLabel: latest.actorLabel
		} : null,
		hermesConnection: deriveHermesConnection({
			hasHermesKey: keys.filter((row) => !row.revokedAt).length > 0,
			keyLastUsedAt: keyUsed ?? null
		}),
		social
	};
});
//#endregion
export { ackSocialVmPolicy_createServerFn_handler, createAutonomyKey_createServerFn_handler, createHermesPresetKey_createServerFn_handler, getAutonomyHealth_createServerFn_handler, getAutonomySnapshot_createServerFn_handler, getConnectStatus_createServerFn_handler, getPlaybookPackage_createServerFn_handler, listAutonomyAudit_createServerFn_handler, markPlaybookPasted_createServerFn_handler, revokeAutonomyKey_createServerFn_handler, rotateAutonomyKey_createServerFn_handler, rotateMcpToken_createServerFn_handler, rotateWebhookSecret_createServerFn_handler, saveAutomationSettings_createServerFn_handler, saveOutboundWebhook_createServerFn_handler, skipOutboundConnect_createServerFn_handler, testOutboundWebhook_createServerFn_handler };
