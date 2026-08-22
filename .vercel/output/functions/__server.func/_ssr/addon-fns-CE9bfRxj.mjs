import { $t as unknown, Jt as object, Ut as boolean, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/addon-fns-CE9bfRxj.js
var listAddons_createServerFn_handler = createServerRpc({
	id: "047cfcdf86c850aec240aa7d60b7ff7d05e0177734fe0e198543b3b5824dc59c",
	name: "listAddons",
	filename: "src/lib/server/addon-fns.ts"
}, (opts) => listAddons.__executeServer(opts));
var listAddons = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listAddons_createServerFn_handler, async ({ context }) => {
	if (!context.userId) throw new Error("Unauthorized");
	const { buildAddonsSnapshot } = await import("./addons.server-DwUuR_Y2.mjs").then((n) => n.t).then((n) => n.t);
	return buildAddonsSnapshot();
});
var setAddonEnabled_createServerFn_handler = createServerRpc({
	id: "4949676a769c7c7113244ee7bab54e48deefb76e7dd23b2ee5bb51c5bdb83f22",
	name: "setAddonEnabled",
	filename: "src/lib/server/addon-fns.ts"
}, (opts) => setAddonEnabled.__executeServer(opts));
var setAddonEnabled = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	id: string().min(1),
	enabled: boolean()
}).parse(input)).handler(setAddonEnabled_createServerFn_handler, async ({ context, data }) => {
	const { requireAdmin } = await import("./access-CV3glphY.mjs").then((n) => n.t).then((n) => n.t);
	await requireAdmin(context.userId);
	const { setAddonEnabledInternal } = await import("./addons.server-DwUuR_Y2.mjs").then((n) => n.t).then((n) => n.t);
	return setAddonEnabledInternal(data);
});
var installAddonManifest_createServerFn_handler = createServerRpc({
	id: "ef85fe61cbbb9a48cf3212dd2b22627329d757471890937dc56aab57b5d2dd4c",
	name: "installAddonManifest",
	filename: "src/lib/server/addon-fns.ts"
}, (opts) => installAddonManifest.__executeServer(opts));
var installAddonManifest = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ manifest: unknown() }).parse(input)).handler(installAddonManifest_createServerFn_handler, async ({ context, data }) => {
	const { requireAdmin } = await import("./access-CV3glphY.mjs").then((n) => n.t).then((n) => n.t);
	await requireAdmin(context.userId);
	const { installAddonManifestInternal } = await import("./addons.server-DwUuR_Y2.mjs").then((n) => n.t).then((n) => n.t);
	return installAddonManifestInternal(data.manifest);
});
//#endregion
export { installAddonManifest_createServerFn_handler, listAddons_createServerFn_handler, setAddonEnabled_createServerFn_handler };
