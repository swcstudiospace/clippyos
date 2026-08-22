import { Jt as object, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { f as normalizePreset } from "./agent-BK3m7JzY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/agent-fns-BjkKfcmf.js
var listAgentRunsFn_createServerFn_handler = createServerRpc({
	id: "f0e704f0e15911f71899de547f8b035c1195ac38d03394583835daccdcd57744",
	name: "listAgentRunsFn",
	filename: "src/lib/server/agent-fns.ts"
}, (opts) => listAgentRunsFn.__executeServer(opts));
var listAgentRunsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listAgentRunsFn_createServerFn_handler, async ({ context }) => {
	if (!context.userId) throw new Error("Unauthorized");
	const { listAgentRuns } = await import("./agent.server-DlFy-Bd5.mjs");
	return listAgentRuns(40);
});
var getAgentRunFn_createServerFn_handler = createServerRpc({
	id: "ea85aa34917a3e967f99c47d77de42f0822348ba11558a0dbee4b72f707cf5e0",
	name: "getAgentRunFn",
	filename: "src/lib/server/agent-fns.ts"
}, (opts) => getAgentRunFn.__executeServer(opts));
var getAgentRunFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(getAgentRunFn_createServerFn_handler, async ({ context, data: id }) => {
	if (!context.userId) throw new Error("Unauthorized");
	const { getAgentRunDetail } = await import("./agent.server-DlFy-Bd5.mjs");
	const detail = await getAgentRunDetail(id);
	if (!detail) throw new Error("JOB_MISSING");
	return detail;
});
var startAgentRunFn_createServerFn_handler = createServerRpc({
	id: "24f1f64a5ef27f700eff4aea0fa10d297c18273ecde9898006adcc1bd1c85073",
	name: "startAgentRunFn",
	filename: "src/lib/server/agent-fns.ts"
}, (opts) => startAgentRunFn.__executeServer(opts));
var startAgentRunFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	goal: string().max(4e3),
	preset: string().min(1),
	clientId: string().nullable().optional(),
	skillId: string().nullable().optional(),
	idempotencyKey: string().max(80).nullable().optional(),
	modelOverride: string().max(80).nullable().optional()
}).parse(input)).handler(startAgentRunFn_createServerFn_handler, async ({ context, data }) => {
	if (!context.userId) throw new Error("Unauthorized");
	const { startAgentRun } = await import("./agent-loop.server-DZo-g7Gp.mjs");
	return startAgentRun({
		goal: data.goal,
		preset: normalizePreset(data.preset),
		clientId: data.clientId,
		skillId: data.skillId,
		createdBy: context.userId,
		idempotencyKey: data.idempotencyKey,
		modelOverride: data.modelOverride
	});
});
var cancelAgentRunFn_createServerFn_handler = createServerRpc({
	id: "985414db8ffd3b9ab490df13e88ab680c7e8c5b1ce167fac42442c101d8590e3",
	name: "cancelAgentRunFn",
	filename: "src/lib/server/agent-fns.ts"
}, (opts) => cancelAgentRunFn.__executeServer(opts));
var cancelAgentRunFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(cancelAgentRunFn_createServerFn_handler, async ({ context, data: id }) => {
	if (!context.userId) throw new Error("Unauthorized");
	const { cancelAgentRun } = await import("./agent-loop.server-DZo-g7Gp.mjs");
	await cancelAgentRun(id);
	return { ok: true };
});
//#endregion
export { cancelAgentRunFn_createServerFn_handler, getAgentRunFn_createServerFn_handler, listAgentRunsFn_createServerFn_handler, startAgentRunFn_createServerFn_handler };
