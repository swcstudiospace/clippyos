import { Bt as _enum, Jt as object, Ut as boolean } from "../_libs/@better-auth/core+[...].mjs";
import { _ as SAAS_PLAN_KEYS, h as PRODUCT_ONBOARDING_STEPS } from "./mappers-Bmic_hyw.mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/billing-fns-DJqg_cQU.js
var getBillingSnapshot = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("df20774bd6d8daebd588091d43e3558a3241e973e8bb1aaeff6c03b9368ed7f4"));
var refreshBillingEntitlement = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("775bdcfbd6a44f6c5c905f51bf2ef593e540e21ce934b802bb88e64a2aada22f"));
var CheckoutSchema = object({ planKey: _enum(SAAS_PLAN_KEYS) });
var startBillingCheckout = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => CheckoutSchema.parse(input)).handler(createSsrRpc("81f03b51a09adbe96352f4aeb8a10bbb287b1bdf06fb39e6eb4a4ab1fd1a4ee1"));
var cancelWorkspaceSubscription = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("76eb04e4fafa50bba8e4b1d2b107428f39650bb523b880156ffd3186f5369577"));
var getProductOnboarding = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("dcdcb1a7db5f110ae35233db57058e24b0396ea1c1267361d9fae60310563cdc"));
var ProductStepSchema = object({
	step: _enum(PRODUCT_ONBOARDING_STEPS),
	done: boolean()
});
var setProductOnboardingStep = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => ProductStepSchema.parse(input)).handler(createSsrRpc("b980ebd0792217655054ccd6cc8c41ee469f37c3dc91175c477488552b55348a"));
var dismissProductOnboarding = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("a30a5ecc7b2c1e9c76761d3905340de83088f613f8fac491cd77d7754cc1ed1d"));
//#endregion
export { refreshBillingEntitlement as a, getProductOnboarding as i, dismissProductOnboarding as n, setProductOnboardingStep as o, getBillingSnapshot as r, startBillingCheckout as s, cancelWorkspaceSubscription as t };
