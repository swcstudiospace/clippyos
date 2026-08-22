import { Bt as _enum, Jt as object, Ut as boolean } from "../_libs/@better-auth/core+[...].mjs";
import { _ as SAAS_PLAN_KEYS, h as PRODUCT_ONBOARDING_STEPS } from "./mappers-Bmic_hyw.mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { n as auth } from "./server-C5l0fORE.mjs";
import { r as requireAdmin } from "./access-CV3glphY.mjs";
import { a as requestCancelAtPeriodEnd, i as refreshFromAirwallex, o as startHostedCheckout, r as readProductOnboarding, s as writeProductOnboarding, t as buildBillingSnapshot } from "./billing.server-Dn_P3iW1.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/billing-fns-DSGT27_p.js
async function authUser(userId) {
	try {
		const user = await (await auth.$context).internalAdapter.findUserById(userId);
		if (user) return {
			email: user.email ?? "",
			name: user.name ?? ""
		};
	} catch {}
	return {
		email: "",
		name: ""
	};
}
var getBillingSnapshot_createServerFn_handler = createServerRpc({
	id: "df20774bd6d8daebd588091d43e3558a3241e973e8bb1aaeff6c03b9368ed7f4",
	name: "getBillingSnapshot",
	filename: "src/lib/server/billing-fns.ts"
}, (opts) => getBillingSnapshot.__executeServer(opts));
var getBillingSnapshot = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getBillingSnapshot_createServerFn_handler, async ({ context }) => {
	return buildBillingSnapshot(context.userId);
});
var refreshBillingEntitlement_createServerFn_handler = createServerRpc({
	id: "775bdcfbd6a44f6c5c905f51bf2ef593e540e21ce934b802bb88e64a2aada22f",
	name: "refreshBillingEntitlement",
	filename: "src/lib/server/billing-fns.ts"
}, (opts) => refreshBillingEntitlement.__executeServer(opts));
var refreshBillingEntitlement = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(refreshBillingEntitlement_createServerFn_handler, async ({ context }) => {
	await refreshFromAirwallex();
	return buildBillingSnapshot(context.userId, "success");
});
var CheckoutSchema = object({ planKey: _enum(SAAS_PLAN_KEYS) });
var startBillingCheckout_createServerFn_handler = createServerRpc({
	id: "81f03b51a09adbe96352f4aeb8a10bbb287b1bdf06fb39e6eb4a4ab1fd1a4ee1",
	name: "startBillingCheckout",
	filename: "src/lib/server/billing-fns.ts"
}, (opts) => startBillingCheckout.__executeServer(opts));
var startBillingCheckout = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => CheckoutSchema.parse(input)).handler(startBillingCheckout_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	const user = await authUser(context.userId);
	if (!user.email) throw new Error("BILLING_EMAIL_REQUIRED");
	return startHostedCheckout({
		userId: context.userId,
		planKey: data.planKey,
		email: user.email,
		name: user.name || user.email
	});
});
var cancelWorkspaceSubscription_createServerFn_handler = createServerRpc({
	id: "76eb04e4fafa50bba8e4b1d2b107428f39650bb523b880156ffd3186f5369577",
	name: "cancelWorkspaceSubscription",
	filename: "src/lib/server/billing-fns.ts"
}, (opts) => cancelWorkspaceSubscription.__executeServer(opts));
var cancelWorkspaceSubscription = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(cancelWorkspaceSubscription_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	await requestCancelAtPeriodEnd();
	return buildBillingSnapshot(context.userId);
});
var getProductOnboarding_createServerFn_handler = createServerRpc({
	id: "dcdcb1a7db5f110ae35233db57058e24b0396ea1c1267361d9fae60310563cdc",
	name: "getProductOnboarding",
	filename: "src/lib/server/billing-fns.ts"
}, (opts) => getProductOnboarding.__executeServer(opts));
var getProductOnboarding = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getProductOnboarding_createServerFn_handler, async () => {
	return readProductOnboarding();
});
var ProductStepSchema = object({
	step: _enum(PRODUCT_ONBOARDING_STEPS),
	done: boolean()
});
var setProductOnboardingStep_createServerFn_handler = createServerRpc({
	id: "b980ebd0792217655054ccd6cc8c41ee469f37c3dc91175c477488552b55348a",
	name: "setProductOnboardingStep",
	filename: "src/lib/server/billing-fns.ts"
}, (opts) => setProductOnboardingStep.__executeServer(opts));
var setProductOnboardingStep = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => ProductStepSchema.parse(input)).handler(setProductOnboardingStep_createServerFn_handler, async ({ data }) => {
	const current = await readProductOnboarding();
	current.steps[data.step] = {
		done: data.done,
		at: data.done ? (/* @__PURE__ */ new Date()).toISOString() : null
	};
	return writeProductOnboarding(current);
});
var dismissProductOnboarding_createServerFn_handler = createServerRpc({
	id: "a30a5ecc7b2c1e9c76761d3905340de83088f613f8fac491cd77d7754cc1ed1d",
	name: "dismissProductOnboarding",
	filename: "src/lib/server/billing-fns.ts"
}, (opts) => dismissProductOnboarding.__executeServer(opts));
var dismissProductOnboarding = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(dismissProductOnboarding_createServerFn_handler, async () => {
	const current = await readProductOnboarding();
	current.dismissed = true;
	return writeProductOnboarding(current);
});
//#endregion
export { cancelWorkspaceSubscription_createServerFn_handler, dismissProductOnboarding_createServerFn_handler, getBillingSnapshot_createServerFn_handler, getProductOnboarding_createServerFn_handler, refreshBillingEntitlement_createServerFn_handler, setProductOnboardingStep_createServerFn_handler, startBillingCheckout_createServerFn_handler };
