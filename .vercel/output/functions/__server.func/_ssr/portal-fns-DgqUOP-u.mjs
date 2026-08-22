import { Bt as _enum, Jt as object, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { i as createServerFn, n as createMiddleware } from "./ssr2.mjs";
import { d as getPortalBearerToken } from "./portal-BZQkNPFJ.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/portal-fns-DgqUOP-u.js
var portalMiddleware = createMiddleware({ type: "function" }).client(async ({ next }) => {
	return next({ sendContext: { portalToken: getPortalBearerToken() ?? void 0 } });
}).server(async ({ next, context }) => {
	const { assertSameSiteRequest } = await import("./isolation.server-BhkgXDma.mjs");
	assertSameSiteRequest();
	const { resolvePortalSession } = await import("./portal.server-Bv5Rx_Kz.mjs");
	const portal = await resolvePortalSession(context.portalToken);
	if (!portal) {
		const error = /* @__PURE__ */ new Error("Unauthorized");
		error.status = 401;
		throw error;
	}
	return next({ context: { portal } });
});
var peekPortalInviteFn_createServerFn_handler = createServerRpc({
	id: "c77c4bc54c9e2d1f44093135e7d6637a6d5f768871e78209f7dc092b949bd0cc",
	name: "peekPortalInviteFn",
	filename: "src/lib/server/portal-fns.ts"
}, (opts) => peekPortalInviteFn.__executeServer(opts));
var peekPortalInviteFn = createServerFn({ method: "POST" }).validator((input) => object({ token: string().min(8).max(200) }).parse(input)).handler(peekPortalInviteFn_createServerFn_handler, async ({ data }) => {
	const { peekInvite } = await import("./portal.server-Bv5Rx_Kz.mjs");
	return peekInvite(data.token);
});
var activatePortalInviteFn_createServerFn_handler = createServerRpc({
	id: "ae80d60eda197e1af917b5372e21bab1ea7a16488118462860d05beebaf7421f",
	name: "activatePortalInviteFn",
	filename: "src/lib/server/portal-fns.ts"
}, (opts) => activatePortalInviteFn.__executeServer(opts));
var activatePortalInviteFn = createServerFn({ method: "POST" }).validator((input) => object({
	token: string().min(8).max(200),
	password: string().min(8).max(200),
	name: string().max(80).optional()
}).parse(input)).handler(activatePortalInviteFn_createServerFn_handler, async ({ data }) => {
	const { activateInvite } = await import("./portal.server-Bv5Rx_Kz.mjs");
	return activateInvite({
		token: data.token,
		password: data.password,
		name: data.name
	});
});
var portalLoginFn_createServerFn_handler = createServerRpc({
	id: "caff8614c756e66890afcffa4df47bf6962e5f2ed424f99e9070c573ce181b5d",
	name: "portalLoginFn",
	filename: "src/lib/server/portal-fns.ts"
}, (opts) => portalLoginFn.__executeServer(opts));
var portalLoginFn = createServerFn({ method: "POST" }).validator((input) => object({
	email: string().email().max(200),
	password: string().min(8).max(200)
}).parse(input)).handler(portalLoginFn_createServerFn_handler, async ({ data }) => {
	const { portalPasswordLogin } = await import("./portal.server-Bv5Rx_Kz.mjs");
	return portalPasswordLogin(data);
});
var portalLogoutFn_createServerFn_handler = createServerRpc({
	id: "680304b25c4c66c66d446c1e7a0e1f1b27cc0bf77693bccf8779ccdc58169091",
	name: "portalLogoutFn",
	filename: "src/lib/server/portal-fns.ts"
}, (opts) => portalLogoutFn.__executeServer(opts));
var portalLogoutFn = createServerFn({ method: "POST" }).middleware([createMiddleware({ type: "function" }).client(async ({ next }) => {
	return next({ sendContext: { portalToken: getPortalBearerToken() ?? void 0 } });
}).server(async ({ next, context }) => next({ context: { portalToken: context.portalToken } }))]).handler(portalLogoutFn_createServerFn_handler, async ({ context }) => {
	const { portalLogout } = await import("./portal.server-Bv5Rx_Kz.mjs");
	await portalLogout(context.portalToken);
	return { ok: true };
});
var getPortalSessionFn_createServerFn_handler = createServerRpc({
	id: "d270680d3a91f72c1c0172d5925955b8be5d7574cd6ca08a4b07ad4d6e1a4963",
	name: "getPortalSessionFn",
	filename: "src/lib/server/portal-fns.ts"
}, (opts) => getPortalSessionFn.__executeServer(opts));
var getPortalSessionFn = createServerFn({ method: "GET" }).middleware([portalMiddleware]).handler(getPortalSessionFn_createServerFn_handler, async ({ context }) => context.portal);
var getPortalHomeFn_createServerFn_handler = createServerRpc({
	id: "c60ac9cf25a818025172e83f0ea0538c7b7335bef9fd50b4be0b241fcc47d7b9",
	name: "getPortalHomeFn",
	filename: "src/lib/server/portal-fns.ts"
}, (opts) => getPortalHomeFn.__executeServer(opts));
var getPortalHomeFn = createServerFn({ method: "GET" }).middleware([portalMiddleware]).handler(getPortalHomeFn_createServerFn_handler, async ({ context }) => {
	const { loadPortalHome } = await import("./portal.server-Bv5Rx_Kz.mjs");
	return loadPortalHome(context.portal);
});
var listPortalAssetsFn_createServerFn_handler = createServerRpc({
	id: "febf66707a7511a756ce24503cb8ab9a05cd98a1c9df71f9df7fbcb95f059b49",
	name: "listPortalAssetsFn",
	filename: "src/lib/server/portal-fns.ts"
}, (opts) => listPortalAssetsFn.__executeServer(opts));
var listPortalAssetsFn = createServerFn({ method: "POST" }).middleware([portalMiddleware]).validator((input) => object({ kind: _enum([
	"ALL",
	"VIDEO",
	"IMAGE"
]).optional() }).parse(input ?? {})).handler(listPortalAssetsFn_createServerFn_handler, async ({ context, data }) => {
	const { loadPortalAssets, readPortalSettings } = await import("./portal.server-Bv5Rx_Kz.mjs");
	const [assets, settings] = await Promise.all([loadPortalAssets(context.portal, data.kind ?? "ALL"), readPortalSettings()]);
	return {
		assets,
		allowDownload: settings.allowDownload
	};
});
var signPortalDownloadFn_createServerFn_handler = createServerRpc({
	id: "558668c5d61f2cb71c0ca0efe9198ca06fbf960ce6f77426d028aa202496577c",
	name: "signPortalDownloadFn",
	filename: "src/lib/server/portal-fns.ts"
}, (opts) => signPortalDownloadFn.__executeServer(opts));
var signPortalDownloadFn = createServerFn({ method: "POST" }).middleware([portalMiddleware]).validator((input) => object({ assetId: string().min(1) }).parse(input)).handler(signPortalDownloadFn_createServerFn_handler, async ({ context, data }) => {
	const { signPortalDownload } = await import("./portal.server-Bv5Rx_Kz.mjs");
	return { url: await signPortalDownload(context.portal, data.assetId) };
});
var listPortalApprovalsFn_createServerFn_handler = createServerRpc({
	id: "8263461a1c62db43a901852ec396ae60e3239478c52f33ea97e4d988cc29e21b",
	name: "listPortalApprovalsFn",
	filename: "src/lib/server/portal-fns.ts"
}, (opts) => listPortalApprovalsFn.__executeServer(opts));
var listPortalApprovalsFn = createServerFn({ method: "GET" }).middleware([portalMiddleware]).handler(listPortalApprovalsFn_createServerFn_handler, async ({ context }) => {
	const { loadPortalApprovals } = await import("./portal.server-Bv5Rx_Kz.mjs");
	return {
		items: await loadPortalApprovals(context.portal, "ALL"),
		canApprove: context.portal.canApprove && !context.portal.preview
	};
});
var decidePortalApprovalFn_createServerFn_handler = createServerRpc({
	id: "4f31e7d2ffd9e1f19a1fc425bb8f78cdb27e4e4738729a8f5093f8b0014f7265",
	name: "decidePortalApprovalFn",
	filename: "src/lib/server/portal-fns.ts"
}, (opts) => decidePortalApprovalFn.__executeServer(opts));
var decidePortalApprovalFn = createServerFn({ method: "POST" }).middleware([portalMiddleware]).validator((input) => object({
	id: string().min(1),
	decision: _enum(["APPROVED", "REJECTED"]),
	note: string().max(400).optional()
}).parse(input)).handler(decidePortalApprovalFn_createServerFn_handler, async ({ context, data }) => {
	if (context.portal.preview) throw new Error("PORTAL_PREVIEW_READONLY");
	if (!context.portal.canApprove || !context.portal.userId) throw new Error("APPROVAL_FORBIDDEN");
	if (data.decision === "REJECTED" && !data.note?.trim()) throw new Error("PORTAL_NOTE_REQUIRED");
	const { getApprovalRequest, decideApproval } = await import("./approvals.server-Bpax_gE8.mjs");
	const { assertClientFacingApproval, readPortalSettings } = await import("./portal.server-Bv5Rx_Kz.mjs");
	if (!(await readPortalSettings()).approvalsEnabled) throw new Error("PORTAL_APPROVALS_OFF");
	const request = await getApprovalRequest(data.id);
	if (!request) throw new Error("APPROVAL_MISSING");
	assertClientFacingApproval(request, context.portal);
	const { portalActorId } = await import("./portal-BZQkNPFJ.mjs").then((n) => n.m).then((n) => n.m);
	return { item: await decideApproval({
		id: data.id,
		actorId: portalActorId(context.portal.userId),
		decision: data.decision,
		note: data.note
	}) };
});
var listPortalActivityFn_createServerFn_handler = createServerRpc({
	id: "25bd1163acdca4a90c922f1c387cbd8b45f46ddf87932f89f00c8f1899294d4c",
	name: "listPortalActivityFn",
	filename: "src/lib/server/portal-fns.ts"
}, (opts) => listPortalActivityFn.__executeServer(opts));
var listPortalActivityFn = createServerFn({ method: "GET" }).middleware([portalMiddleware]).handler(listPortalActivityFn_createServerFn_handler, async ({ context }) => {
	const { loadPortalActivity } = await import("./portal.server-Bv5Rx_Kz.mjs");
	return { items: await loadPortalActivity(context.portal) };
});
var markPortalNotificationsReadFn_createServerFn_handler = createServerRpc({
	id: "19ef627d3bdb1dc86750a71bc6c9da61d1fcf9c102122f6bd5160b06a54557b3",
	name: "markPortalNotificationsReadFn",
	filename: "src/lib/server/portal-fns.ts"
}, (opts) => markPortalNotificationsReadFn.__executeServer(opts));
var markPortalNotificationsReadFn = createServerFn({ method: "POST" }).middleware([portalMiddleware]).handler(markPortalNotificationsReadFn_createServerFn_handler, async ({ context }) => {
	const { markPortalNotificationsRead } = await import("./portal.server-Bv5Rx_Kz.mjs");
	await markPortalNotificationsRead(context.portal);
	return { ok: true };
});
//#endregion
export { activatePortalInviteFn_createServerFn_handler, decidePortalApprovalFn_createServerFn_handler, getPortalHomeFn_createServerFn_handler, getPortalSessionFn_createServerFn_handler, listPortalActivityFn_createServerFn_handler, listPortalApprovalsFn_createServerFn_handler, listPortalAssetsFn_createServerFn_handler, markPortalNotificationsReadFn_createServerFn_handler, peekPortalInviteFn_createServerFn_handler, portalLoginFn_createServerFn_handler, portalLogoutFn_createServerFn_handler, signPortalDownloadFn_createServerFn_handler };
