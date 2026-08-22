import { Bt as _enum, Jt as object, Ut as boolean, Vt as any, Xt as record, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/skill-fns-ThWTLUr8.js
var listSkillsFn_createServerFn_handler = createServerRpc({
	id: "97e84c153f96825b13c896c5f319da64bc37978b32df54d274a4538db1a64084",
	name: "listSkillsFn",
	filename: "src/lib/server/skill-fns.ts"
}, (opts) => listSkillsFn.__executeServer(opts));
var listSkillsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listSkillsFn_createServerFn_handler, async ({ context }) => {
	if (!context.userId) throw new Error("Unauthorized");
	const { seedBuiltinSkills, readSkills, publicSkill } = await import("./skills.server-D63wa77B.mjs").then((n) => n.r).then((n) => n.r);
	await seedBuiltinSkills();
	return (await readSkills()).map(publicSkill);
});
var getSkillFn_createServerFn_handler = createServerRpc({
	id: "35e5a690165a5ac2f48655708627402ac002230b920143e04278725136579c91",
	name: "getSkillFn",
	filename: "src/lib/server/skill-fns.ts"
}, (opts) => getSkillFn.__executeServer(opts));
var getSkillFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(getSkillFn_createServerFn_handler, async ({ context, data: id }) => {
	if (!context.userId) throw new Error("Unauthorized");
	const { seedBuiltinSkills, getSkillById, publicSkill } = await import("./skills.server-D63wa77B.mjs").then((n) => n.r).then((n) => n.r);
	await seedBuiltinSkills();
	const skill = await getSkillById(id);
	if (!skill) throw new Error("SKILL_MISSING");
	return publicSkill(skill);
});
var createSkillFn_createServerFn_handler = createServerRpc({
	id: "05a6e20a33954d0575259efcb43226b95c33c5d707de1945b46b556a12ce324f",
	name: "createSkillFn",
	filename: "src/lib/server/skill-fns.ts"
}, (opts) => createSkillFn.__executeServer(opts));
var createSkillFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	skillMd: string().min(10).max(2e5),
	scripts: record(string(), string()).optional(),
	provenance: _enum(["human", "agent"]).optional()
}).parse(input)).handler(createSkillFn_createServerFn_handler, async ({ context, data }) => {
	const { requireAdmin } = await import("./access-CV3glphY.mjs").then((n) => n.t).then((n) => n.t);
	await requireAdmin(context.userId);
	const { createSkillInternal } = await import("./skills.server-D63wa77B.mjs").then((n) => n.r).then((n) => n.r);
	return createSkillInternal({
		skillMd: data.skillMd,
		scripts: data.scripts,
		provenance: data.provenance === "agent" ? "agent" : "human",
		createdBy: context.userId
	});
});
var setSkillEnabledFn_createServerFn_handler = createServerRpc({
	id: "8fb89e0c64b8b41feddf465166602ce13ccc08a3d11497b2cdabe48561846583",
	name: "setSkillEnabledFn",
	filename: "src/lib/server/skill-fns.ts"
}, (opts) => setSkillEnabledFn.__executeServer(opts));
var setSkillEnabledFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	id: string(),
	enabled: boolean()
}).parse(input)).handler(setSkillEnabledFn_createServerFn_handler, async ({ context, data }) => {
	const { requireAdmin } = await import("./access-CV3glphY.mjs").then((n) => n.t).then((n) => n.t);
	await requireAdmin(context.userId);
	const { patchSkillInternal } = await import("./skills.server-D63wa77B.mjs").then((n) => n.r).then((n) => n.r);
	await patchSkillInternal({
		id: data.id,
		enabled: data.enabled
	});
	return { ok: true };
});
var approveSkillFn_createServerFn_handler = createServerRpc({
	id: "e460bc4a70baad75efa0cd56ee3d670e6e3f2c4af7712c74321b32ed88ab2e6e",
	name: "approveSkillFn",
	filename: "src/lib/server/skill-fns.ts"
}, (opts) => approveSkillFn.__executeServer(opts));
var approveSkillFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(approveSkillFn_createServerFn_handler, async ({ context, data: id }) => {
	const { requireAdmin } = await import("./access-CV3glphY.mjs").then((n) => n.t).then((n) => n.t);
	await requireAdmin(context.userId);
	const { patchSkillInternal } = await import("./skills.server-D63wa77B.mjs").then((n) => n.r).then((n) => n.r);
	await patchSkillInternal({
		id,
		enabled: true,
		status: "active"
	});
	return { ok: true };
});
var invokeSkillFn_createServerFn_handler = createServerRpc({
	id: "910ba37385f0084a821f82b01eefd0ed05023585de5547716963cd681e386d1f",
	name: "invokeSkillFn",
	filename: "src/lib/server/skill-fns.ts"
}, (opts) => invokeSkillFn.__executeServer(opts));
var invokeSkillFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	id: string(),
	args: record(string(), any()).optional()
}).parse(input)).handler(invokeSkillFn_createServerFn_handler, async ({ context, data }) => {
	if (!context.userId) throw new Error("Unauthorized");
	const { getUserRole } = await import("./access-CV3glphY.mjs").then((n) => n.t).then((n) => n.t);
	const role = await getUserRole(context.userId);
	if (role !== "admin" && role !== "member") throw new Error("Unauthorized");
	const { invokeSkillInternal } = await import("./skills.server-D63wa77B.mjs").then((n) => n.r).then((n) => n.r);
	return invokeSkillInternal({
		skillId: data.id,
		args: data.args,
		actorId: context.userId
	});
});
var listSkillRunsFn_createServerFn_handler = createServerRpc({
	id: "1b9240b2504378178cc160e867598fdc64dc8bfd1a7d5a7b78343c5eb2d9ae46",
	name: "listSkillRunsFn",
	filename: "src/lib/server/skill-fns.ts"
}, (opts) => listSkillRunsFn.__executeServer(opts));
var listSkillRunsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(listSkillRunsFn_createServerFn_handler, async ({ context, data: id }) => {
	if (!context.userId) throw new Error("Unauthorized");
	const { getSkillById, listSkillRunsForSkill } = await import("./skills.server-D63wa77B.mjs").then((n) => n.r).then((n) => n.r);
	const skill = await getSkillById(id);
	if (!skill) throw new Error("SKILL_MISSING");
	return listSkillRunsForSkill(skill.id);
});
//#endregion
export { approveSkillFn_createServerFn_handler, createSkillFn_createServerFn_handler, getSkillFn_createServerFn_handler, invokeSkillFn_createServerFn_handler, listSkillRunsFn_createServerFn_handler, listSkillsFn_createServerFn_handler, setSkillEnabledFn_createServerFn_handler };
