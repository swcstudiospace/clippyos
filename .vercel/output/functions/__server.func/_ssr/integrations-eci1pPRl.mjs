import { Bt as _enum, Jt as object, Xt as record, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { i as INTEGRATION_IDS } from "./integrations-BBMsU168.mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/integrations-eci1pPRl.js
var getIntegrationsStatus = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("1b3697949cdd69f8c7f9185b1ea2a53cc66001ea47279c6ff87991c4d0bf8de5"));
var completeFirstLaunch = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("191b1a3b543f4399187a19fafbc1c72b794868890e2c2699ea24229022f3400e"));
var SaveSchema = object({
	id: _enum(INTEGRATION_IDS),
	values: record(string(), string())
});
var saveIntegration = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => SaveSchema.parse(input)).handler(createSsrRpc("c1498107105567482c32611a4309fd37f9c9eeadf95b53b721c0801788126e1f"));
var disconnectIntegration = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => _enum(INTEGRATION_IDS).parse(id)).handler(createSsrRpc("efd8a6244c76959f3fbacce3abf26b3807497709ec56dc0a58fd544daa34c399"));
var testIntegration = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => _enum(INTEGRATION_IDS).parse(id)).handler(createSsrRpc("9cb0ff1195b2cb2ec3c80bb512d3239487e30afc5657a3daed804b845a5beebb"));
var runDiscordAgentNow = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("55910e1c8926bbc007bbffd53402a7d003ef47ffdab2a9305f7bc40a507c46b6"));
//#endregion
export { saveIntegration as a, runDiscordAgentNow as i, disconnectIntegration as n, testIntegration as o, getIntegrationsStatus as r, completeFirstLaunch as t };
