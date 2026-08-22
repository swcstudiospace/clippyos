import { Bt as _enum, Gt as literal, Ht as array, Jt as object, Qt as union, Ut as boolean, Zt as string, qt as number } from "../_libs/@better-auth/core+[...].mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
import { d as WEBHOOK_EVENT_TYPES, t as API_KEY_SCOPES } from "./autonomy-CEwFxjUt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/autonomy-admin-D-Lji9O1.js
var getAutonomySnapshot = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("8937da90f4163299be87bf9d6071bb9fbad2ea3747c6142574ff2e75c72528a9"));
var listAutonomyAudit = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("657fd6ea042a1e042fe696ce55b4825bcaea784c1b21398dbd51dbbabcf40958"));
var CreateKeySchema = object({
	name: string().trim().min(1).max(80),
	scopes: array(_enum(API_KEY_SCOPES)).min(1)
});
var createAutonomyKey = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => CreateKeySchema.parse(input)).handler(createSsrRpc("b253bf4bcc06d07005ca9c480444e73d9c9bb84115d5fdcacdf5835723e2fa04"));
var createHermesPresetKey = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("f96a5625f7a1989a1d6e3d665f1e1129656137bd22abfe941a4374f64662fde3"));
var revokeAutonomyKey = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(createSsrRpc("858b467421b7f1c053a19393460089888801f3d661537f6e173fca36dca125b9"));
var rotateAutonomyKey = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(createSsrRpc("00bdfe772d5999ea71dba66eeadb1f612848adb96300600031a337503406e114"));
var rotateMcpToken = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("1aee9972e1a1b5f920703bb59d048365226efaee1ddcfaf5e4ce9f30d572ddd4"));
var rotateWebhookSecret = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("3e1d51c0c2987a18eabd87052c8b213b08bbb967ed71564abe5787307576120f"));
var OutboundSchema = object({
	destinationUrl: string().trim().max(500).nullable(),
	events: array(_enum(WEBHOOK_EVENT_TYPES))
});
var saveOutboundWebhook = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => OutboundSchema.parse(input)).handler(createSsrRpc("217356f1237c46a56c2d0b831d8d2212b95aff1b2699aca987297442f30716a3"));
var testOutboundWebhook = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("44713627e04a92e8ddcdcbc351dc43690bbd53a6e3fe6b00ef4992fc51f3af7d"));
var markPlaybookPasted = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("315893f815eee0cf6d0d88e96f294b7ee7bf76a88b224bbe808807460f7b439c"));
var ackSocialVmPolicy = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("409b0b73bcfead3a1fad43abbf032659e99c2af21cc7d7889419852490989bc6"));
var SkipOutboundSchema = object({ skipped: boolean() });
var skipOutboundConnect = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => SkipOutboundSchema.parse(input)).handler(createSsrRpc("8e9b7e594033099baf73dba5f2d43d5291800a9dd929fa8de3d58aa63beb61d9"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("39a85660a3dac203702b5a6e33d2db816d3feb84c915e9deb0e27cfeceb28d87"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("2650d525a696af6e16df49be37ed974aeef49906c4957f483682c8222e8faa6d"));
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
var saveAutomationSettings = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => PoliciesSchema.parse(input)).handler(createSsrRpc("92ac6dfb8bb8e509397170cced213123922aad0aecabb1cd0d5ab6c61c7cf200"));
var getAutonomyHealth = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("80f6f4038f1dd0fe020aaf05bd439b452d5cf959dafcfa9e8a8384850f820c40"));
//#endregion
export { getAutonomySnapshot as a, revokeAutonomyKey as c, rotateWebhookSecret as d, saveAutomationSettings as f, testOutboundWebhook as h, getAutonomyHealth as i, rotateAutonomyKey as l, skipOutboundConnect as m, createAutonomyKey as n, listAutonomyAudit as o, saveOutboundWebhook as p, createHermesPresetKey as r, markPlaybookPasted as s, ackSocialVmPolicy as t, rotateMcpToken as u };
