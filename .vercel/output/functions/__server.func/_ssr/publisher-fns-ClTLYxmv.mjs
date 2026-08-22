import { Bt as _enum, Jt as object, Ut as boolean, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { r as requireAdmin } from "./access-CV3glphY.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/publisher-fns-ClTLYxmv.js
var ProviderSchema = _enum([
	"x",
	"tiktok",
	"instagram",
	"youtube"
]);
var getSocialPublishers_createServerFn_handler = createServerRpc({
	id: "99737c9386af68f0eb638407aafdfbb17e5eba191fa9bf951e8a647c0c9cb74e",
	name: "getSocialPublishers",
	filename: "src/lib/server/publisher-fns.ts"
}, (opts) => getSocialPublishers.__executeServer(opts));
var getSocialPublishers = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getSocialPublishers_createServerFn_handler, async ({ context }) => {
	const { getPublisherSnapshot } = await import("./social-publish.server-Dke6bAyh.mjs");
	return getPublisherSnapshot(context.userId);
});
var savePublisherAppFn_createServerFn_handler = createServerRpc({
	id: "c1dfe5c40686894ae9aed00fdcdc5778103b62721f7950d748128cff7c1ed3a5",
	name: "savePublisherAppFn",
	filename: "src/lib/server/publisher-fns.ts"
}, (opts) => savePublisherAppFn.__executeServer(opts));
var savePublisherAppFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	provider: ProviderSchema,
	clientId: string().min(6).max(200),
	clientSecret: string().min(6).max(400)
}).parse(input)).handler(savePublisherAppFn_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const { persistPublisherApp } = await import("./social-oauth.server-BkBN9MI7.mjs").then((n) => n.S).then((n) => n.m);
	await persistPublisherApp(data.provider, {
		clientId: data.clientId,
		clientSecret: data.clientSecret
	});
	try {
		const { onIntegrationChanged } = await import("./safety-hooks.server-CNuRbzza.mjs");
		await onIntegrationChanged({
			actorId: context.userId,
			provider: data.provider,
			action: "connected"
		});
	} catch {}
	return { ok: true };
});
var startPublisherOAuthFn_createServerFn_handler = createServerRpc({
	id: "36a4239799667d7e4c4a0f58cb4948cf75123a3da0ee05cf498fce8b67a84dd0",
	name: "startPublisherOAuthFn",
	filename: "src/lib/server/publisher-fns.ts"
}, (opts) => startPublisherOAuthFn.__executeServer(opts));
var startPublisherOAuthFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ provider: ProviderSchema }).parse(input)).handler(startPublisherOAuthFn_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const { startPublisherOAuth } = await import("./social-oauth.server-BkBN9MI7.mjs").then((n) => n.S).then((n) => n.m);
	return startPublisherOAuth({
		provider: data.provider,
		userId: context.userId
	});
});
var testPublisherFn_createServerFn_handler = createServerRpc({
	id: "1a94fcbb00c217215f984cd9d34c90c71181fea5f154391d666f0669b4817386",
	name: "testPublisherFn",
	filename: "src/lib/server/publisher-fns.ts"
}, (opts) => testPublisherFn.__executeServer(opts));
var testPublisherFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ provider: ProviderSchema }).parse(input)).handler(testPublisherFn_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const { testPublisherConnection } = await import("./social-oauth.server-BkBN9MI7.mjs").then((n) => n.S).then((n) => n.m);
	try {
		await testPublisherConnection(data.provider);
		return { ok: true };
	} catch (error) {
		try {
			const { onIntegrationTestFailed } = await import("./safety-hooks.server-CNuRbzza.mjs");
			await onIntegrationTestFailed({
				actorId: context.userId,
				provider: data.provider,
				reason: error instanceof Error ? error.message : void 0
			});
		} catch {}
		throw error;
	}
});
var disconnectPublisherFn_createServerFn_handler = createServerRpc({
	id: "952a706fe9108b21df8f1bc9a8af27be70e52afe6dd76d02d70a5c1c8c92658d",
	name: "disconnectPublisherFn",
	filename: "src/lib/server/publisher-fns.ts"
}, (opts) => disconnectPublisherFn.__executeServer(opts));
var disconnectPublisherFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	provider: ProviderSchema,
	tokensOnly: boolean().optional()
}).parse(input)).handler(disconnectPublisherFn_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const { clearPublisher, disconnectPublisherTokens } = await import("./social-oauth.server-BkBN9MI7.mjs").then((n) => n.S).then((n) => n.m);
	if (data.tokensOnly || data.provider === "x" || data.provider === "tiktok" || data.provider === "instagram" || data.provider === "youtube") await disconnectPublisherTokens(data.provider);
	else await clearPublisher(data.provider);
	try {
		const { onIntegrationChanged } = await import("./safety-hooks.server-CNuRbzza.mjs");
		await onIntegrationChanged({
			actorId: context.userId,
			provider: data.provider,
			action: "disconnected"
		});
	} catch {}
	return { ok: true };
});
var selectInstagramAccountFn_createServerFn_handler = createServerRpc({
	id: "5523341c920fc892e842d23abdbb6bc966401358750de40818bd289b4c3ae036",
	name: "selectInstagramAccountFn",
	filename: "src/lib/server/publisher-fns.ts"
}, (opts) => selectInstagramAccountFn.__executeServer(opts));
var selectInstagramAccountFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ igUserId: string().min(1) }).parse(input)).handler(selectInstagramAccountFn_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const { selectInstagramAccount } = await import("./social-oauth.server-BkBN9MI7.mjs").then((n) => n.S).then((n) => n.m);
	await selectInstagramAccount(data.igUserId);
	return { ok: true };
});
var setTikTokModeFn_createServerFn_handler = createServerRpc({
	id: "a778cecbb615f73f20f7be5cfa8b983d7286a299b6bd6961a4343ad17ae61857",
	name: "setTikTokModeFn",
	filename: "src/lib/server/publisher-fns.ts"
}, (opts) => setTikTokModeFn.__executeServer(opts));
var setTikTokModeFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ mode: _enum(["inbox", "direct"]) }).parse(input)).handler(setTikTokModeFn_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const { setTikTokPublishMode } = await import("./social-oauth.server-BkBN9MI7.mjs").then((n) => n.S).then((n) => n.m);
	await setTikTokPublishMode(data.mode);
	return { ok: true };
});
var setTikTokAuditFn_createServerFn_handler = createServerRpc({
	id: "4b4e35559197e43cd3b7c5771153655836b700d0b8a31e67996bfb54abe1872c",
	name: "setTikTokAuditFn",
	filename: "src/lib/server/publisher-fns.ts"
}, (opts) => setTikTokAuditFn.__executeServer(opts));
var setTikTokAuditFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ status: _enum([
	"UNAUDITED",
	"AUDITED",
	"UNKNOWN"
]) }).parse(input)).handler(setTikTokAuditFn_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const { setTikTokAuditStatus } = await import("./social-oauth.server-BkBN9MI7.mjs").then((n) => n.S).then((n) => n.m);
	await setTikTokAuditStatus(data.status);
	return { ok: true };
});
var setTikTokDomainFn_createServerFn_handler = createServerRpc({
	id: "cb7a4e435c9a8051ab79d3973c76cfe108c1d811310581e663c95773b018ec0c",
	name: "setTikTokDomainFn",
	filename: "src/lib/server/publisher-fns.ts"
}, (opts) => setTikTokDomainFn.__executeServer(opts));
var setTikTokDomainFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ domain: string().max(200) }).parse(input)).handler(setTikTokDomainFn_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const { setTikTokVerifiedDomain } = await import("./social-oauth.server-BkBN9MI7.mjs").then((n) => n.S).then((n) => n.m);
	await setTikTokVerifiedDomain(data.domain);
	return { ok: true };
});
var setYoutubePublishDefaultsFn_createServerFn_handler = createServerRpc({
	id: "301320a7af95f80f8bbf0a0749626c18674da0dc46ce6fb039dd51a4a887df02",
	name: "setYoutubePublishDefaultsFn",
	filename: "src/lib/server/publisher-fns.ts"
}, (opts) => setYoutubePublishDefaultsFn.__executeServer(opts));
var setYoutubePublishDefaultsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	categoryId: string().max(8).optional(),
	privacyDefault: _enum([
		"private",
		"unlisted",
		"public"
	]).optional()
}).parse(input)).handler(setYoutubePublishDefaultsFn_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const { persistYoutubePublishDefaults } = await import("./social-oauth.server-BkBN9MI7.mjs").then((n) => n.S).then((n) => n.m);
	await persistYoutubePublishDefaults(data);
	return { ok: true };
});
//#endregion
export { disconnectPublisherFn_createServerFn_handler, getSocialPublishers_createServerFn_handler, savePublisherAppFn_createServerFn_handler, selectInstagramAccountFn_createServerFn_handler, setTikTokAuditFn_createServerFn_handler, setTikTokDomainFn_createServerFn_handler, setTikTokModeFn_createServerFn_handler, setYoutubePublishDefaultsFn_createServerFn_handler, startPublisherOAuthFn_createServerFn_handler, testPublisherFn_createServerFn_handler };
