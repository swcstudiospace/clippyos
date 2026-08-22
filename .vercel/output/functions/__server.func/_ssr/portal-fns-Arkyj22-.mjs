import { Bt as _enum, Jt as object, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { i as createServerFn, n as createMiddleware } from "./ssr2.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
import { d as getPortalBearerToken } from "./portal-BZQkNPFJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/portal-fns-Arkyj22-.js
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
var peekPortalInviteFn = createServerFn({ method: "POST" }).validator((input) => object({ token: string().min(8).max(200) }).parse(input)).handler(createSsrRpc("c77c4bc54c9e2d1f44093135e7d6637a6d5f768871e78209f7dc092b949bd0cc"));
var activatePortalInviteFn = createServerFn({ method: "POST" }).validator((input) => object({
	token: string().min(8).max(200),
	password: string().min(8).max(200),
	name: string().max(80).optional()
}).parse(input)).handler(createSsrRpc("ae80d60eda197e1af917b5372e21bab1ea7a16488118462860d05beebaf7421f"));
var portalLoginFn = createServerFn({ method: "POST" }).validator((input) => object({
	email: string().email().max(200),
	password: string().min(8).max(200)
}).parse(input)).handler(createSsrRpc("caff8614c756e66890afcffa4df47bf6962e5f2ed424f99e9070c573ce181b5d"));
var portalLogoutFn = createServerFn({ method: "POST" }).middleware([createMiddleware({ type: "function" }).client(async ({ next }) => {
	return next({ sendContext: { portalToken: getPortalBearerToken() ?? void 0 } });
}).server(async ({ next, context }) => next({ context: { portalToken: context.portalToken } }))]).handler(createSsrRpc("680304b25c4c66c66d446c1e7a0e1f1b27cc0bf77693bccf8779ccdc58169091"));
var getPortalSessionFn = createServerFn({ method: "GET" }).middleware([portalMiddleware]).handler(createSsrRpc("d270680d3a91f72c1c0172d5925955b8be5d7574cd6ca08a4b07ad4d6e1a4963"));
var getPortalHomeFn = createServerFn({ method: "GET" }).middleware([portalMiddleware]).handler(createSsrRpc("c60ac9cf25a818025172e83f0ea0538c7b7335bef9fd50b4be0b241fcc47d7b9"));
var listPortalAssetsFn = createServerFn({ method: "POST" }).middleware([portalMiddleware]).validator((input) => object({ kind: _enum([
	"ALL",
	"VIDEO",
	"IMAGE"
]).optional() }).parse(input ?? {})).handler(createSsrRpc("febf66707a7511a756ce24503cb8ab9a05cd98a1c9df71f9df7fbcb95f059b49"));
var signPortalDownloadFn = createServerFn({ method: "POST" }).middleware([portalMiddleware]).validator((input) => object({ assetId: string().min(1) }).parse(input)).handler(createSsrRpc("558668c5d61f2cb71c0ca0efe9198ca06fbf960ce6f77426d028aa202496577c"));
var listPortalApprovalsFn = createServerFn({ method: "GET" }).middleware([portalMiddleware]).handler(createSsrRpc("8263461a1c62db43a901852ec396ae60e3239478c52f33ea97e4d988cc29e21b"));
var decidePortalApprovalFn = createServerFn({ method: "POST" }).middleware([portalMiddleware]).validator((input) => object({
	id: string().min(1),
	decision: _enum(["APPROVED", "REJECTED"]),
	note: string().max(400).optional()
}).parse(input)).handler(createSsrRpc("4f31e7d2ffd9e1f19a1fc425bb8f78cdb27e4e4738729a8f5093f8b0014f7265"));
var listPortalActivityFn = createServerFn({ method: "GET" }).middleware([portalMiddleware]).handler(createSsrRpc("25bd1163acdca4a90c922f1c387cbd8b45f46ddf87932f89f00c8f1899294d4c"));
createServerFn({ method: "POST" }).middleware([portalMiddleware]).handler(createSsrRpc("19ef627d3bdb1dc86750a71bc6c9da61d1fcf9c102122f6bd5160b06a54557b3"));
//#endregion
export { listPortalActivityFn as a, peekPortalInviteFn as c, signPortalDownloadFn as d, getPortalSessionFn as i, portalLoginFn as l, decidePortalApprovalFn as n, listPortalApprovalsFn as o, getPortalHomeFn as r, listPortalAssetsFn as s, activatePortalInviteFn as t, portalLogoutFn as u };
