import { i as createServerFn } from "./ssr2.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/session-BkcB4KyB.js
var fetchSessionUser_createServerFn_handler = createServerRpc({
	id: "84e93aa9a4240c380045ee2a2b03d040f71423f1e8e84c8eba0a02080539bf41",
	name: "fetchSessionUser",
	filename: "src/lib/session.ts"
}, (opts) => fetchSessionUser.__executeServer(opts));
var fetchSessionUser = createServerFn({ method: "GET" }).handler(fetchSessionUser_createServerFn_handler, async () => {
	const { getSessionUser } = await import("./verify.server-Bpwplt8y.mjs").then((n) => n.n);
	const u = await getSessionUser();
	return u ? {
		id: u.id,
		email: u.email
	} : null;
});
//#endregion
export { fetchSessionUser_createServerFn_handler };
