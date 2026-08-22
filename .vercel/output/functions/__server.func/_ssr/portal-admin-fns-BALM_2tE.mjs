import { Jt as object, Ut as boolean, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { n as getUserRole, r as requireAdmin } from "./access-CV3glphY.mjs";
import { f as parsePortalSettings } from "./portal-BZQkNPFJ.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/portal-admin-fns-BALM_2tE.js
async function requireStaff(userId) {
	const role = await getUserRole(userId);
	if (!role) throw new Error("Forbidden");
	return role;
}
var getPortalSettingsFn_createServerFn_handler = createServerRpc({
	id: "8d6c5a2d78184d7c6fcc0ace459f5bb2d1c40838ff54a5a314d2d5d150011169",
	name: "getPortalSettingsFn",
	filename: "src/lib/server/portal-admin-fns.ts"
}, (opts) => getPortalSettingsFn.__executeServer(opts));
var getPortalSettingsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getPortalSettingsFn_createServerFn_handler, async ({ context }) => {
	await requireStaff(context.userId);
	const { readPortalSettings } = await import("./portal.server-Bv5Rx_Kz.mjs");
	return readPortalSettings();
});
var savePortalSettingsFn_createServerFn_handler = createServerRpc({
	id: "f2aff30be45c2f1f4046ddb1633b4c3a8f314b2da10134b681ab5fc55acc4dce",
	name: "savePortalSettingsFn",
	filename: "src/lib/server/portal-admin-fns.ts"
}, (opts) => savePortalSettingsFn.__executeServer(opts));
var savePortalSettingsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	enabled: boolean(),
	allowDownload: boolean(),
	showMetrics: boolean(),
	approvalsEnabled: boolean(),
	welcomeBlurb: string().max(400),
	agencyName: string().max(80),
	logoUrl: string().max(500).nullable()
}).parse(input)).handler(savePortalSettingsFn_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const { writePortalSettings } = await import("./portal.server-Bv5Rx_Kz.mjs");
	const { writeAuditEvent } = await import("./audit.server-B2Y-2eMJ.mjs");
	const next = await writePortalSettings(parsePortalSettings(data));
	await writeAuditEvent({
		actorUserId: context.userId,
		actorType: "USER",
		action: "settings.portal.updated",
		entityType: "app_setting",
		entityId: "PORTAL_SETTINGS_JSON",
		summary: "Updated client portal settings"
	});
	return next;
});
var listPortalUsersFn_createServerFn_handler = createServerRpc({
	id: "8eb6279e042004e4a31b7d38e743d9cdcded74ced12181a9a5ada4669d89ef97",
	name: "listPortalUsersFn",
	filename: "src/lib/server/portal-admin-fns.ts"
}, (opts) => listPortalUsersFn.__executeServer(opts));
var listPortalUsersFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ clientId: string().min(1) }).parse(input)).handler(listPortalUsersFn_createServerFn_handler, async ({ context, data }) => {
	await requireStaff(context.userId);
	const { listPortalUsers, readClientWorkingOn } = await import("./portal.server-Bv5Rx_Kz.mjs");
	const [users, workingOn] = await Promise.all([listPortalUsers(data.clientId), readClientWorkingOn(data.clientId)]);
	return {
		users,
		workingOn
	};
});
var invitePortalUserFn_createServerFn_handler = createServerRpc({
	id: "cf65b1d00f15bc4ee94b99b26d1e26f60a2199d5e7e5ba2683a30a5b7f840b02",
	name: "invitePortalUserFn",
	filename: "src/lib/server/portal-admin-fns.ts"
}, (opts) => invitePortalUserFn.__executeServer(opts));
var invitePortalUserFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	clientId: string().min(1),
	email: string().email().max(200),
	name: string().max(80).optional(),
	canApprove: boolean().optional()
}).parse(input)).handler(invitePortalUserFn_createServerFn_handler, async ({ context, data }) => {
	await requireStaff(context.userId);
	const { invitePortalUser } = await import("./portal.server-Bv5Rx_Kz.mjs");
	return invitePortalUser({
		clientId: data.clientId,
		email: data.email,
		name: data.name,
		canApprove: data.canApprove,
		actorId: context.userId
	});
});
var revokePortalUserFn_createServerFn_handler = createServerRpc({
	id: "cee5338de188c424e85620cfd1f3ba7e3b44f762305a3bbfc1c49cc1a95aed3f",
	name: "revokePortalUserFn",
	filename: "src/lib/server/portal-admin-fns.ts"
}, (opts) => revokePortalUserFn.__executeServer(opts));
var revokePortalUserFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ id: string().min(1) }).parse(input)).handler(revokePortalUserFn_createServerFn_handler, async ({ context, data }) => {
	await requireStaff(context.userId);
	const { revokePortalUser } = await import("./portal.server-Bv5Rx_Kz.mjs");
	return revokePortalUser({
		id: data.id,
		actorId: context.userId
	});
});
var setPortalCanApproveFn_createServerFn_handler = createServerRpc({
	id: "19e511a5bedb39d9e9ed4337666af46d6a6cb4bd64ab4f19bca88bdbf230a9cd",
	name: "setPortalCanApproveFn",
	filename: "src/lib/server/portal-admin-fns.ts"
}, (opts) => setPortalCanApproveFn.__executeServer(opts));
var setPortalCanApproveFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	id: string().min(1),
	canApprove: boolean()
}).parse(input)).handler(setPortalCanApproveFn_createServerFn_handler, async ({ context, data }) => {
	await requireStaff(context.userId);
	const { setPortalCanApprove } = await import("./portal.server-Bv5Rx_Kz.mjs");
	return setPortalCanApprove({
		id: data.id,
		canApprove: data.canApprove,
		actorId: context.userId
	});
});
var savePortalWorkingOnFn_createServerFn_handler = createServerRpc({
	id: "85ffaa66de3c87fa7913f9ba69ef91fa5bf11a8e1b563a7dbcd4d6ad75ba410e",
	name: "savePortalWorkingOnFn",
	filename: "src/lib/server/portal-admin-fns.ts"
}, (opts) => savePortalWorkingOnFn.__executeServer(opts));
var savePortalWorkingOnFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	clientId: string().min(1),
	note: string().max(280).nullable()
}).parse(input)).handler(savePortalWorkingOnFn_createServerFn_handler, async ({ context, data }) => {
	await requireStaff(context.userId);
	const { writeClientWorkingOn } = await import("./portal.server-Bv5Rx_Kz.mjs");
	await writeClientWorkingOn(data.clientId, data.note);
	return { ok: true };
});
var startPortalPreviewFn_createServerFn_handler = createServerRpc({
	id: "a368f14624cbb579bf8e8e7b80f6c8bd1875230a433723f42865b7679ac1e82c",
	name: "startPortalPreviewFn",
	filename: "src/lib/server/portal-admin-fns.ts"
}, (opts) => startPortalPreviewFn.__executeServer(opts));
var startPortalPreviewFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ clientId: string().min(1) }).parse(input)).handler(startPortalPreviewFn_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const { startPortalPreview } = await import("./portal.server-Bv5Rx_Kz.mjs");
	return startPortalPreview({
		clientId: data.clientId,
		actorId: context.userId
	});
});
//#endregion
export { getPortalSettingsFn_createServerFn_handler, invitePortalUserFn_createServerFn_handler, listPortalUsersFn_createServerFn_handler, revokePortalUserFn_createServerFn_handler, savePortalSettingsFn_createServerFn_handler, savePortalWorkingOnFn_createServerFn_handler, setPortalCanApproveFn_createServerFn_handler, startPortalPreviewFn_createServerFn_handler };
