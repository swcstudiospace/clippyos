import { r as __exportAll } from "../_runtime.mjs";
import { Bt as _enum, Jt as object, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { d as __exportAll$1 } from "./ssr.mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/team-access-Di_NZ6Xd.js
var team_access_Di_NZ6Xd_exports = /* @__PURE__ */ __exportAll({
	a: () => listTeamLogins,
	c: () => team_access_exports,
	i: () => createTeamLogin,
	l: () => unlockSuperAdmin,
	n: () => completePasswordReset,
	o: () => revokeTeamLogin,
	r: () => createMemberResetLink,
	s: () => setSuperAdminPassword,
	t: () => changeOwnPassword
});
var team_access_exports = /* @__PURE__ */ __exportAll$1({
	changeOwnPassword: () => changeOwnPassword,
	completePasswordReset: () => completePasswordReset,
	createMemberResetLink: () => createMemberResetLink,
	createTeamLogin: () => createTeamLogin,
	listTeamLogins: () => listTeamLogins,
	requestPasswordReset: () => requestPasswordReset,
	revokeTeamLogin: () => revokeTeamLogin,
	setSuperAdminPassword: () => setSuperAdminPassword,
	unlockSuperAdmin: () => unlockSuperAdmin
});
var listTeamLogins = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("debd65317af61d579247b8e78f08141c3f9e097787de887fd1d6e5eb00d10380"));
var CreateSchema = object({
	name: string().trim().min(1).max(120),
	email: string().trim().email().max(200),
	password: string().min(8).max(200),
	role: _enum(["admin", "member"]).default("member")
});
var createTeamLogin = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => CreateSchema.parse(input)).handler(createSsrRpc("bbd6dca88b88d1d0b53dadc205f52523e283f3e12e2937d547bc1453be92217a"));
var revokeTeamLogin = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(createSsrRpc("9dea2914fb9e4c50cf3cbb70ab0fedd6221e4c73c4b3b20943817db3bb365873"));
var PasswordSchema = object({ password: string().min(8).max(200) });
var setSuperAdminPassword = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => PasswordSchema.parse(input)).handler(createSsrRpc("b7a825f85dab2cf4967bc257b357b2b7f983d578a71dc77434bf7897f9dd47cb"));
var requestPasswordReset = createServerFn({ method: "POST" }).validator((input) => object({ email: string().trim().email() }).parse(input)).handler(createSsrRpc("ac07431a26759ab6e75248b4ed4d55fd0527afc3a2701f96f0a226760cd0bacf"));
var createMemberResetLink = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(createSsrRpc("59d657b3eb698b804782669ad4472e4b0ff57865440b3d1afd3ba38644123628"));
var completePasswordReset = createServerFn({ method: "POST" }).validator((input) => object({
	token: string().min(16),
	password: string().min(8).max(200)
}).parse(input)).handler(createSsrRpc("c016d1c51087302b35a843fe910fec0053937c9a47811b106d0fd375bfe851ab"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	userId: string().min(1),
	password: string().min(8).max(200)
}).parse(input)).handler(createSsrRpc("4e4b107251a43f0ef2db185758939e7b226a609f1f1b6a0781419798b1151799"));
var changeOwnPassword = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	currentPassword: string().min(8).max(200),
	newPassword: string().min(8).max(200)
}).parse(input)).handler(createSsrRpc("224ddccff6218e81f01ebbf900ce6f23ae6a95d1b979b17ce5fd1e850d9fd743"));
var unlockSuperAdmin = createServerFn({ method: "POST" }).validator((input) => PasswordSchema.parse(input)).handler(createSsrRpc("c55b262b31dba118d22bb0835f279988501a9ada405f9faa7f0e600d7b198a59"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => PasswordSchema.parse(input)).handler(createSsrRpc("d144d934a4e6f3569c062651990e27c140a357e105d2caf0d1ba90cca55e46b3"));
//#endregion
export { listTeamLogins as a, team_access_Di_NZ6Xd_exports as c, createTeamLogin as i, unlockSuperAdmin as l, completePasswordReset as n, revokeTeamLogin as o, createMemberResetLink as r, setSuperAdminPassword as s, changeOwnPassword as t };
