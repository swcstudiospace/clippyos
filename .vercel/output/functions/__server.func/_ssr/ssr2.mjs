import "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { A as _getRenderedMatches, B as isNotFound, D as getStylesheetHref, E as getScriptPreloadAttrs, I as isRedirect, L as isResolvedRedirect, M as invariant, O as resolveManifestAssetLink, R as parseRedirect, a as isSsrResponse, c as stripSsrResponseBody, f as RouterProvider, i as disposeSsrResponseDetached, j as executeRewriteInput, k as resolveManifestCssLink, n as bindSsrResponseToRequest, o as normalizeSsrResponse, r as defineHandlerCallback, s as replaceSsrResponse, t as renderRouterToStream, z as rootRouteId } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as createMemoryHistory } from "../_libs/tanstack__history.mjs";
import { a as getOrigin, c as createSerializationAdapter, d as toCrossJSONAsync, f as toCrossJSONStream, i as getNormalizedURL, l as makeSerovalPlugin, n as mergeHeaders, o as defaultSerovalPlugins, r as attachRouterServerSsrUtils, s as createRawStreamRPCPlugin, t as waitForRequest, u as fromJSON } from "../_libs/@tanstack/router-core+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { a as toResponse, i as setCookie, n as deleteCookie, r as parseCookies, t as H3Event } from "../_libs/h3-v2+rou3.mjs";
import { d as __exportAll$1 } from "./ssr.mjs";
import { AsyncLocalStorage } from "node:async_hooks";
require_react();
var import_jsx_runtime = require_jsx_runtime();
function StartServer(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RouterProvider, { router: props.router });
}
var defaultStreamHandler = defineHandlerCallback(({ request, router, responseHeaders }) => renderRouterToStream({
	request,
	router,
	responseHeaders,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StartServer, { router })
}));
var GLOBAL_EVENT_STORAGE_KEY = Symbol.for("tanstack-start:event-storage");
var globalObj$1 = globalThis;
if (!globalObj$1[GLOBAL_EVENT_STORAGE_KEY]) globalObj$1[GLOBAL_EVENT_STORAGE_KEY] = new AsyncLocalStorage();
var eventStorage = globalObj$1[GLOBAL_EVENT_STORAGE_KEY];
function isPromiseLike(value) {
	return typeof value.then === "function";
}
function getSetCookieValues(headers) {
	const headersWithSetCookie = headers;
	if (typeof headersWithSetCookie.getSetCookie === "function") return headersWithSetCookie.getSetCookie();
	const value = headers.get("set-cookie");
	return value ? [value] : [];
}
function mergeEventResponseHeaders(response, event) {
	if (response.ok) return;
	const eventSetCookies = getSetCookieValues(event.res.headers);
	if (eventSetCookies.length === 0) return;
	const responseSetCookies = getSetCookieValues(response.headers);
	response.headers.delete("set-cookie");
	for (const cookie of responseSetCookies) response.headers.append("set-cookie", cookie);
	for (const cookie of eventSetCookies) response.headers.append("set-cookie", cookie);
}
function attachResponseHeaders(value, event) {
	if (isPromiseLike(value)) return value.then((resolved) => {
		if (resolved instanceof Response) mergeEventResponseHeaders(resolved, event);
		return resolved;
	});
	if (value instanceof Response) mergeEventResponseHeaders(value, event);
	return value;
}
function requestHandler(handler) {
	return (request, requestOpts) => {
		let h3Event;
		try {
			h3Event = new H3Event(request);
		} catch (error) {
			if (error instanceof URIError) return new Response(null, {
				status: 400,
				statusText: "Bad Request"
			});
			throw error;
		}
		return toResponse(attachResponseHeaders(eventStorage.run({ h3Event }, () => handler(request, requestOpts)), h3Event), h3Event);
	};
}
function getH3Event() {
	const event = eventStorage.getStore();
	if (!event) throw new Error(`No StartEvent found in AsyncLocalStorage. Make sure you are using the function within the server runtime.`);
	return event.h3Event;
}
function getRequest() {
	return getH3Event().req;
}
/**
* Parse the request to get HTTP Cookie header string and return an object of all cookie name-value pairs.
* @returns Object of cookie name-value pairs
* ```ts
* const cookies = getCookies()
* ```
*/
function getCookies() {
	const cookies = parseCookies(getH3Event());
	const definedCookies = Object.create(null);
	for (const [name, value] of Object.entries(cookies)) if (value !== void 0) definedCookies[name] = value;
	return definedCookies;
}
/**
* Get a cookie value by name.
* @param name Name of the cookie to get
* @returns {*} Value of the cookie (String or undefined)
* ```ts
* const authorization = getCookie('Authorization')
* ```
*/
function getCookie(name) {
	return getCookies()[name];
}
/**
* Set a cookie value by name.
* @param name Name of the cookie to set
* @param value Value of the cookie to set
* @param options {CookieSerializeOptions} Options for serializing the cookie
* ```ts
* setCookie('Authorization', '1234567')
* ```
*/
function setCookie$1(name, value, options) {
	setCookie(getH3Event(), name, value, options);
}
/**
* Remove a cookie by name.
* @param name Name of the cookie to delete
* @param serializeOptions {CookieSerializeOptions} Cookie options
* ```ts
* deleteCookie('SessionId')
* ```
*/
function deleteCookie$1(name, options) {
	deleteCookie(getH3Event(), name, options);
}
function getResponse() {
	return getH3Event().res;
}
var HEADERS = { TSS_SHELL: "X-TSS_SHELL" };
/**
* @description Returns the router manifest data that should be sent to the client.
* This includes only the assets and preloads for the current route and any
* special assets that are needed for the client. It does not include relationships
* between routes or any other data that is not needed for the client.
*
* @param matchedRoutes - In dev mode, the matched routes are used to build
* the dev styles URL for route-scoped CSS collection.
*/
async function getStartManifest(matchedRoutes) {
	const { tsrStartManifest } = await import("../_tanstack-start-manifest_v-Jqw9klSz.mjs");
	const startManifest = tsrStartManifest();
	let routes = startManifest.routes;
	routes[rootRouteId];
	const manifestRoutes = {};
	for (const k in routes) {
		const v = routes[k];
		const result = {};
		if (v.preloads && v.preloads.length > 0) result.preloads = v.preloads;
		if (v.scripts && v.scripts.length > 0) result.scripts = v.scripts;
		if (v.css?.length) result.css = v.css;
		if (result.preloads || result.scripts || result.css) manifestRoutes[k] = result;
	}
	return {
		...startManifest.scriptFormat ? { scriptFormat: startManifest.scriptFormat } : {},
		...startManifest.inlineCss ? { inlineCss: startManifest.inlineCss } : {},
		routes: manifestRoutes
	};
}
var manifest = {
	"00a8922a9369ba396f51f6c855d55f5c7ea26c6cfbc0152320818a9a67a0cde3": {
		functionName: "ensureLinearMilestonesFn_createServerFn_handler",
		importer: () => import("./linear-fns-CAtm0kma.mjs")
	},
	"00bdfe772d5999ea71dba66eeadb1f612848adb96300600031a337503406e114": {
		functionName: "rotateAutonomyKey_createServerFn_handler",
		importer: () => import("./autonomy-admin-xTLSoTKt.mjs")
	},
	"0197e1077d91b09e480867a7fdf437e69b956fabdd36260654b1f56a9c9a3a85": {
		functionName: "generateThumbnailImageFn_createServerFn_handler",
		importer: () => import("./thumbnails-Clb0nN5X.mjs")
	},
	"01c9cd3d1756230a697d7d9436b3d6f8255f8f1c4af8259c69e1fe1d749ec0d5": {
		functionName: "retrySocialUpload_createServerFn_handler",
		importer: () => import("./social-C52PRdN_.mjs")
	},
	"02489103f887f9df6f7df94b30a6b2743ded3de11be4c2b956f9a98ae083b9d7": {
		functionName: "decideKnowledgeProposalFn_createServerFn_handler",
		importer: () => import("./performance-fns-2bQQiByh.mjs")
	},
	"03c67e4c5f0d96ff66f3a7d0daa42b6c8cb0d615cf798b9addfb16bb5fd1c23c": {
		functionName: "listNotificationsFn_createServerFn_handler",
		importer: () => import("./safety-fns-DBVxkEDV.mjs")
	},
	"047cfcdf86c850aec240aa7d60b7ff7d05e0177734fe0e198543b3b5824dc59c": {
		functionName: "listAddons_createServerFn_handler",
		importer: () => import("./addon-fns-CE9bfRxj.mjs")
	},
	"053cc0676049e96f4733c7480a290140e944e74cb2e3e9a55544d5d2e52328ca": {
		functionName: "generateSuggestedTitles_createServerFn_handler",
		importer: () => import("./client-tools-CDo7GGfk.mjs")
	},
	"05a6e20a33954d0575259efcb43226b95c33c5d707de1945b46b556a12ce324f": {
		functionName: "createSkillFn_createServerFn_handler",
		importer: () => import("./skill-fns-ThWTLUr8.mjs")
	},
	"05e6cdf2224a05e3a01cbf2f253e70f08832ae00e72e8b301304928b8a03e008": {
		functionName: "decideApprovalFn_createServerFn_handler",
		importer: () => import("./safety-fns-DBVxkEDV.mjs")
	},
	"0853cb4ad9da6ecd34f530de4b6985cc4e9caa2c0507c4eb287b60ee2cef74d4": {
		functionName: "getLinearLinkFn_createServerFn_handler",
		importer: () => import("./linear-fns-CAtm0kma.mjs")
	},
	"0a5e0ddad676dccceee79144c78a3d30848ac949d7f0a07eb8815b772494a2d9": {
		functionName: "ingestLibraryFileFn_createServerFn_handler",
		importer: () => import("./library-fns-DNCSvvbl.mjs")
	},
	"0c4dea40ef2609ea73b9f5ad7ce80b441ac0a3f84db7e36afd19eea2a98ad3da": {
		functionName: "getLibraryAssetFn_createServerFn_handler",
		importer: () => import("./library-fns-DNCSvvbl.mjs")
	},
	"0c95c067593e270f2f0a099d4ac074e7a039153aca37148a6aec7cdff868b275": {
		functionName: "proposeKnowledgeFromAssetFn_createServerFn_handler",
		importer: () => import("./performance-fns-2bQQiByh.mjs")
	},
	"0ceadb4d5f1746640981a4699e7ce1792cb6c5227feaa7cccae6f16a7d93e07b": {
		functionName: "listApprovalsFn_createServerFn_handler",
		importer: () => import("./safety-fns-DBVxkEDV.mjs")
	},
	"0e727aea63716fa69b76d7d82f787ebb3edbd0cd92eeaa9df5d00d07dc5a1b6d": {
		functionName: "sendIdeationMessage_createServerFn_handler",
		importer: () => import("./ideation-DcFj0X4D.mjs")
	},
	"16d0b82dab672e3b7b760fe1457cf2abf93adf53da073b0513bc248e1383c30a": {
		functionName: "testLinearFn_createServerFn_handler",
		importer: () => import("./linear-fns-CAtm0kma.mjs")
	},
	"1843d440e87a2cf7b8f9a2f0ea5c69c39eb0bf046b5467ec26943fa2f3af38ee": {
		functionName: "saveMediaSettingsFn_createServerFn_handler",
		importer: () => import("./library-fns-DNCSvvbl.mjs")
	},
	"191b1a3b543f4399187a19fafbc1c72b794868890e2c2699ea24229022f3400e": {
		functionName: "completeFirstLaunch_createServerFn_handler",
		importer: () => import("./integrations-DCpuw-PD.mjs")
	},
	"19e511a5bedb39d9e9ed4337666af46d6a6cb4bd64ab4f19bca88bdbf230a9cd": {
		functionName: "setPortalCanApproveFn_createServerFn_handler",
		importer: () => import("./portal-admin-fns-BALM_2tE.mjs")
	},
	"19ef627d3bdb1dc86750a71bc6c9da61d1fcf9c102122f6bd5160b06a54557b3": {
		functionName: "markPortalNotificationsReadFn_createServerFn_handler",
		importer: () => import("./portal-fns-DgqUOP-u.mjs")
	},
	"1a94fcbb00c217215f984cd9d34c90c71181fea5f154391d666f0669b4817386": {
		functionName: "testPublisherFn_createServerFn_handler",
		importer: () => import("./publisher-fns-ClTLYxmv.mjs")
	},
	"1aee9972e1a1b5f920703bb59d048365226efaee1ddcfaf5e4ce9f30d572ddd4": {
		functionName: "rotateMcpToken_createServerFn_handler",
		importer: () => import("./autonomy-admin-xTLSoTKt.mjs")
	},
	"1b06bc2f1d50513646095115c2fb4faa8d5ccc84db60a7c51109053b4906911d": {
		functionName: "disconnectGrokOAuthFn_createServerFn_handler",
		importer: () => import("./settings-D-5fmHCf.mjs")
	},
	"1b3697949cdd69f8c7f9185b1ea2a53cc66001ea47279c6ff87991c4d0bf8de5": {
		functionName: "getIntegrationsStatus_createServerFn_handler",
		importer: () => import("./integrations-DCpuw-PD.mjs")
	},
	"1b9240b2504378178cc160e867598fdc64dc8bfd1a7d5a7b78343c5eb2d9ae46": {
		functionName: "listSkillRunsFn_createServerFn_handler",
		importer: () => import("./skill-fns-ThWTLUr8.mjs")
	},
	"1bd48d0b42d0aabc0f6b6d9a0ad9e2a0754953b8835bad03cb82e875e63b5126": {
		functionName: "listIdeationThreads_createServerFn_handler",
		importer: () => import("./ideation-DcFj0X4D.mjs")
	},
	"1c68749e67b772a96594be7f3ffb77c7dec71add703e896b7030e79104c16b90": {
		functionName: "assignChannelThreadFn_createServerFn_handler",
		importer: () => import("./channel-fns-B3er1k8n.mjs")
	},
	"1d6b260aae6ac6f63b34b41442364b517f864d99b5319f7e7a44169f1d814b5d": {
		functionName: "listKnowledgeProposalsFn_createServerFn_handler",
		importer: () => import("./performance-fns-2bQQiByh.mjs")
	},
	"203745b6498bdd3898d8151204267c87f6be1c1877d07653cd07f7f2d1a977c5": {
		functionName: "setClientStage_createServerFn_handler",
		importer: () => import("./clients-C2NKmSul.mjs")
	},
	"217356f1237c46a56c2d0b831d8d2212b95aff1b2699aca987297442f30716a3": {
		functionName: "saveOutboundWebhook_createServerFn_handler",
		importer: () => import("./autonomy-admin-xTLSoTKt.mjs")
	},
	"224ddccff6218e81f01ebbf900ce6f23ae6a95d1b979b17ce5fd1e850d9fd743": {
		functionName: "changeOwnPassword_createServerFn_handler",
		importer: () => import("./team-access-DPIAL-82.mjs")
	},
	"23c9e8c426f80a1e9ea259a9f218bd8bf96f81be5fa71e55e60018636d9981fe": {
		functionName: "getLearningPolicyFn_createServerFn_handler",
		importer: () => import("./performance-fns-2bQQiByh.mjs")
	},
	"24f1f64a5ef27f700eff4aea0fa10d297c18273ecde9898006adcc1bd1c85073": {
		functionName: "startAgentRunFn_createServerFn_handler",
		importer: () => import("./agent-fns-BjkKfcmf.mjs")
	},
	"25bd1163acdca4a90c922f1c387cbd8b45f46ddf87932f89f00c8f1899294d4c": {
		functionName: "listPortalActivityFn_createServerFn_handler",
		importer: () => import("./portal-fns-DgqUOP-u.mjs")
	},
	"2650d525a696af6e16df49be37ed974aeef49906c4957f483682c8222e8faa6d": {
		functionName: "getPlaybookPackage_createServerFn_handler",
		importer: () => import("./autonomy-admin-xTLSoTKt.mjs")
	},
	"2813ed329744fd7e1e97a3381d76b88095f3e26be4f4fedb7df9c29a941a2f74": {
		functionName: "ingestStreamClipFn_createServerFn_handler",
		importer: () => import("./library-fns-DNCSvvbl.mjs")
	},
	"2eb20356ef7375d9dfc4fe99136ad461081d9880ee3bda2a717e7b7e14865c19": {
		functionName: "openSocialPlatform_createServerFn_handler",
		importer: () => import("./social-C52PRdN_.mjs")
	},
	"301320a7af95f80f8bbf0a0749626c18674da0dc46ce6fb039dd51a4a887df02": {
		functionName: "setYoutubePublishDefaultsFn_createServerFn_handler",
		importer: () => import("./publisher-fns-ClTLYxmv.mjs")
	},
	"315893f815eee0cf6d0d88e96f294b7ee7bf76a88b224bbe808807460f7b439c": {
		functionName: "markPlaybookPasted_createServerFn_handler",
		importer: () => import("./autonomy-admin-xTLSoTKt.mjs")
	},
	"350e708e65ab01e6f641c4db3d223d03aaf11b448238f149c187522ef60491a2": {
		functionName: "getMediaSettingsFn_createServerFn_handler",
		importer: () => import("./library-fns-DNCSvvbl.mjs")
	},
	"356959323bfab350d2f09a3ecd2e9afe8ae1da101307fba4ac9e7699d218c72a": {
		functionName: "startGrokOAuth_createServerFn_handler",
		importer: () => import("./settings-D-5fmHCf.mjs")
	},
	"35e5a690165a5ac2f48655708627402ac002230b920143e04278725136579c91": {
		functionName: "getSkillFn_createServerFn_handler",
		importer: () => import("./skill-fns-ThWTLUr8.mjs")
	},
	"36a4239799667d7e4c4a0f58cb4948cf75123a3da0ee05cf498fce8b67a84dd0": {
		functionName: "startPublisherOAuthFn_createServerFn_handler",
		importer: () => import("./publisher-fns-ClTLYxmv.mjs")
	},
	"372736f413eb70c2f02ad63c3c0dfeb83416723d83ac2a92bfeab2d3257a2495": {
		functionName: "saveClient_createServerFn_handler",
		importer: () => import("./clients-C2NKmSul.mjs")
	},
	"37ad4f7bcfb156ee6382bd7e2e70c60f2f14c3daa62bb6ae3de4e6ed23938c90": {
		functionName: "getMoneySnapshot_createServerFn_handler",
		importer: () => import("./money-uP_UlduJ.mjs")
	},
	"38d3a5187b6841fd0351444740ddb860d4008a917e269f0829121a2e5d99d07f": {
		functionName: "renameIdeationThread_createServerFn_handler",
		importer: () => import("./ideation-DcFj0X4D.mjs")
	},
	"3990431803cea5a9f827818bb7462199d1173f5e53af7ae273c6a69466aee8bd": {
		functionName: "testRenderFn_createServerFn_handler",
		importer: () => import("./library-fns-DNCSvvbl.mjs")
	},
	"39a85660a3dac203702b5a6e33d2db816d3feb84c915e9deb0e27cfeceb28d87": {
		functionName: "getConnectStatus_createServerFn_handler",
		importer: () => import("./autonomy-admin-xTLSoTKt.mjs")
	},
	"3b2ecd259ba82fff78d662e8ed92b4e731d24a7f4b963eef3e6e4896d9f04955": {
		functionName: "downloadClientAgreement_createServerFn_handler",
		importer: () => import("./onboarding-CLf2k10Z.mjs")
	},
	"3e1d51c0c2987a18eabd87052c8b213b08bbb967ed71564abe5787307576120f": {
		functionName: "rotateWebhookSecret_createServerFn_handler",
		importer: () => import("./autonomy-admin-xTLSoTKt.mjs")
	},
	"409b0b73bcfead3a1fad43abbf032659e99c2af21cc7d7889419852490989bc6": {
		functionName: "ackSocialVmPolicy_createServerFn_handler",
		importer: () => import("./autonomy-admin-xTLSoTKt.mjs")
	},
	"40d717d7faa7e364391652b9a6420cf9b0725fbf000d5eba79ca2e35c6efb7dd": {
		functionName: "getAnalytics_createServerFn_handler",
		importer: () => import("./analytics-DTtlwF85.mjs")
	},
	"43a09b40b158553098de53bb4aa1ac9e2bbc488374fed59faa0fa7890440ad93": {
		functionName: "listSettingsMasked_createServerFn_handler",
		importer: () => import("./settings-D-5fmHCf.mjs")
	},
	"44713627e04a92e8ddcdcbc351dc43690bbd53a6e3fe6b00ef4992fc51f3af7d": {
		functionName: "testOutboundWebhook_createServerFn_handler",
		importer: () => import("./autonomy-admin-xTLSoTKt.mjs")
	},
	"45b6458e1676ad1d3694d9285e4e678ad5a3081432242146c824ffe98dc19b6f": {
		functionName: "retryRenderFn_createServerFn_handler",
		importer: () => import("./library-fns-DNCSvvbl.mjs")
	},
	"47050b57cfbafa392a1cbab11bbdf0a68197a15c97fd5fb5bf9022497cb6097c": {
		functionName: "updateClientNotes_createServerFn_handler",
		importer: () => import("./clients-C2NKmSul.mjs")
	},
	"4708da782d8d6b6cb27c1b40f5215b4b433d4f60d61990e242aaa6643e7e6ba5": {
		functionName: "tagAssetsFn_createServerFn_handler",
		importer: () => import("./library-fns-DNCSvvbl.mjs")
	},
	"473a271b06021773d54bdbcd4da9967197e3ef73a0f6e06968a1fe25a8ec7d11": {
		functionName: "saveLearningPolicyFn_createServerFn_handler",
		importer: () => import("./performance-fns-2bQQiByh.mjs")
	},
	"47458ab7aa6ff01f313d35067ed4b857c94675c8fbedd3d8f39bcaad53af14b2": {
		functionName: "listAuditEventsFn_createServerFn_handler",
		importer: () => import("./safety-fns-DBVxkEDV.mjs")
	},
	"4949676a769c7c7113244ee7bab54e48deefb76e7dd23b2ee5bb51c5bdb83f22": {
		functionName: "setAddonEnabled_createServerFn_handler",
		importer: () => import("./addon-fns-CE9bfRxj.mjs")
	},
	"4b4e35559197e43cd3b7c5771153655836b700d0b8a31e67996bfb54abe1872c": {
		functionName: "setTikTokAuditFn_createServerFn_handler",
		importer: () => import("./publisher-fns-ClTLYxmv.mjs")
	},
	"4e4b107251a43f0ef2db185758939e7b226a609f1f1b6a0781419798b1151799": {
		functionName: "setMemberPassword_createServerFn_handler",
		importer: () => import("./team-access-DPIAL-82.mjs")
	},
	"4f31e7d2ffd9e1f19a1fc425bb8f78cdb27e4e4738729a8f5093f8b0014f7265": {
		functionName: "decidePortalApprovalFn_createServerFn_handler",
		importer: () => import("./portal-fns-DgqUOP-u.mjs")
	},
	"5410f1f97907126c7d58368b6ba6c8c258c56646fbc9ec8d72c65be7eeb45255": {
		functionName: "listClientClipsFn_createServerFn_handler",
		importer: () => import("./library-fns-DNCSvvbl.mjs")
	},
	"54c6a79317bfe61816f7c98a9cb3468ce3565db7ae9c7df96c3810444d11ff29": {
		functionName: "ingestThumbnailFn_createServerFn_handler",
		importer: () => import("./library-fns-DNCSvvbl.mjs")
	},
	"5523341c920fc892e842d23abdbb6bc966401358750de40818bd289b4c3ae036": {
		functionName: "selectInstagramAccountFn_createServerFn_handler",
		importer: () => import("./publisher-fns-ClTLYxmv.mjs")
	},
	"558668c5d61f2cb71c0ca0efe9198ca06fbf960ce6f77426d028aa202496577c": {
		functionName: "signPortalDownloadFn_createServerFn_handler",
		importer: () => import("./portal-fns-DgqUOP-u.mjs")
	},
	"55910e1c8926bbc007bbffd53402a7d003ef47ffdab2a9305f7bc40a507c46b6": {
		functionName: "runDiscordAgentNow_createServerFn_handler",
		importer: () => import("./integrations-DCpuw-PD.mjs")
	},
	"57bf8bcea1615b04def3e036b6188e17ed3114bebc6ceac706d24822ed4bc946": {
		functionName: "recordLoginFn_createServerFn_handler",
		importer: () => import("./safety-fns-DBVxkEDV.mjs")
	},
	"59c80583a26f532c1cc4e5f51e59ff4b7c451b4e107eed7d8b7e32597c5ca19c": {
		functionName: "testResidentialProxyFn_createServerFn_handler",
		importer: () => import("./channel-fns-B3er1k8n.mjs")
	},
	"59d657b3eb698b804782669ad4472e4b0ff57865440b3d1afd3ba38644123628": {
		functionName: "createMemberResetLink_createServerFn_handler",
		importer: () => import("./team-access-DPIAL-82.mjs")
	},
	"5dd37fc6884b66a535ad5532d340696459eb8efb52b8a62bf67fc3e31925084c": {
		functionName: "listThumbnailSessions_createServerFn_handler",
		importer: () => import("./thumbnails-Clb0nN5X.mjs")
	},
	"5dfdfeff7a839d5e33e3bffcf331f216548b6133518befbee8ab4f51af088a79": {
		functionName: "markPaymentPaid_createServerFn_handler",
		importer: () => import("./clients-C2NKmSul.mjs")
	},
	"5fb31e2bc94bd8ae5543852dfccf22b3f98d1d936e57fb3c7c7a03adb0d2acec": {
		functionName: "getSocialSnapshot_createServerFn_handler",
		importer: () => import("./social-C52PRdN_.mjs")
	},
	"5fc058a7f914bdf6ef28435922bf88e869f94dfe791eafed5a1a6aae91fad1a6": {
		functionName: "listWinnersFn_createServerFn_handler",
		importer: () => import("./performance-fns-2bQQiByh.mjs")
	},
	"657fd6ea042a1e042fe696ce55b4825bcaea784c1b21398dbd51dbbabcf40958": {
		functionName: "listAutonomyAudit_createServerFn_handler",
		importer: () => import("./autonomy-admin-xTLSoTKt.mjs")
	},
	"65ecbbcd0fbf7d098beed7070cc0e531ade051e1b13c0ff03df2321f7016fc23": {
		functionName: "sendThumbnailMessage_createServerFn_handler",
		importer: () => import("./thumbnails-Clb0nN5X.mjs")
	},
	"66490721ca794db8b5d8b9cf4883d8b3594668f7572260b693db15d88c23b47e": {
		functionName: "archiveThumbnailSession_createServerFn_handler",
		importer: () => import("./thumbnails-Clb0nN5X.mjs")
	},
	"680304b25c4c66c66d446c1e7a0e1f1b27cc0bf77693bccf8779ccdc58169091": {
		functionName: "portalLogoutFn_createServerFn_handler",
		importer: () => import("./portal-fns-DgqUOP-u.mjs")
	},
	"71043b0f1a254b5f4abc99a00c28523e1ce0295ad6e664e377df789cb1b4c8cf": {
		functionName: "listChannelMessagesFn_createServerFn_handler",
		importer: () => import("./channel-fns-B3er1k8n.mjs")
	},
	"7362edba17c61dce904ca62cbec149654e3be353c09a81762be24f5e31d2136b": {
		functionName: "saveThumbnailOverlay_createServerFn_handler",
		importer: () => import("./thumbnails-Clb0nN5X.mjs")
	},
	"74790204ebaf276017ca70573c20c80bcd1674f6ab972948adedb98291da2515": {
		functionName: "saveLinearBindingFn_createServerFn_handler",
		importer: () => import("./linear-fns-CAtm0kma.mjs")
	},
	"7670f181875d8341c845cca80688f502fc82cb7f674fb7fb0521f97dbd2d7a0e": {
		functionName: "saveManualSnapshot_createServerFn_handler",
		importer: () => import("./analytics-DTtlwF85.mjs")
	},
	"76eb04e4fafa50bba8e4b1d2b107428f39650bb523b880156ffd3186f5369577": {
		functionName: "cancelWorkspaceSubscription_createServerFn_handler",
		importer: () => import("./billing-fns-DSGT27_p.mjs")
	},
	"775bdcfbd6a44f6c5c905f51bf2ef593e540e21ce934b802bb88e64a2aada22f": {
		functionName: "refreshBillingEntitlement_createServerFn_handler",
		importer: () => import("./billing-fns-DSGT27_p.mjs")
	},
	"787e6d38446b68e5437028dc4199cd000b9a50174c1e52f838d75db18168f293": {
		functionName: "listProgress_createServerFn_handler",
		importer: () => import("./clients-C2NKmSul.mjs")
	},
	"78b10d897224704e6fd33023ccd5511378801b19ed00870e83668472721117fc": {
		functionName: "createLinearIssueFn_createServerFn_handler",
		importer: () => import("./linear-fns-CAtm0kma.mjs")
	},
	"78f1786ff20a721be792a018fed67215aec4db0c86a443bf2b2bc70f13e32878": {
		functionName: "generateSuggestedIdeas_createServerFn_handler",
		importer: () => import("./client-tools-CDo7GGfk.mjs")
	},
	"7968d3ca6d2f33b141b26506af8c9a5bbf3807f46b5d4fb58646cd5f7f3ee40e": {
		functionName: "cancelRenderFn_createServerFn_handler",
		importer: () => import("./library-fns-DNCSvvbl.mjs")
	},
	"7a1549fe0868dbfb93cbdf92aa484b5a51a96f98b01f16d5c6f132aca7384436": {
		functionName: "testLlmProvider_createServerFn_handler",
		importer: () => import("./llm-fns-D2HD26uO.mjs")
	},
	"7a5bc5bce12d82d34dfa2416e649f3001a363244f7ee3d10f658094d3b85daec": {
		functionName: "saveLinearApiKeyFn_createServerFn_handler",
		importer: () => import("./linear-fns-CAtm0kma.mjs")
	},
	"7bea6cb94e9a99162736a5aaf41488e014f2ab8d3425305df8eba044bec448b8": {
		functionName: "startThumbnailVariations_createServerFn_handler",
		importer: () => import("./thumbnails-Clb0nN5X.mjs")
	},
	"7f097877adb526fcad469fe2cf906a2a9b99257a517e66b33c0442153db2ef7d": {
		functionName: "updateSocialPostStatus_createServerFn_handler",
		importer: () => import("./social-C52PRdN_.mjs")
	},
	"80f6f4038f1dd0fe020aaf05bd439b452d5cf959dafcfa9e8a8384850f820c40": {
		functionName: "getAutonomyHealth_createServerFn_handler",
		importer: () => import("./autonomy-admin-xTLSoTKt.mjs")
	},
	"817faaa1d68fe19e0ca6c58b583e5193646d2d694bb1bbad6b3d6a896541e06d": {
		functionName: "listThumbnailMessages_createServerFn_handler",
		importer: () => import("./thumbnails-Clb0nN5X.mjs")
	},
	"81f03b51a09adbe96352f4aeb8a10bbb287b1bdf06fb39e6eb4a4ab1fd1a4ee1": {
		functionName: "startBillingCheckout_createServerFn_handler",
		importer: () => import("./billing-fns-DSGT27_p.mjs")
	},
	"8263461a1c62db43a901852ec396ae60e3239478c52f33ea97e4d988cc29e21b": {
		functionName: "listPortalApprovalsFn_createServerFn_handler",
		importer: () => import("./portal-fns-DgqUOP-u.mjs")
	},
	"849808394499fcd764d4263517531e7ddc22b5a9c62e4ab7c994f71a74ce786b": {
		functionName: "refreshPostPerformanceFn_createServerFn_handler",
		importer: () => import("./performance-fns-2bQQiByh.mjs")
	},
	"84e93aa9a4240c380045ee2a2b03d040f71423f1e8e84c8eba0a02080539bf41": {
		functionName: "fetchSessionUser_createServerFn_handler",
		importer: () => import("./session-BkcB4KyB.mjs")
	},
	"8563d5d35eafa88891ee81c8f6fb7007790f0951b760f93f224489c470513872": {
		functionName: "getLlmSnapshot_createServerFn_handler",
		importer: () => import("./llm-fns-D2HD26uO.mjs")
	},
	"858b467421b7f1c053a19393460089888801f3d661537f6e173fca36dca125b9": {
		functionName: "revokeAutonomyKey_createServerFn_handler",
		importer: () => import("./autonomy-admin-xTLSoTKt.mjs")
	},
	"85ffaa66de3c87fa7913f9ba69ef91fa5bf11a8e1b563a7dbcd4d6ad75ba410e": {
		functionName: "savePortalWorkingOnFn_createServerFn_handler",
		importer: () => import("./portal-admin-fns-BALM_2tE.mjs")
	},
	"8616b6192c1497a01fe98d51fca135903f9e5bd856dfcf6b114e9668b3c24217": {
		functionName: "exportCaptionsFn_createServerFn_handler",
		importer: () => import("./library-fns-DNCSvvbl.mjs")
	},
	"8619bd3adb97964ea7c8251e1dc809aedefd6388da5b65bed9b81b6b88921d41": {
		functionName: "listRendersFn_createServerFn_handler",
		importer: () => import("./library-fns-DNCSvvbl.mjs")
	},
	"8937da90f4163299be87bf9d6071bb9fbad2ea3747c6142574ff2e75c72528a9": {
		functionName: "getAutonomySnapshot_createServerFn_handler",
		importer: () => import("./autonomy-admin-xTLSoTKt.mjs")
	},
	"8cd268b64497df1971ccdf2eea2e8d343b39570ec452e3c33d993fbbf6b09534": {
		functionName: "ingestLibraryUrlFn_createServerFn_handler",
		importer: () => import("./library-fns-DNCSvvbl.mjs")
	},
	"8d6c5a2d78184d7c6fcc0ace459f5bb2d1c40838ff54a5a314d2d5d150011169": {
		functionName: "getPortalSettingsFn_createServerFn_handler",
		importer: () => import("./portal-admin-fns-BALM_2tE.mjs")
	},
	"8e06189f183f0d1e17e41a9b36469f29cded5fb1ab3c19ac899e2cc306bc1eee": {
		functionName: "bulkQueueRenderFn_createServerFn_handler",
		importer: () => import("./library-fns-DNCSvvbl.mjs")
	},
	"8e1932d9c7067c2c78dec421c52b0affcb135f81f6b3347bf98cb899b72bc7a4": {
		functionName: "archiveIdeationThread_createServerFn_handler",
		importer: () => import("./ideation-DcFj0X4D.mjs")
	},
	"8e3d1e2c8280dc6e010c59e6935172aba8935f272ad02cc556abb61ed66b532d": {
		functionName: "saveLead_createServerFn_handler",
		importer: () => import("./leads-CIVwufAh.mjs")
	},
	"8e9b7e594033099baf73dba5f2d43d5291800a9dd929fa8de3d58aa63beb61d9": {
		functionName: "skipOutboundConnect_createServerFn_handler",
		importer: () => import("./autonomy-admin-xTLSoTKt.mjs")
	},
	"8eb6279e042004e4a31b7d38e743d9cdcded74ced12181a9a5ada4669d89ef97": {
		functionName: "listPortalUsersFn_createServerFn_handler",
		importer: () => import("./portal-admin-fns-BALM_2tE.mjs")
	},
	"8f96a907679a10e5d6aade6bfb945e1d6ad2d6912566380c71ab94408b8980d6": {
		functionName: "resetKnowledge_createServerFn_handler",
		importer: () => import("./knowledge-Bux7-m4y.mjs")
	},
	"8fb89e0c64b8b41feddf465166602ce13ccc08a3d11497b2cdabe48561846583": {
		functionName: "setSkillEnabledFn_createServerFn_handler",
		importer: () => import("./skill-fns-ThWTLUr8.mjs")
	},
	"910ba37385f0084a821f82b01eefd0ed05023585de5547716963cd681e386d1f": {
		functionName: "invokeSkillFn_createServerFn_handler",
		importer: () => import("./skill-fns-ThWTLUr8.mjs")
	},
	"9129291952b904d01cb761f0a379d8332520438cff67f058961feff347c43b50": {
		functionName: "retryIdeationTurn_createServerFn_handler",
		importer: () => import("./ideation-DcFj0X4D.mjs")
	},
	"9150e93956fa37c2c9f1c4d5c05073e4a034aa80636b3df17605c76fa60b9de3": {
		functionName: "getNotificationPrefsFn_createServerFn_handler",
		importer: () => import("./safety-fns-DBVxkEDV.mjs")
	},
	"91aeaa0ffbf547bf7a0a377199b025c2dee4e8d2da0df41acbbb801953152d7c": {
		functionName: "queueRenderFn_createServerFn_handler",
		importer: () => import("./library-fns-DNCSvvbl.mjs")
	},
	"927bfcb6351f2e63d261670fcd3a9c92e08d887f5e4c4945f3237a999ed123f4": {
		functionName: "getClientBundle_createServerFn_handler",
		importer: () => import("./clients-C2NKmSul.mjs")
	},
	"92ac6dfb8bb8e509397170cced213123922aad0aecabb1cd0d5ab6c61c7cf200": {
		functionName: "saveAutomationSettings_createServerFn_handler",
		importer: () => import("./autonomy-admin-xTLSoTKt.mjs")
	},
	"93b41c206c1ce587af1a5e284786d5281ed5bfb9f064804b3a71e9787208e5cd": {
		functionName: "disconnectLlmProvider_createServerFn_handler",
		importer: () => import("./llm-fns-D2HD26uO.mjs")
	},
	"952a706fe9108b21df8f1bc9a8af27be70e52afe6dd76d02d70a5c1c8c92658d": {
		functionName: "disconnectPublisherFn_createServerFn_handler",
		importer: () => import("./publisher-fns-ClTLYxmv.mjs")
	},
	"968d4fe6ee7915f92bcd90cc89ecfc26697868aa2a33764fff8fd32a2c733c9a": {
		functionName: "listClients_createServerFn_handler",
		importer: () => import("./clients-C2NKmSul.mjs")
	},
	"96d2268ceb5c7f08c297c1bffa97742db439087c7016e6059aa30a4c759980ba": {
		functionName: "summarizeKnowledge_createServerFn_handler",
		importer: () => import("./knowledge-Bux7-m4y.mjs")
	},
	"973efea99e70c5a2838e0a58f78b4139b37082e92eb4b4fda1438ba52da0bc11": {
		functionName: "listClientTraining_createServerFn_handler",
		importer: () => import("./client-tools-CDo7GGfk.mjs")
	},
	"974cf93e7247d3021175a4d1b1ba2d96426f26af3b41ae16e472a0e0a5d68fa7": {
		functionName: "recordManualMetricsFn_createServerFn_handler",
		importer: () => import("./performance-fns-2bQQiByh.mjs")
	},
	"9770f49fbc566f4cb07731964a388650dd54636b1427b41c3753f2ae52a7277e": {
		functionName: "startSocialDesktop_createServerFn_handler",
		importer: () => import("./social-C52PRdN_.mjs")
	},
	"97e84c153f96825b13c896c5f319da64bc37978b32df54d274a4538db1a64084": {
		functionName: "listSkillsFn_createServerFn_handler",
		importer: () => import("./skill-fns-ThWTLUr8.mjs")
	},
	"985414db8ffd3b9ab490df13e88ab680c7e8c5b1ce167fac42442c101d8590e3": {
		functionName: "cancelAgentRunFn_createServerFn_handler",
		importer: () => import("./agent-fns-BjkKfcmf.mjs")
	},
	"99737c9386af68f0eb638407aafdfbb17e5eba191fa9bf951e8a647c0c9cb74e": {
		functionName: "getSocialPublishers_createServerFn_handler",
		importer: () => import("./publisher-fns-ClTLYxmv.mjs")
	},
	"9b22d1674e4c64f0d389589f45dd9c2b0190934f88803a0f4afc3977622fbd17": {
		functionName: "sendClientTraining_createServerFn_handler",
		importer: () => import("./client-tools-CDo7GGfk.mjs")
	},
	"9baaf3fa102e791b58ab6c2892c2cf3b9b48f71ef1dd95160d1a706b45601cb1": {
		functionName: "pollGrokOAuth_createServerFn_handler",
		importer: () => import("./settings-D-5fmHCf.mjs")
	},
	"9cb0ff1195b2cb2ec3c80bb512d3239487e30afc5657a3daed804b845a5beebb": {
		functionName: "testIntegration_createServerFn_handler",
		importer: () => import("./integrations-DCpuw-PD.mjs")
	},
	"9dea2914fb9e4c50cf3cbb70ab0fedd6221e4c73c4b3b20943817db3bb365873": {
		functionName: "revokeTeamLogin_createServerFn_handler",
		importer: () => import("./team-access-DPIAL-82.mjs")
	},
	"9e2d526fe4c83f65e94bb915481bff59ecdb6aa8d44f9fb00a046e7a8ec2cc7d": {
		functionName: "refreshClientAnalysis_createServerFn_handler",
		importer: () => import("./clients-C2NKmSul.mjs")
	},
	"9e5cb7fbeb541c9662c713145e7afb0898841483b109a817488ae3d8e759e27b": {
		functionName: "saveApprovalPolicyFn_createServerFn_handler",
		importer: () => import("./safety-fns-DBVxkEDV.mjs")
	},
	"a30a5ecc7b2c1e9c76761d3905340de83088f613f8fac491cd77d7754cc1ed1d": {
		functionName: "dismissProductOnboarding_createServerFn_handler",
		importer: () => import("./billing-fns-DSGT27_p.mjs")
	},
	"a368f14624cbb579bf8e8e7b80f6c8bd1875230a433723f42865b7679ac1e82c": {
		functionName: "startPortalPreviewFn_createServerFn_handler",
		importer: () => import("./portal-admin-fns-BALM_2tE.mjs")
	},
	"a5bac6be63116f6b17e3334e26b94fff950cef6e326630909f743203f182d218": {
		functionName: "saveCuesFn_createServerFn_handler",
		importer: () => import("./library-fns-DNCSvvbl.mjs")
	},
	"a683379f16e8bd385144b5be62334846eb624848052a2002adfa18a00d850c9c": {
		functionName: "connectChannel_createServerFn_handler",
		importer: () => import("./analytics-DTtlwF85.mjs")
	},
	"a778cecbb615f73f20f7be5cfa8b983d7286a299b6bd6961a4343ad17ae61857": {
		functionName: "setTikTokModeFn_createServerFn_handler",
		importer: () => import("./publisher-fns-ClTLYxmv.mjs")
	},
	"aba98b0758090da28ff10a8baaa43aad33151427296a7035264eed6e318590fd": {
		functionName: "getAiStatus_createServerFn_handler",
		importer: () => import("./clients-C2NKmSul.mjs")
	},
	"ac07431a26759ab6e75248b4ed4d55fd0527afc3a2701f96f0a226760cd0bacf": {
		functionName: "requestPasswordReset_createServerFn_handler",
		importer: () => import("./team-access-DPIAL-82.mjs")
	},
	"ace65608d0ca62e3ffdec87ad94747c0e6ce1df6e764a60ae6d23199b61e2dc5": {
		functionName: "refreshSocialDesktop_createServerFn_handler",
		importer: () => import("./social-C52PRdN_.mjs")
	},
	"ade7c211721ebbf6deb4d810819dea2a05a40fb19060f8d9d2fdd4427aa64f57": {
		functionName: "stopSocialDesktop_createServerFn_handler",
		importer: () => import("./social-C52PRdN_.mjs")
	},
	"ae7ae6312cea5e0906ba5dfcb14d619211ecd764ae07de8de21213ebf854f60b": {
		functionName: "queueSocialUpload_createServerFn_handler",
		importer: () => import("./social-C52PRdN_.mjs")
	},
	"ae80d60eda197e1af917b5372e21bab1ea7a16488118462860d05beebaf7421f": {
		functionName: "activatePortalInviteFn_createServerFn_handler",
		importer: () => import("./portal-fns-DgqUOP-u.mjs")
	},
	"afd76a6f98a111496aa0b0559b7e09b21bedc0f69d04c3c63878cc225082e676": {
		functionName: "regenerateThumbnail_createServerFn_handler",
		importer: () => import("./thumbnails-Clb0nN5X.mjs")
	},
	"b0e72f840c33d1e4116ead6df25316a8c71b93d96e8763829a58f189b8b63fc9": {
		functionName: "saveOpsChannelsFn_createServerFn_handler",
		importer: () => import("./safety-fns-DBVxkEDV.mjs")
	},
	"b1981e49c703bacea43a4c6d2ee4691452ceb78c37c8e3b600ca047abb43c634": {
		functionName: "deleteThumbnailSession_createServerFn_handler",
		importer: () => import("./thumbnails-Clb0nN5X.mjs")
	},
	"b1ef0dd1304a6e90397c0b9dcf2249ba79829b30e9eebe1479a009c4af21dd71": {
		functionName: "archiveAssetFn_createServerFn_handler",
		importer: () => import("./library-fns-DNCSvvbl.mjs")
	},
	"b253bf4bcc06d07005ca9c480444e73d9c9bb84115d5fdcacdf5835723e2fa04": {
		functionName: "createAutonomyKey_createServerFn_handler",
		importer: () => import("./autonomy-admin-xTLSoTKt.mjs")
	},
	"b510f5b1f6600c51a18b832b31d44726caacc99dd9de084e23d4d1c25801095b": {
		functionName: "uploadSrtFn_createServerFn_handler",
		importer: () => import("./library-fns-DNCSvvbl.mjs")
	},
	"b7a825f85dab2cf4967bc257b357b2b7f983d578a71dc77434bf7897f9dd47cb": {
		functionName: "setSuperAdminPassword_createServerFn_handler",
		importer: () => import("./team-access-DPIAL-82.mjs")
	},
	"b95daa34585f5d3e994e959ed9bc2e30c72bd933a751d90055252df5f207088b": {
		functionName: "softDeleteClient_createServerFn_handler",
		importer: () => import("./clients-C2NKmSul.mjs")
	},
	"b980ebd0792217655054ccd6cc8c41ee469f37c3dc91175c477488552b55348a": {
		functionName: "setProductOnboardingStep_createServerFn_handler",
		importer: () => import("./billing-fns-DSGT27_p.mjs")
	},
	"bbb77fc82c862c6754e4292ea9012f7af5bfcbec38bc9de17b8d0b5f4f5a1097": {
		functionName: "saveHiggsfieldCredentials_createServerFn_handler",
		importer: () => import("./settings-D-5fmHCf.mjs")
	},
	"bbd6dca88b88d1d0b53dadc205f52523e283f3e12e2937d547bc1453be92217a": {
		functionName: "createTeamLogin_createServerFn_handler",
		importer: () => import("./team-access-DPIAL-82.mjs")
	},
	"bbed08cef4855935de33a350c23823736454129406477e2a26d3961ded80c031": {
		functionName: "disconnectLinearFn_createServerFn_handler",
		importer: () => import("./linear-fns-CAtm0kma.mjs")
	},
	"bdf569510fdb97140e62af111b4ea7d0da549f4b8e865e181f2935219fa07525": {
		functionName: "analyzeChannel_createServerFn_handler",
		importer: () => import("./clients-C2NKmSul.mjs")
	},
	"bfefb34afd7e0f7b4e3b114da04ae3c2ddd74af6f31e2905de0e61f84851a16b": {
		functionName: "rateThumbnailMessage_createServerFn_handler",
		importer: () => import("./thumbnails-Clb0nN5X.mjs")
	},
	"c016d1c51087302b35a843fe910fec0053937c9a47811b106d0fd375bfe851ab": {
		functionName: "completePasswordReset_createServerFn_handler",
		importer: () => import("./team-access-DPIAL-82.mjs")
	},
	"c1498107105567482c32611a4309fd37f9c9eeadf95b53b721c0801788126e1f": {
		functionName: "saveIntegration_createServerFn_handler",
		importer: () => import("./integrations-DCpuw-PD.mjs")
	},
	"c1c5166b9aef0e93bc069976fd6f059fcc43c20893ce3a6be21f372ba4f0853a": {
		functionName: "generateCaptionsFn_createServerFn_handler",
		importer: () => import("./library-fns-DNCSvvbl.mjs")
	},
	"c1dfe5c40686894ae9aed00fdcdc5778103b62721f7950d748128cff7c1ed3a5": {
		functionName: "savePublisherAppFn_createServerFn_handler",
		importer: () => import("./publisher-fns-ClTLYxmv.mjs")
	},
	"c55b262b31dba118d22bb0835f279988501a9ada405f9faa7f0e600d7b198a59": {
		functionName: "unlockSuperAdmin_createServerFn_handler",
		importer: () => import("./team-access-DPIAL-82.mjs")
	},
	"c60ac9cf25a818025172e83f0ea0538c7b7335bef9fd50b4be0b241fcc47d7b9": {
		functionName: "getPortalHomeFn_createServerFn_handler",
		importer: () => import("./portal-fns-DgqUOP-u.mjs")
	},
	"c77c4bc54c9e2d1f44093135e7d6637a6d5f768871e78209f7dc092b949bd0cc": {
		functionName: "peekPortalInviteFn_createServerFn_handler",
		importer: () => import("./portal-fns-DgqUOP-u.mjs")
	},
	"c7bbea99801283f0fb93e52642de58f737c8d440d38f0567c25f1f2071eee5fb": {
		functionName: "listIdeationMessages_createServerFn_handler",
		importer: () => import("./ideation-DcFj0X4D.mjs")
	},
	"c8151e077ebe7b17a214c87fe096342b570dc1eb694c325e3662752ccc1fde37": {
		functionName: "markPlatformSession_createServerFn_handler",
		importer: () => import("./social-C52PRdN_.mjs")
	},
	"c8a7a2f567ca31bad896359da4f880ee9c9e54729f2537bbe1166063ef258b24": {
		functionName: "fetchTrustedImage_createServerFn_handler",
		importer: () => import("./thumbnails-Clb0nN5X.mjs")
	},
	"c9a7eafe6863a2b88031ad2cdf536708cb42fe2feb63f79574d3d67988fe0a91": {
		functionName: "saveLlmApiKey_createServerFn_handler",
		importer: () => import("./llm-fns-D2HD26uO.mjs")
	},
	"ca3ea92dd652ccb435560128fc3608af4fffce9a5f43e703a30f278553302622": {
		functionName: "softDeleteLead_createServerFn_handler",
		importer: () => import("./leads-CIVwufAh.mjs")
	},
	"caff8614c756e66890afcffa4df47bf6962e5f2ed424f99e9070c573ce181b5d": {
		functionName: "portalLoginFn_createServerFn_handler",
		importer: () => import("./portal-fns-DgqUOP-u.mjs")
	},
	"cb7a4e435c9a8051ab79d3973c76cfe108c1d811310581e663c95773b018ec0c": {
		functionName: "setTikTokDomainFn_createServerFn_handler",
		importer: () => import("./publisher-fns-ClTLYxmv.mjs")
	},
	"ccb9b41f247a11de692d723a4aff76b32ab9fb2db426302da5bf7fa83233fb03": {
		functionName: "cancelSocialUpload_createServerFn_handler",
		importer: () => import("./social-C52PRdN_.mjs")
	},
	"ce907075aa811b7a33b3fbbce9a506aa7cd93e193fe5fa4e03d4ead80b0f7b07": {
		functionName: "listLibraryAssetsFn_createServerFn_handler",
		importer: () => import("./library-fns-DNCSvvbl.mjs")
	},
	"cee5338de188c424e85620cfd1f3ba7e3b44f762305a3bbfc1c49cc1a95aed3f": {
		functionName: "revokePortalUserFn_createServerFn_handler",
		importer: () => import("./portal-admin-fns-BALM_2tE.mjs")
	},
	"cf65b1d00f15bc4ee94b99b26d1e26f60a2199d5e7e5ba2683a30a5b7f840b02": {
		functionName: "invitePortalUserFn_createServerFn_handler",
		importer: () => import("./portal-admin-fns-BALM_2tE.mjs")
	},
	"d0e3d1841310274b49a75af743dd6b116a736e81bf21aedc84ad785b7c3c94fb": {
		functionName: "getLibrarySnapshot_createServerFn_handler",
		importer: () => import("./library-fns-DNCSvvbl.mjs")
	},
	"d144d934a4e6f3569c062651990e27c140a357e105d2caf0d1ba90cca55e46b3": {
		functionName: "elevateToAdmin_createServerFn_handler",
		importer: () => import("./team-access-DPIAL-82.mjs")
	},
	"d19def7c00ec7a687a5d8eea775a0e10a0287193d8673e1828e6482be13a8a46": {
		functionName: "saveYoutubeApiKey_createServerFn_handler",
		importer: () => import("./settings-D-5fmHCf.mjs")
	},
	"d20028d52bf23e06e765fd5f9ef65eb26fe51e974f6e76195c6468d572642b8a": {
		functionName: "listLeads_createServerFn_handler",
		importer: () => import("./leads-CIVwufAh.mjs")
	},
	"d270680d3a91f72c1c0172d5925955b8be5d7574cd6ca08a4b07ad4d6e1a4963": {
		functionName: "getPortalSessionFn_createServerFn_handler",
		importer: () => import("./portal-fns-DgqUOP-u.mjs")
	},
	"d6760d2a159ba071c3d9f7533e41d776fc1794546b92f67153b878069d9b870f": {
		functionName: "saveS3SettingsFn_createServerFn_handler",
		importer: () => import("./library-fns-DNCSvvbl.mjs")
	},
	"d7711e87f3d77a083b60e736ec339692e997e0dcf9eb58c5ffdf92cd30a58f0c": {
		functionName: "setClientOnboardingStep_createServerFn_handler",
		importer: () => import("./clients-C2NKmSul.mjs")
	},
	"d9aee8add62757752f46eee9c75f5420e1eaa99a4bdf2af8bad5654a85df89b7": {
		functionName: "startLinearOAuthFn_createServerFn_handler",
		importer: () => import("./linear-fns-CAtm0kma.mjs")
	},
	"dbab82b8ff52acd6722205c7d6d00930fb79810bdf93995f60d23dcc4127020d": {
		functionName: "getLinearStatusFn_createServerFn_handler",
		importer: () => import("./linear-fns-CAtm0kma.mjs")
	},
	"dc5ce359248374d5dfd2356a69845e9ff3dd7e4f95c6fa561e3847602431ff0a": {
		functionName: "saveLinearOauthAppFn_createServerFn_handler",
		importer: () => import("./linear-fns-CAtm0kma.mjs")
	},
	"dcdcb1a7db5f110ae35233db57058e24b0396ea1c1267361d9fae60310563cdc": {
		functionName: "getProductOnboarding_createServerFn_handler",
		importer: () => import("./billing-fns-DSGT27_p.mjs")
	},
	"debd65317af61d579247b8e78f08141c3f9e097787de887fd1d6e5eb00d10380": {
		functionName: "listTeamLogins_createServerFn_handler",
		importer: () => import("./team-access-DPIAL-82.mjs")
	},
	"df20774bd6d8daebd588091d43e3558a3241e973e8bb1aaeff6c03b9368ed7f4": {
		functionName: "getBillingSnapshot_createServerFn_handler",
		importer: () => import("./billing-fns-DSGT27_p.mjs")
	},
	"e14294d870943b9e8aa1effe6852bd1c42c1fb4d33c3d6f20e76d3ebaae195a9": {
		functionName: "saveNotificationPrefsFn_createServerFn_handler",
		importer: () => import("./safety-fns-DBVxkEDV.mjs")
	},
	"e2168e4c3356eb148f143cfb07c325220358c36885e945d967db5ffd14bac7cd": {
		functionName: "getSupabaseStatus_createServerFn_handler",
		importer: () => import("./settings-D-5fmHCf.mjs")
	},
	"e324ef90b1450b502109118a9618e32fc13b94e0bfbdf76fab60a9335ae0253f": {
		functionName: "saveLlmRouter_createServerFn_handler",
		importer: () => import("./llm-fns-D2HD26uO.mjs")
	},
	"e40ef17a58079a1223552dacb50e4740953660e08588390c89e939c786f5b042": {
		functionName: "getPerformanceSnapshot_createServerFn_handler",
		importer: () => import("./performance-fns-2bQQiByh.mjs")
	},
	"e460bc4a70baad75efa0cd56ee3d670e6e3f2c4af7712c74321b32ed88ab2e6e": {
		functionName: "approveSkillFn_createServerFn_handler",
		importer: () => import("./skill-fns-ThWTLUr8.mjs")
	},
	"e5ca62b54f5272b2c9f0fcd7b5bf10f60a0cc36bdcc24532e7db1fe5e8a13c0c": {
		functionName: "deleteIdeationThread_createServerFn_handler",
		importer: () => import("./ideation-DcFj0X4D.mjs")
	},
	"ea85aa34917a3e967f99c47d77de42f0822348ba11558a0dbee4b72f707cf5e0": {
		functionName: "getAgentRunFn_createServerFn_handler",
		importer: () => import("./agent-fns-BjkKfcmf.mjs")
	},
	"eabe09fa712c53084c5ae8a43ff0fc123daebab19d18c42c301b848ff5e25b14": {
		functionName: "listKnowledgeEntries_createServerFn_handler",
		importer: () => import("./knowledge-Bux7-m4y.mjs")
	},
	"ec7a20dad7215fd0f06e0f2be5450ab590be2aa8973061ec565cdb5b1eec8a28": {
		functionName: "provisionLocationProxyFn_createServerFn_handler",
		importer: () => import("./social-C52PRdN_.mjs")
	},
	"ee227c40ee73ffb5d45160021271d79eafd24706e7d614d01dd215cbcc142e83": {
		functionName: "pullAnalytics_createServerFn_handler",
		importer: () => import("./analytics-DTtlwF85.mjs")
	},
	"eefd455d5edc448f24b54784500b1a8e00d3cee087d09166fa3a792f9072ad76": {
		functionName: "loadLinearCatalogFn_createServerFn_handler",
		importer: () => import("./linear-fns-CAtm0kma.mjs")
	},
	"ef85fe61cbbb9a48cf3212dd2b22627329d757471890937dc56aab57b5d2dd4c": {
		functionName: "installAddonManifest_createServerFn_handler",
		importer: () => import("./addon-fns-CE9bfRxj.mjs")
	},
	"efd8a6244c76959f3fbacce3abf26b3807497709ec56dc0a58fd544daa34c399": {
		functionName: "disconnectIntegration_createServerFn_handler",
		importer: () => import("./integrations-DCpuw-PD.mjs")
	},
	"f0cf4f2f50e802a2af7e9d4bc5f9a399e02e844fcc1b10708ffbabb4be1335f1": {
		functionName: "renameThumbnailSession_createServerFn_handler",
		importer: () => import("./thumbnails-Clb0nN5X.mjs")
	},
	"f0e704f0e15911f71899de547f8b035c1195ac38d03394583835daccdcd57744": {
		functionName: "listAgentRunsFn_createServerFn_handler",
		importer: () => import("./agent-fns-BjkKfcmf.mjs")
	},
	"f1a8f8b902745b590ceaa37de1a8529367441158cbb685c5bf9df3fc820917f7": {
		functionName: "getSafetyInbox_createServerFn_handler",
		importer: () => import("./safety-fns-DBVxkEDV.mjs")
	},
	"f1d19845aa50f64cb4a4d6c07f100cabf48f3bda58558335ba32f4a07e8c188f": {
		functionName: "sendTrainingMessage_createServerFn_handler",
		importer: () => import("./knowledge-Bux7-m4y.mjs")
	},
	"f1f56c71e95fee9159870dde446fbc86ef641d336cc35175540b43898d03889a": {
		functionName: "sendChannelMessageFn_createServerFn_handler",
		importer: () => import("./channel-fns-B3er1k8n.mjs")
	},
	"f23e54a9689407f4165876f04173ad73903216201dbdd840cc3b972b62a63bd4": {
		functionName: "listLinearLinksFn_createServerFn_handler",
		importer: () => import("./linear-fns-CAtm0kma.mjs")
	},
	"f2aff30be45c2f1f4046ddb1633b4c3a8f314b2da10134b681ab5fc55acc4dce": {
		functionName: "savePortalSettingsFn_createServerFn_handler",
		importer: () => import("./portal-admin-fns-BALM_2tE.mjs")
	},
	"f2da04d1a306ba905e469e0bcef79f5c1e1231f20c1d14b56bb9253bedaddb12": {
		functionName: "tagIdeationThread_createServerFn_handler",
		importer: () => import("./ideation-DcFj0X4D.mjs")
	},
	"f42b98229e88b5ea16fb41fe8662de85bd30fab27e6e1f5b958d99492e640f72": {
		functionName: "getChannelsSnapshotFn_createServerFn_handler",
		importer: () => import("./channel-fns-B3er1k8n.mjs")
	},
	"f7a2af6a7b1d8f002d3de16445f39a8ed50718ed27fea5dd00f29b71872abf5b": {
		functionName: "saveIpfsSettingsFn_createServerFn_handler",
		importer: () => import("./library-fns-DNCSvvbl.mjs")
	},
	"f9201786784d0a723bec795004aabc9ad70ddaafef125627836f2399fc91b60d": {
		functionName: "markNotificationsReadFn_createServerFn_handler",
		importer: () => import("./safety-fns-DBVxkEDV.mjs")
	},
	"f96a5625f7a1989a1d6e3d665f1e1129656137bd22abfe941a4374f64662fde3": {
		functionName: "createHermesPresetKey_createServerFn_handler",
		importer: () => import("./autonomy-admin-xTLSoTKt.mjs")
	},
	"fdbf6d2c03c186b5ab81dc215f4f0412bf127569932ebc55b83e27ec46e6d675": {
		functionName: "getSafetySettingsFn_createServerFn_handler",
		importer: () => import("./safety-fns-DBVxkEDV.mjs")
	},
	"febf66707a7511a756ce24503cb8ab9a05cd98a1c9df71f9df7fbcb95f059b49": {
		functionName: "listPortalAssetsFn_createServerFn_handler",
		importer: () => import("./portal-fns-DgqUOP-u.mjs")
	}
};
async function getServerFnById(id, access) {
	const serverFnInfo = manifest[id];
	if (!serverFnInfo) throw new Error("Server function info not found for " + id);
	const fnModule = serverFnInfo.module ?? await serverFnInfo.importer();
	if (!fnModule) throw new Error("Server function module not resolved for " + id);
	const action = fnModule[serverFnInfo.functionName];
	if (!action) throw new Error("Server function module export not resolved for serverFn ID: " + id);
	return action;
}
var TSS_FORMDATA_CONTEXT = "__TSS_CONTEXT";
var TSS_SERVER_FUNCTION = Symbol.for("TSS_SERVER_FUNCTION");
var TSS_SERVER_FUNCTION_FACTORY = Symbol.for("TSS_SERVER_FUNCTION_FACTORY");
var X_TSS_SERIALIZED = "x-tss-serialized";
var X_TSS_RAW_RESPONSE = "x-tss-raw";
/** Content-Type for multiplexed framed responses (RawStream support) */
var TSS_CONTENT_TYPE_FRAMED = "application/x-tss-framed";
/**
* Frame types for binary multiplexing protocol.
*/
var FrameType = {
	/** Seroval JSON chunk (NDJSON line) */
	JSON: 0,
	/** Raw stream data chunk */
	CHUNK: 1,
	/** Raw stream end (EOF) */
	END: 2,
	/** Raw stream error */
	ERROR: 3
};
/** Full Content-Type header value with version parameter */
var TSS_CONTENT_TYPE_FRAMED_VERSIONED = `${TSS_CONTENT_TYPE_FRAMED}; v=1`;
function isSafeKey(key) {
	return key !== "__proto__" && key !== "constructor" && key !== "prototype";
}
/**
* Merge target and source into a new null-proto object, filtering dangerous keys.
*/
function safeObjectMerge(target, source) {
	const result = Object.create(null);
	if (target) {
		for (const key of Object.keys(target)) if (isSafeKey(key)) result[key] = target[key];
	}
	if (source && typeof source === "object") {
		for (const key of Object.keys(source)) if (isSafeKey(key)) result[key] = source[key];
	}
	return result;
}
/**
* Create a null-prototype object, optionally copying from source.
*/
function createNullProtoObject(source) {
	if (!source) return Object.create(null);
	const obj = Object.create(null);
	for (const key of Object.keys(source)) if (isSafeKey(key)) obj[key] = source[key];
	return obj;
}
var GLOBAL_STORAGE_KEY = Symbol.for("tanstack-start:start-storage-context");
var globalObj = globalThis;
if (!globalObj[GLOBAL_STORAGE_KEY]) globalObj[GLOBAL_STORAGE_KEY] = new AsyncLocalStorage();
var startStorage = globalObj[GLOBAL_STORAGE_KEY];
async function runWithStartContext(context, fn) {
	return startStorage.run(context, fn);
}
function getStartContext(opts) {
	const context = startStorage.getStore();
	if (!context && opts?.throwIfNotFound !== false) throw new Error(`No Start context found in AsyncLocalStorage. Make sure you are using the function within the server runtime.`);
	return context;
}
var getStartOptions = () => getStartContext().startOptions;
var getStartContextServerOnly = getStartContext;
var createServerFn = (options, __opts) => {
	const resolvedOptions = __opts || options || {};
	if (typeof resolvedOptions.method === "undefined") resolvedOptions.method = "GET";
	const setValidator = (validator) => {
		return createServerFn(void 0, {
			...resolvedOptions,
			validator,
			inputValidator: validator
		});
	};
	const res = {
		options: resolvedOptions,
		middleware: (middleware) => {
			const newMiddleware = [...resolvedOptions.middleware || []];
			middleware.map((m) => {
				if (TSS_SERVER_FUNCTION_FACTORY in m) {
					if (m.options.middleware) newMiddleware.push(...m.options.middleware);
				} else newMiddleware.push(m);
			});
			const res = createServerFn(void 0, {
				...resolvedOptions,
				middleware: newMiddleware
			});
			res[TSS_SERVER_FUNCTION_FACTORY] = true;
			return res;
		},
		validator: setValidator,
		inputValidator: setValidator,
		handler: (...args) => {
			const [extractedFn, serverFn] = args;
			const newOptions = {
				...resolvedOptions,
				extractedFn,
				serverFn
			};
			const resolvedMiddleware = [...newOptions.middleware || [], serverFnBaseToMiddleware(newOptions)];
			extractedFn.method = resolvedOptions.method;
			return Object.assign(async (opts) => {
				const result = await executeMiddleware$1(resolvedMiddleware, "client", {
					...extractedFn,
					...newOptions,
					data: opts?.data,
					headers: opts?.headers,
					signal: opts?.signal,
					fetch: opts?.fetch,
					context: createNullProtoObject()
				});
				const redirect = parseRedirect(result.error);
				if (redirect) throw redirect;
				if (result.error) throw result.error;
				return result.result;
			}, {
				...extractedFn,
				method: resolvedOptions.method,
				__executeServer: async (opts) => {
					const startContext = getStartContextServerOnly();
					const serverContextAfterGlobalMiddlewares = startContext.contextAfterGlobalMiddlewares;
					return await executeMiddleware$1(resolvedMiddleware, "server", {
						...extractedFn,
						...opts,
						serverFnMeta: extractedFn.serverFnMeta,
						context: safeObjectMerge(opts.context, serverContextAfterGlobalMiddlewares),
						request: startContext.request
					}).then((d) => ({
						result: d.result,
						error: d.error,
						context: d.sendContext
					}));
				}
			});
		}
	};
	const fun = (options) => {
		return createServerFn(void 0, {
			...resolvedOptions,
			...options
		});
	};
	return Object.assign(fun, res);
};
async function executeMiddleware$1(middlewares, env, opts) {
	let flattenedMiddlewares = flattenMiddlewares([...getStartOptions()?.functionMiddleware || [], ...middlewares]);
	if (env === "server") {
		const startContext = getStartContextServerOnly({ throwIfNotFound: false });
		if (startContext?.executedRequestMiddlewares) flattenedMiddlewares = flattenedMiddlewares.filter((m) => !startContext.executedRequestMiddlewares.has(m));
	}
	const callNextMiddleware = async (ctx) => {
		const nextMiddleware = flattenedMiddlewares.shift();
		if (!nextMiddleware) return ctx;
		try {
			let validator = "validator" in nextMiddleware.options ? nextMiddleware.options.validator : void 0;
			if (!validator && "inputValidator" in nextMiddleware.options) validator = nextMiddleware.options.inputValidator;
			if (validator && env === "server") ctx.data = await execValidator(validator, ctx.data);
			let middlewareFn = void 0;
			if (env === "client") {
				if ("client" in nextMiddleware.options) middlewareFn = nextMiddleware.options.client;
			} else if ("server" in nextMiddleware.options) middlewareFn = nextMiddleware.options.server;
			if (middlewareFn) {
				const userNext = async (userCtx = {}) => {
					const result = await callNextMiddleware({
						...ctx,
						...userCtx,
						context: safeObjectMerge(ctx.context, userCtx.context),
						sendContext: safeObjectMerge(ctx.sendContext, userCtx.sendContext),
						headers: mergeHeaders(ctx.headers, userCtx.headers),
						_callSiteFetch: ctx._callSiteFetch,
						fetch: ctx._callSiteFetch ?? userCtx.fetch ?? ctx.fetch,
						result: userCtx.result !== void 0 ? userCtx.result : userCtx instanceof Response ? userCtx : ctx.result,
						error: userCtx.error ?? ctx.error
					});
					if (result.error) throw result.error;
					return result;
				};
				const result = await middlewareFn({
					...ctx,
					next: userNext
				});
				if (isRedirect(result)) return {
					...ctx,
					error: result
				};
				if (result instanceof Response) return {
					...ctx,
					result
				};
				if (!result) throw new Error("User middleware returned undefined. You must call next() or return a result in your middlewares.");
				return result;
			}
			return callNextMiddleware(ctx);
		} catch (error) {
			return {
				...ctx,
				error
			};
		}
	};
	return callNextMiddleware({
		...opts,
		headers: opts.headers || {},
		sendContext: opts.sendContext || {},
		context: opts.context || createNullProtoObject(),
		_callSiteFetch: opts.fetch
	});
}
function flattenMiddlewares(middlewares, maxDepth = 100) {
	const seen = /* @__PURE__ */ new Set();
	const flattened = [];
	const recurse = (middleware, depth) => {
		if (depth > maxDepth) throw new Error(`Middleware nesting depth exceeded maximum of ${maxDepth}. Check for circular references.`);
		middleware.forEach((m) => {
			if (m.options.middleware) recurse(m.options.middleware, depth + 1);
			if (!seen.has(m)) {
				seen.add(m);
				flattened.push(m);
			}
		});
	};
	recurse(middlewares, 0);
	return flattened;
}
async function execValidator(validator, input) {
	if (validator == null) return {};
	if ("~standard" in validator) {
		const result = await validator["~standard"].validate(input);
		if (result.issues) throw new Error(JSON.stringify(result.issues, void 0, 2));
		return result.value;
	}
	if ("parse" in validator) return validator.parse(input);
	if (typeof validator === "function") return validator(input);
	throw new Error("Invalid validator type!");
}
function serverFnBaseToMiddleware(options) {
	return {
		"~types": void 0,
		options: {
			inputValidator: options.validator ?? options.inputValidator,
			client: async ({ next, sendContext, fetch, ...ctx }) => {
				const payload = {
					...ctx,
					context: sendContext,
					fetch
				};
				return next(await options.extractedFn?.(payload));
			},
			server: async ({ next, ...ctx }) => {
				const result = await options.serverFn?.(ctx);
				return next({
					...ctx,
					result
				});
			}
		}
	};
}
var createMiddleware = (options, __opts) => {
	const resolvedOptions = {
		type: "request",
		...__opts || options
	};
	const setValidator = (validator) => {
		return createMiddleware({}, Object.assign(resolvedOptions, {
			validator,
			inputValidator: validator
		}));
	};
	return {
		options: resolvedOptions,
		middleware: (middleware) => {
			return createMiddleware({}, Object.assign(resolvedOptions, { middleware }));
		},
		validator: setValidator,
		inputValidator: setValidator,
		client: (client) => {
			return createMiddleware({}, Object.assign(resolvedOptions, { client }));
		},
		server: (server) => {
			return createMiddleware({}, Object.assign(resolvedOptions, { server }));
		}
	};
};
var innerCreateCsrfMiddleware = (opts = {}) => {
	return createMiddleware().server(async (ctx) => {
		const csrfCtx = ctx;
		if (opts.filter && !await opts.filter(csrfCtx)) return ctx.next();
		if (await isCsrfRequestAllowed(opts, csrfCtx)) return ctx.next();
		return getFailureResponse(opts, csrfCtx);
	});
};
var createCsrfMiddleware = innerCreateCsrfMiddleware;
async function isCsrfRequestAllowed(opts, ctx) {
	const result = await getCsrfRequestValidationResult(opts, ctx);
	return result === true || result === void 0 && opts.allowRequestsWithoutOriginCheck === true;
}
async function getCsrfRequestValidationResult(opts, ctx) {
	const fetchSite = ctx.request.headers.get("Sec-Fetch-Site");
	if (fetchSite !== null) return matchValue(opts.secFetchSite ?? "same-origin", fetchSite, ctx);
	const origin = ctx.request.headers.get("Origin");
	if (origin !== null) {
		if (opts.origin) return matchValue(opts.origin, origin, ctx);
		return origin === new URL(ctx.request.url).origin;
	}
	const referer = ctx.request.headers.get("Referer");
	if (referer === null || opts.referer === false) return;
	if (typeof opts.referer === "function") return opts.referer(referer, ctx);
	if (opts.origin) {
		const refererOrigin = getOriginFromUrl(referer);
		return refererOrigin !== void 0 && matchValue(opts.origin, refererOrigin, ctx);
	}
	return isRefererSameOrigin(referer, new URL(ctx.request.url).origin);
}
async function matchValue(matcher, value, ctx) {
	if (typeof matcher === "function") return matcher(value, ctx);
	if (Array.isArray(matcher)) return matcher.includes(value);
	return value === matcher;
}
function getOriginFromUrl(url) {
	try {
		return new URL(url).origin;
	} catch {
		return;
	}
}
function isRefererSameOrigin(referer, requestOrigin) {
	if (referer === requestOrigin) return true;
	if (!referer.startsWith(requestOrigin)) return false;
	if (referer.length === requestOrigin.length) return true;
	const code = referer.charCodeAt(requestOrigin.length);
	return code === 47 || code === 63 || code === 35;
}
async function getFailureResponse(opts, ctx) {
	if (typeof opts.failureResponse === "function") return opts.failureResponse(ctx);
	return opts.failureResponse?.clone() ?? new Response("Forbidden", { status: 403 });
}
function getDefaultSerovalPlugins() {
	return [...(getStartOptions()?.serializationAdapters)?.map(makeSerovalPlugin) ?? [], ...defaultSerovalPlugins];
}
/**
* Binary frame protocol for multiplexing JSON and raw streams over HTTP.
*
* Frame format: [type:1][streamId:4][length:4][payload:length]
* - type: 1 byte - frame type (JSON, CHUNK, END, ERROR)
* - streamId: 4 bytes big-endian uint32 - stream identifier
* - length: 4 bytes big-endian uint32 - payload length
* - payload: variable length bytes
*/
/** Cached TextEncoder for frame encoding */
var textEncoder = new TextEncoder();
/** Shared empty payload for END frames - avoids allocation per call */
var EMPTY_PAYLOAD = /* @__PURE__ */ new Uint8Array(0);
/**
* Encodes a single frame with header and payload.
*/
function encodeFrame(type, streamId, payload) {
	const frame = new Uint8Array(9 + payload.length);
	frame[0] = type;
	frame[1] = streamId >>> 24 & 255;
	frame[2] = streamId >>> 16 & 255;
	frame[3] = streamId >>> 8 & 255;
	frame[4] = streamId & 255;
	frame[5] = payload.length >>> 24 & 255;
	frame[6] = payload.length >>> 16 & 255;
	frame[7] = payload.length >>> 8 & 255;
	frame[8] = payload.length & 255;
	frame.set(payload, 9);
	return frame;
}
/**
* Encodes a JSON frame (type 0, streamId 0).
*/
function encodeJSONFrame(json) {
	return encodeFrame(FrameType.JSON, 0, textEncoder.encode(json));
}
/**
* Encodes a raw stream chunk frame.
*/
function encodeChunkFrame(streamId, chunk) {
	return encodeFrame(FrameType.CHUNK, streamId, chunk);
}
/**
* Encodes a raw stream end frame.
*/
function encodeEndFrame(streamId) {
	return encodeFrame(FrameType.END, streamId, EMPTY_PAYLOAD);
}
/**
* Encodes a raw stream error frame.
*/
function encodeErrorFrame(streamId, error) {
	const message = error instanceof Error ? error.message : String(error ?? "Unknown error");
	return encodeFrame(FrameType.ERROR, streamId, textEncoder.encode(message));
}
/**
* Creates a multiplexed ReadableStream from JSON stream and raw streams.
*
* The JSON stream emits NDJSON lines (from seroval's toCrossJSONStream).
* Raw streams are pumped concurrently, interleaved with JSON frames.
*
* Supports late stream registration for RawStreams discovered after initial
* serialization (e.g., from resolved Promises).
*
* @param jsonStream Stream of JSON strings (each string is one NDJSON line)
* @param rawStreams Map of stream IDs to raw binary streams (known at start)
* @param lateStreamSource Optional stream of late registrations for streams discovered later
*/
function createMultiplexedStream(jsonStream, rawStreams, lateStreamSource) {
	let controller;
	let cancelled = false;
	const readers = [];
	const enqueue = (frame) => {
		if (cancelled) return false;
		try {
			controller.enqueue(frame);
			return true;
		} catch {
			return false;
		}
	};
	const errorOutput = (error) => {
		if (cancelled) return;
		cancelled = true;
		try {
			controller.error(error);
		} catch {}
		for (const reader of readers) reader.cancel().catch(() => {});
	};
	async function pumpRawStream(streamId, stream) {
		const reader = stream.getReader();
		readers.push(reader);
		try {
			while (!cancelled) {
				const { done, value } = await reader.read();
				if (done) {
					enqueue(encodeEndFrame(streamId));
					return;
				}
				if (!enqueue(encodeChunkFrame(streamId, value))) return;
			}
		} catch (error) {
			enqueue(encodeErrorFrame(streamId, error));
		} finally {
			reader.releaseLock();
		}
	}
	async function pumpJSON() {
		const reader = jsonStream.getReader();
		readers.push(reader);
		try {
			while (!cancelled) {
				const { done, value } = await reader.read();
				if (done) return;
				if (!enqueue(encodeJSONFrame(value))) return;
			}
		} catch (error) {
			errorOutput(error);
			throw error;
		} finally {
			reader.releaseLock();
		}
	}
	async function pumpLateStreams() {
		if (!lateStreamSource) return [];
		const lateStreamPumps = [];
		const reader = lateStreamSource.getReader();
		readers.push(reader);
		try {
			while (!cancelled) {
				const { done, value } = await reader.read();
				if (done) break;
				lateStreamPumps.push(pumpRawStream(value.id, value.stream));
			}
		} finally {
			reader.releaseLock();
		}
		return lateStreamPumps;
	}
	return new ReadableStream({
		async start(ctrl) {
			controller = ctrl;
			const pumps = [pumpJSON()];
			for (const [streamId, stream] of rawStreams) pumps.push(pumpRawStream(streamId, stream));
			if (lateStreamSource) pumps.push(pumpLateStreams());
			try {
				const latePumps = (await Promise.all(pumps)).find(Array.isArray);
				if (latePumps && latePumps.length > 0) await Promise.all(latePumps);
				if (!cancelled) try {
					controller.close();
				} catch {}
			} catch {}
		},
		cancel() {
			cancelled = true;
			for (const reader of readers) reader.cancel().catch(() => {});
			readers.length = 0;
		}
	});
}
var serovalPlugins = void 0;
var FORM_DATA_CONTENT_TYPES = ["multipart/form-data", "application/x-www-form-urlencoded"];
var MAX_PAYLOAD_SIZE = 1e6;
var handleServerAction = async ({ request, context, serverFnId }) => {
	const methodUpper = request.method.toUpperCase();
	const url = new URL(request.url);
	const action = await getServerFnById(serverFnId, { origin: "client" });
	if (action.method && methodUpper !== action.method) return new Response(`expected ${action.method} method. Got ${methodUpper}`, {
		status: 405,
		headers: { Allow: action.method }
	});
	const isServerFn = request.headers.get("x-tsr-serverFn") === "true";
	if (!serovalPlugins) serovalPlugins = getDefaultSerovalPlugins();
	const contentType = request.headers.get("Content-Type");
	function parsePayload(payload) {
		return fromJSON(payload, { plugins: serovalPlugins });
	}
	return await (async () => {
		try {
			let res = await (async () => {
				if (FORM_DATA_CONTENT_TYPES.some((type) => contentType && contentType.includes(type))) {
					if (methodUpper === "GET") invariant();
					const formData = await request.formData();
					const serializedContext = formData.get(TSS_FORMDATA_CONTEXT);
					formData.delete(TSS_FORMDATA_CONTEXT);
					const params = {
						context,
						data: formData,
						method: methodUpper
					};
					if (typeof serializedContext === "string") try {
						const deserializedContext = fromJSON(JSON.parse(serializedContext), { plugins: serovalPlugins });
						if (typeof deserializedContext === "object" && deserializedContext) params.context = safeObjectMerge(deserializedContext, context);
					} catch (e) {}
					return await action(params);
				}
				if (methodUpper === "GET") {
					const payloadParam = url.searchParams.get("payload");
					if (payloadParam && payloadParam.length > MAX_PAYLOAD_SIZE) throw new Error("Payload too large");
					const payload = payloadParam ? parsePayload(JSON.parse(payloadParam)) : {};
					payload.context = safeObjectMerge(payload.context, context);
					payload.method = methodUpper;
					return await action(payload);
				}
				let jsonPayload;
				if (contentType?.includes("application/json")) jsonPayload = await request.json();
				const payload = jsonPayload ? parsePayload(jsonPayload) : {};
				payload.context = safeObjectMerge(payload.context, context);
				payload.method = methodUpper;
				return await action(payload);
			})();
			const unwrapped = res.result || res.error;
			if (isNotFound(res)) res = isNotFoundResponse(res);
			if (!isServerFn) return unwrapped;
			if (unwrapped instanceof Response) {
				if (isRedirect(unwrapped)) return unwrapped;
				unwrapped.headers.set(X_TSS_RAW_RESPONSE, "true");
				return unwrapped;
			}
			return serializeResult(res);
			function serializeResult(res) {
				let nonStreamingBody = void 0;
				const alsResponse = getResponse();
				if (res !== void 0) {
					const rawStreams = /* @__PURE__ */ new Map();
					let initialPhase = true;
					let lateStreamWriter;
					let lateStreamReadable = void 0;
					const pendingLateStreams = [];
					const plugins = [createRawStreamRPCPlugin((id, stream) => {
						if (initialPhase) {
							rawStreams.set(id, stream);
							return;
						}
						if (lateStreamWriter) {
							lateStreamWriter.write({
								id,
								stream
							}).catch(() => {});
							return;
						}
						pendingLateStreams.push({
							id,
							stream
						});
					}), ...serovalPlugins || []];
					let done = false;
					const callbacks = {
						onParse: (value) => {
							nonStreamingBody = value;
						},
						onDone: () => {
							done = true;
						},
						onError: (error) => {
							throw error;
						}
					};
					toCrossJSONStream(res, {
						refs: /* @__PURE__ */ new Map(),
						plugins,
						onParse(value) {
							callbacks.onParse(value);
						},
						onDone() {
							callbacks.onDone();
						},
						onError: (error) => {
							callbacks.onError(error);
						}
					});
					initialPhase = false;
					if (done && rawStreams.size === 0) return new Response(nonStreamingBody ? JSON.stringify(nonStreamingBody) : void 0, {
						status: alsResponse.status,
						statusText: alsResponse.statusText,
						headers: {
							"Content-Type": "application/json",
							[X_TSS_SERIALIZED]: "true"
						}
					});
					const { readable, writable } = new TransformStream();
					lateStreamReadable = readable;
					lateStreamWriter = writable.getWriter();
					for (const registration of pendingLateStreams) lateStreamWriter.write(registration).catch(() => {});
					pendingLateStreams.length = 0;
					const multiplexedStream = createMultiplexedStream(new ReadableStream({
						start(controller) {
							callbacks.onParse = (value) => {
								controller.enqueue(JSON.stringify(value) + "\n");
							};
							callbacks.onDone = () => {
								try {
									controller.close();
								} catch {}
								lateStreamWriter?.close().catch(() => {}).finally(() => {
									lateStreamWriter = void 0;
								});
							};
							callbacks.onError = (error) => {
								controller.error(error);
								lateStreamWriter?.abort(error).catch(() => {}).finally(() => {
									lateStreamWriter = void 0;
								});
							};
							if (nonStreamingBody !== void 0) callbacks.onParse(nonStreamingBody);
							if (done) callbacks.onDone();
						},
						cancel() {
							lateStreamWriter?.abort().catch(() => {});
							lateStreamWriter = void 0;
						}
					}), rawStreams, lateStreamReadable);
					return new Response(multiplexedStream, {
						status: alsResponse.status,
						statusText: alsResponse.statusText,
						headers: {
							"Content-Type": TSS_CONTENT_TYPE_FRAMED_VERSIONED,
							[X_TSS_SERIALIZED]: "true"
						}
					});
				}
				return new Response(void 0, {
					status: alsResponse.status,
					statusText: alsResponse.statusText
				});
			}
		} catch (error) {
			if (error instanceof Response) return error;
			if (isNotFound(error)) return isNotFoundResponse(error);
			console.info();
			console.info("Server Fn Error!");
			console.info();
			console.error(error);
			console.info();
			const serializedError = JSON.stringify(await Promise.resolve(toCrossJSONAsync(error, {
				refs: /* @__PURE__ */ new Map(),
				plugins: serovalPlugins
			})));
			const response = getResponse();
			return new Response(serializedError, {
				status: response.status ?? 500,
				statusText: response.statusText,
				headers: {
					"Content-Type": "application/json",
					[X_TSS_SERIALIZED]: "true"
				}
			});
		}
	})();
};
function isNotFoundResponse(error) {
	const { headers, ...rest } = error;
	return new Response(JSON.stringify(rest), {
		status: 404,
		headers: {
			"Content-Type": "application/json",
			...headers || {}
		}
	});
}
var LINK_PARAM_TOKEN_RE = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
var PRELOAD_AS_VALUES = /* @__PURE__ */ new Set([
	"fetch",
	"font",
	"image",
	"script",
	"style",
	"track"
]);
function buildLinkParam(name, value) {
	if (value === void 0) return name;
	if (LINK_PARAM_TOKEN_RE.test(value)) return `${name}=${value}`;
	return `${name}=${JSON.stringify(value)}`;
}
function serializeEarlyHint(hint) {
	const parts = [`<${hint.href}>`, buildLinkParam("rel", hint.rel)];
	if (hint.as) parts.push(buildLinkParam("as", hint.as));
	if (hint.crossOrigin !== void 0) parts.push(buildLinkParam("crossorigin", hint.crossOrigin || void 0));
	if (hint.type) parts.push(buildLinkParam("type", hint.type));
	if (hint.integrity) parts.push(buildLinkParam("integrity", hint.integrity));
	if (hint.referrerPolicy) parts.push(buildLinkParam("referrerpolicy", hint.referrerPolicy));
	if (hint.fetchPriority) parts.push(buildLinkParam("fetchpriority", hint.fetchPriority));
	return parts.join("; ");
}
function getStringAttr(attrs, name, fallbackName) {
	const value = attrs?.[name] ?? (fallbackName ? attrs?.[fallbackName] : void 0);
	return typeof value === "string" ? value : void 0;
}
function getPreloadAs(attrs) {
	const as = getStringAttr(attrs, "as");
	return as && PRELOAD_AS_VALUES.has(as) ? as : void 0;
}
function addEarlyHintFetchAttrs(hint, attrs) {
	const crossOrigin = getStringAttr(attrs, "crossOrigin", "crossorigin");
	const type = getStringAttr(attrs, "type");
	const integrity = getStringAttr(attrs, "integrity");
	const referrerPolicy = getStringAttr(attrs, "referrerPolicy", "referrerpolicy");
	const fetchPriority = getStringAttr(attrs, "fetchPriority", "fetchpriority");
	if (crossOrigin !== void 0) hint.crossOrigin = crossOrigin;
	if (type) hint.type = type;
	if (integrity) hint.integrity = integrity;
	if (referrerPolicy) hint.referrerPolicy = referrerPolicy;
	if (fetchPriority) hint.fetchPriority = fetchPriority;
}
function linkAttrsToEarlyHint(attrs) {
	const href = getStringAttr(attrs, "href");
	const rel = getStringAttr(attrs, "rel");
	if (!href || !rel) return void 0;
	const relTokens = rel.split(/\s+/);
	let hintRel;
	let hintAs;
	if (relTokens.includes("modulepreload")) {
		hintRel = "modulepreload";
		hintAs = "script";
	} else if (relTokens.includes("stylesheet")) {
		hintRel = "preload";
		hintAs = "style";
	} else if (relTokens.includes("preload")) {
		hintAs = getPreloadAs(attrs);
		if (!hintAs) return void 0;
		hintRel = "preload";
	} else if (relTokens.includes("preconnect")) {
		hintRel = "preconnect";
		hintAs = void 0;
	} else if (relTokens.includes("dns-prefetch")) {
		hintRel = "dns-prefetch";
		hintAs = void 0;
	}
	if (!hintRel) return void 0;
	const hint = {
		href,
		rel: hintRel
	};
	if (hintAs) hint.as = hintAs;
	addEarlyHintFetchAttrs(hint, attrs);
	return hint;
}
function collectStaticHintsFromManifest(manifest, matchedRoutes) {
	const hints = [];
	for (const route of matchedRoutes) {
		const routeManifest = manifest.routes[route.id];
		if (!routeManifest) continue;
		for (const link of routeManifest.preloads ?? []) {
			const attrs = getScriptPreloadAttrs(manifest, link);
			const hint = {
				href: attrs.href,
				rel: attrs.rel,
				as: "script"
			};
			if (attrs.crossOrigin !== void 0) hint.crossOrigin = attrs.crossOrigin;
			hints.push(hint);
		}
		for (const link of routeManifest.css ?? []) {
			const stylesheetHref = getStylesheetHref(link);
			if (manifest.inlineCss?.styles[stylesheetHref] !== void 0) continue;
			const resolvedLink = resolveManifestCssLink(link);
			const hint = {
				href: stylesheetHref,
				rel: "preload",
				as: "style"
			};
			if (resolvedLink.crossOrigin !== void 0) hint.crossOrigin = resolvedLink.crossOrigin;
			hints.push(hint);
		}
	}
	return hints;
}
function collectDynamicHintsFromMatches(matches) {
	const hints = [];
	for (const match of matches) {
		const links = match.links;
		if (!Array.isArray(links)) continue;
		for (const link of links) {
			const hint = linkAttrsToEarlyHint(link);
			if (hint) hints.push(hint);
		}
	}
	return hints;
}
function createEarlyHintsEvent(opts) {
	const nextHints = [];
	const nextLinks = [];
	for (const hint of opts.hints) {
		const link = serializeEarlyHint(hint);
		if (opts.sentLinks.has(link)) continue;
		opts.sentLinks.add(link);
		opts.sentHints.push(hint);
		nextHints.push(hint);
		nextLinks.push(link);
	}
	if (!nextHints.length && opts.phase !== "dynamic") return void 0;
	return {
		phase: opts.phase,
		hints: nextHints,
		links: nextLinks,
		allHints: opts.sentHints.slice(),
		allLinks: Array.from(opts.sentLinks)
	};
}
function createResponseLinkHeaderEntries(opts) {
	for (const hint of opts.hints) {
		const link = serializeEarlyHint(hint);
		if (opts.sentLinks.has(link)) continue;
		opts.sentLinks.add(link);
		opts.entries.push({
			phase: opts.phase,
			hint,
			link
		});
	}
}
function getResponseLinkHeaderEntries(opts) {
	if (!opts.filter) return opts.entries.map((entry) => entry.link);
	try {
		const links = [];
		for (const entry of opts.entries) if (opts.filter(entry)) links.push(entry.link);
		return links;
	} catch (err) {
		console.error("Error filtering response Link headers:", err);
		return [];
	}
}
function notifyEarlyHints(phase, event, onEarlyHints) {
	try {
		const result = onEarlyHints(event);
		if (result) Promise.resolve(result).catch((err) => {
			console.error(`Error sending ${phase} early hints:`, err);
		});
	} catch (err) {
		console.error(`Error sending ${phase} early hints:`, err);
	}
}
function getResponseLinkHeaderFilter(responseLinkHeader) {
	if (typeof responseLinkHeader !== "object") return;
	return responseLinkHeader.filter;
}
function appendResponseLinkHeaders(opts) {
	for (const link of getResponseLinkHeaderEntries(opts)) opts.responseHeaders.append("Link", link);
}
function collectResponseLinkHeaderEntries(opts) {
	for (let index = 0; index < opts.event.hints.length; index++) opts.entries.push({
		phase: opts.phase,
		hint: opts.event.hints[index],
		link: opts.event.links[index]
	});
}
function collectEarlyHintsPhase(opts) {
	const event = opts.onEarlyHints ? createEarlyHintsEvent({
		phase: opts.phase,
		hints: opts.hints,
		sentLinks: opts.sentLinks,
		sentHints: opts.sentHints
	}) : void 0;
	if (event) notifyEarlyHints(opts.phase, event, opts.onEarlyHints);
	if (!opts.responseLinkHeaderEntries) return;
	if (event) {
		collectResponseLinkHeaderEntries({
			phase: opts.phase,
			event,
			entries: opts.responseLinkHeaderEntries
		});
		return;
	}
	createResponseLinkHeaderEntries({
		phase: opts.phase,
		hints: opts.hints,
		sentLinks: opts.sentLinks,
		entries: opts.responseLinkHeaderEntries
	});
}
function createEarlyHintsCollector(opts) {
	if (!opts?.onEarlyHints && !opts?.responseLinkHeader) return;
	const sentLinks = /* @__PURE__ */ new Set();
	const sentHints = opts.onEarlyHints ? new Array() : void 0;
	const responseLinkHeaderEntries = opts.responseLinkHeader ? new Array() : void 0;
	const responseLinkHeaderFilter = getResponseLinkHeaderFilter(opts.responseLinkHeader);
	return {
		collectStatic: ({ manifest, matchedRoutes }) => {
			if (!matchedRoutes?.length) return;
			collectEarlyHintsPhase({
				phase: "static",
				hints: collectStaticHintsFromManifest(manifest, matchedRoutes),
				sentLinks,
				sentHints,
				onEarlyHints: opts.onEarlyHints,
				responseLinkHeaderEntries
			});
		},
		collectDynamic: (matches) => {
			collectEarlyHintsPhase({
				phase: "dynamic",
				hints: collectDynamicHintsFromMatches(matches),
				sentLinks,
				sentHints,
				onEarlyHints: opts.onEarlyHints,
				responseLinkHeaderEntries
			});
		},
		appendResponseHeaders: (headers) => {
			if (!responseLinkHeaderEntries?.length) return;
			appendResponseLinkHeaders({
				responseHeaders: headers,
				entries: responseLinkHeaderEntries,
				filter: responseLinkHeaderFilter
			});
		}
	};
}
function normalizeTransformAssetResult(result) {
	if (typeof result === "string") return { href: result };
	return result;
}
function escapeCssString(value) {
	return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\a ").replace(/\r/g, "\\d ").replace(/\f/g, "\\c ");
}
async function transformInlineCssTemplate(options) {
	const { strings, urls } = options.template;
	if (strings.length !== urls.length + 1) throw new Error(`TanStack Start inlineCss template for ${options.stylesheetHref} is invalid`);
	let css = strings[0];
	for (let index = 0; index < urls.length; index++) {
		const transformed = normalizeTransformAssetResult(await options.transformFn({
			kind: "css-url",
			url: urls[index],
			stylesheetHref: options.stylesheetHref
		}));
		css += escapeCssString(transformed.href) + strings[index + 1];
	}
	return css;
}
async function transformInlineCssStyles(inlineCss, transformFn) {
	const transformedStyles = {};
	const transformedEntries = await Promise.all(Object.entries(inlineCss.styles).map(async ([stylesheetHref, css]) => {
		const template = inlineCss.templates?.[stylesheetHref];
		return [stylesheetHref, template ? await transformInlineCssTemplate({
			stylesheetHref,
			template,
			transformFn
		}) : css];
	}));
	for (const [stylesheetHref, css] of transformedEntries) transformedStyles[stylesheetHref] = css;
	return {
		styles: transformedStyles,
		...inlineCss.templates ? { templates: inlineCss.templates } : {}
	};
}
function resolveTransformAssetsCrossOrigin(config, kind) {
	if (!config) return void 0;
	if (typeof config === "string") return config;
	return config[kind];
}
function isObjectShorthand(transform) {
	return "prefix" in transform;
}
function resolveTransformAssetsConfig(transform) {
	if (typeof transform === "string") {
		const prefix = transform;
		return {
			type: "transform",
			transformFn: ({ url }) => ({ href: `${prefix}${url}` }),
			cache: true
		};
	}
	if (typeof transform === "function") return {
		type: "transform",
		transformFn: transform,
		cache: true
	};
	if (isObjectShorthand(transform)) {
		const { prefix, crossOrigin } = transform;
		return {
			type: "transform",
			transformFn: ({ url, kind }) => {
				const href = `${prefix}${url}`;
				if (kind === "css-url") return { href };
				const co = resolveTransformAssetsCrossOrigin(crossOrigin, kind);
				return co ? {
					href,
					crossOrigin: co
				} : { href };
			},
			cache: true
		};
	}
	if ("createTransform" in transform && transform.createTransform) return {
		type: "createTransform",
		createTransform: transform.createTransform,
		cache: transform.cache !== false
	};
	return {
		type: "transform",
		transformFn: typeof transform.transform === "string" ? (({ url }) => ({ href: `${transform.transform}${url}` })) : transform.transform,
		cache: transform.cache !== false
	};
}
function assignManifestLink(link, next) {
	if (typeof link === "string") return next.crossOrigin ? next : next.href;
	const nextLink = {
		...link,
		href: next.href
	};
	if (next.crossOrigin) nextLink.crossOrigin = next.crossOrigin;
	else delete nextLink.crossOrigin;
	return nextLink;
}
async function transformManifestAssets(source, transformFn, _opts) {
	const manifest = structuredClone(source);
	const inlineCssEnabled = _opts?.inlineCss !== false;
	const scriptTransforms = /* @__PURE__ */ new Map();
	const transformScript = (url) => {
		const cached = scriptTransforms.get(url);
		if (cached) return cached;
		const transformed = Promise.resolve(transformFn({
			url,
			kind: "script"
		})).then(normalizeTransformAssetResult);
		scriptTransforms.set(url, transformed);
		return transformed;
	};
	if (!inlineCssEnabled) delete manifest.inlineCss;
	else if (manifest.inlineCss) manifest.inlineCss = await transformInlineCssStyles(manifest.inlineCss, transformFn);
	for (const route of Object.values(manifest.routes)) {
		if (route.preloads?.length) route.preloads = await Promise.all(route.preloads.map(async (link) => {
			const result = await transformScript(resolveManifestAssetLink(link).href);
			return assignManifestLink(link, {
				href: result.href,
				crossOrigin: result.crossOrigin
			});
		}));
		if (route.css?.length && !manifest.inlineCss) route.css = await Promise.all(route.css.map(async (link) => {
			const result = normalizeTransformAssetResult(await transformFn({
				url: resolveManifestCssLink(link).href,
				kind: "stylesheet"
			}));
			return assignManifestLink(link, {
				href: result.href,
				crossOrigin: result.crossOrigin
			});
		}));
		if (route.scripts?.length) for (const script of route.scripts) {
			const src = script.attrs?.src;
			if (typeof src !== "string") continue;
			const result = await transformScript(src);
			script.attrs = {
				...script.attrs,
				src: result.href
			};
			if (result.crossOrigin) script.attrs.crossOrigin = result.crossOrigin;
			else delete script.attrs.crossOrigin;
		}
	}
	return manifest;
}
/**
* Builds a final ServerManifest without URL transforms. Used when no
* transformAssets option is provided.
*
* Returns a new manifest object so the cached base manifest is never mutated.
*/
function buildManifest(source, opts) {
	return {
		...source.scriptFormat ? { scriptFormat: source.scriptFormat } : {},
		...opts?.inlineCss !== false && source.inlineCss ? { inlineCss: structuredClone(source.inlineCss) } : {},
		routes: { ...source.routes }
	};
}
function getStaticHandlerInlineCssDefault(handlerInlineCss) {
	if (typeof handlerInlineCss === "function") return;
	return handlerInlineCss ?? true;
}
async function resolveInlineCssForRequest(opts) {
	if (opts.requestInlineCss !== void 0) return opts.requestInlineCss;
	if (typeof opts.handlerInlineCss === "function") return await opts.handlerInlineCss({ request: opts.request });
	return opts.handlerInlineCss ?? true;
}
function createCachedBaseManifestLoader(loadBaseManifest) {
	let baseManifestPromise;
	return () => {
		if (!baseManifestPromise) baseManifestPromise = loadBaseManifest().catch((error) => {
			baseManifestPromise = void 0;
			throw error;
		});
		return baseManifestPromise;
	};
}
function createFinalManifestTransformResolver(transformAssets, opts) {
	const transformConfig = transformAssets !== void 0 ? resolveTransformAssetsConfig(transformAssets) : void 0;
	const cache = transformConfig ? transformConfig.cache : true;
	const warmup = !!transformAssets && typeof transformAssets === "object" && "warmup" in transformAssets && transformAssets.warmup === true;
	let cachedCreateTransformPromise;
	const clearCachedCreateTransform = () => {
		cachedCreateTransformPromise = void 0;
	};
	return {
		cache,
		warmup,
		clearCachedCreateTransform,
		getTransformFn: async (ctx) => {
			if (!transformConfig) return void 0;
			if (transformConfig.type !== "createTransform") return transformConfig.transformFn;
			if (!cache || !opts.cacheCreateTransform) return transformConfig.createTransform(ctx);
			if (!cachedCreateTransformPromise) cachedCreateTransformPromise = Promise.resolve(transformConfig.createTransform(ctx)).catch((error) => {
				clearCachedCreateTransform();
				throw error;
			});
			return cachedCreateTransformPromise;
		}
	};
}
function createFinalManifestResolver(opts) {
	const finalManifestCache = /* @__PURE__ */ new Map();
	const transformResolver = createFinalManifestTransformResolver(opts.transformAssets, { cacheCreateTransform: opts.cacheCreateTransform });
	const handlerDefaultInlineCss = getStaticHandlerInlineCssDefault(opts.inlineCss);
	const getRequestManifestOptions = async (requestOpts) => {
		const transformFn = await transformResolver.getTransformFn({
			warmup: false,
			request: requestOpts.request
		});
		const inlineCss = await resolveInlineCssForRequest({
			request: requestOpts.request,
			handlerInlineCss: opts.inlineCss,
			requestInlineCss: requestOpts.requestInlineCss
		});
		return {
			getBaseManifest: requestOpts.getBaseManifest,
			transformFn,
			cache: transformResolver.cache,
			inlineCss
		};
	};
	const resolveRequest = async (requestOpts, cache) => {
		return resolveFinalManifest({
			...await getRequestManifestOptions(requestOpts),
			finalManifestCache: cache
		});
	};
	return {
		warmup: ({ getBaseManifest }) => warmupFinalManifest({
			enabled: transformResolver.warmup,
			handlerDefaultInlineCss,
			cache: transformResolver.cache,
			finalManifestCache,
			getBaseManifest,
			getTransformFn: () => transformResolver.getTransformFn({ warmup: true }),
			onError: transformResolver.clearCachedCreateTransform
		}),
		resolveCached: (requestOpts) => resolveRequest(requestOpts, finalManifestCache),
		resolveUncached: (requestOpts) => resolveRequest(requestOpts, void 0)
	};
}
function getFinalManifestCacheKey(inlineCss) {
	return inlineCss ? "inline-css" : "linked-css";
}
function cacheFinalManifestPromise(cachedFinalManifestPromises, cacheKey, promise) {
	const cachedFinalManifestPromise = promise.catch((error) => {
		if (cachedFinalManifestPromises.get(cacheKey) === cachedFinalManifestPromise) cachedFinalManifestPromises.delete(cacheKey);
		throw error;
	});
	cachedFinalManifestPromises.set(cacheKey, cachedFinalManifestPromise);
	return cachedFinalManifestPromise;
}
function getOrCreateCachedFinalManifestPromise(cachedFinalManifestPromises, cacheKey, computeFinalManifest) {
	const cachedFinalManifestPromise = cachedFinalManifestPromises.get(cacheKey);
	if (cachedFinalManifestPromise) return cachedFinalManifestPromise;
	return cacheFinalManifestPromise(cachedFinalManifestPromises, cacheKey, Promise.resolve().then(computeFinalManifest));
}
async function buildFinalManifest(opts) {
	return opts.transformFn ? await transformManifestAssets(opts.base, opts.transformFn, { inlineCss: opts.inlineCss }) : buildManifest(opts.base, { inlineCss: opts.inlineCss });
}
async function resolveFinalManifest(opts) {
	const computeFinalManifest = async () => {
		return buildFinalManifest({
			base: await opts.getBaseManifest(),
			transformFn: opts.transformFn,
			inlineCss: opts.inlineCss
		});
	};
	if (opts.finalManifestCache && (!opts.transformFn || opts.cache)) return getOrCreateCachedFinalManifestPromise(opts.finalManifestCache, getFinalManifestCacheKey(opts.inlineCss), computeFinalManifest);
	return computeFinalManifest();
}
function warmupFinalManifest(opts) {
	if (!opts.enabled || opts.handlerDefaultInlineCss === void 0 || !opts.cache) return;
	const inlineCss = opts.handlerDefaultInlineCss;
	const warmupPromise = getOrCreateCachedFinalManifestPromise(opts.finalManifestCache, getFinalManifestCacheKey(inlineCss), async () => {
		const [base, transformFn] = await Promise.all([opts.getBaseManifest(), opts.getTransformFn()]);
		return buildFinalManifest({
			base,
			transformFn,
			inlineCss
		});
	});
	if (opts.onError) warmupPromise.catch(opts.onError);
	return warmupPromise;
}
var ServerFunctionSerializationAdapter = createSerializationAdapter({
	key: "$TSS/serverfn",
	test: (v) => {
		if (typeof v !== "function") return false;
		if (!(TSS_SERVER_FUNCTION in v)) return false;
		return !!v[TSS_SERVER_FUNCTION];
	},
	toSerializable: ({ serverFnMeta }) => ({ functionId: serverFnMeta.id }),
	fromSerializable: ({ functionId }) => {
		const fn = async (opts, signal) => {
			return (await (await getServerFnById(functionId, { origin: "client" }))(opts ?? {}, signal)).result;
		};
		return fn;
	}
});
function getStartResponseHeaders(opts) {
	return mergeHeaders({ "Content-Type": "text/html; charset=utf-8" }, ..._getRenderedMatches(opts.router.stores.matches.get()).map((match) => {
		return match.headers;
	}));
}
var entriesPromise;
var defaultCsrfMiddleware = createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" });
var getCachedBaseManifest = createCachedBaseManifestLoader(() => getStartManifest());
var getProdBaseManifest = () => getCachedBaseManifest();
var getBaseManifest = getProdBaseManifest;
var createEarlyHintsForRequest = createEarlyHintsCollector;
async function loadEntries() {
	const [routerEntry, startEntry, pluginAdapters] = await Promise.all([
		import("./router-DRtNPEcw.mjs").then((n) => n.t),
		import("./start-5Z2QO8AU.mjs"),
		import("./empty-plugin-adapters-D9UWiqvJ.mjs")
	]);
	return {
		routerEntry,
		startEntry,
		pluginAdapters
	};
}
function getEntries() {
	if (!entriesPromise) entriesPromise = loadEntries();
	return entriesPromise;
}
var ROUTER_BASEPATH = "/";
var SERVER_FN_BASE = "/_serverFn/";
var IS_PRERENDERING = process.env.TSS_PRERENDERING === "true";
var IS_SHELL_ENV = process.env.TSS_SHELL === "true";
var IS_DEV = false;
var ERR_NO_RESPONSE = IS_DEV ? `It looks like you forgot to return a response from your server route handler. If you want to defer to the app router, make sure to have a component set in this route.` : "Internal Server Error";
var ERR_NO_DEFER = IS_DEV ? `You cannot defer to the app router if there is no component defined on this route.` : "Internal Server Error";
function throwRouteHandlerError() {
	throw new Error(ERR_NO_RESPONSE);
}
function throwIfMayNotDefer() {
	throw new Error(ERR_NO_DEFER);
}
/**
* Check if a value is a special response (Response or Redirect)
*/
function isSpecialResponse(value) {
	return value instanceof Response || isRedirect(value);
}
/**
* Normalize middleware result to context shape
*/
function handleCtxResult(result) {
	if (isSsrResponse(result) || isSpecialResponse(result)) return { response: result };
	return result;
}
function disposeLateResponse(result, signal) {
	const response = handleCtxResult(result)?.response;
	if (isSsrResponse(response) || isSpecialResponse(response)) disposeSsrResponseDetached(response, signal.reason);
}
function isSignalAborted(signal) {
	return signal.aborted;
}
/**
* Execute a middleware chain
*/
async function executeMiddleware(middlewares, ctx, signal) {
	let index = -1;
	let streamResponse;
	let retiredStreamIdentities;
	const isResponseAlias = (candidate, response) => candidate === response || candidate instanceof Response && response.body !== null && candidate.body === response.body;
	const setResponse = (response) => {
		if (isSsrResponse(response)) {
			if (response.serverSsrCleanup === "stream") streamResponse = response;
			ctx.response = response.response;
			return;
		}
		ctx.response = response;
	};
	const disposeStreamResponse = async (reason) => {
		const response = streamResponse;
		if (!response) return;
		streamResponse = void 0;
		retiredStreamIdentities ??= /* @__PURE__ */ new WeakSet();
		retiredStreamIdentities.add(response.response);
		if (response.response.body) retiredStreamIdentities.add(response.response.body);
		const currentResponse = ctx.response;
		if (isResponseAlias(currentResponse, response.response)) ctx.response = void 0;
		await response.dispose(reason);
	};
	const disposeAbandonedResult = (result) => {
		const exposed = handleCtxResult(result)?.response;
		const response = isSsrResponse(exposed) ? exposed.response : exposed;
		if (streamResponse && isResponseAlias(response, streamResponse.response)) {
			disposeStreamResponse(signal.reason).catch(console.error);
			return;
		}
		if (response instanceof Response && retiredStreamIdentities && (retiredStreamIdentities.has(response) || response.body !== null && retiredStreamIdentities.has(response.body))) return;
		disposeLateResponse(result, signal);
	};
	const getFinalResponse = async () => {
		const response = ctx.response;
		if (!response) throwRouteHandlerError();
		if (!streamResponse) return response;
		if (response === streamResponse.response) return streamResponse;
		if (streamResponse.response.body !== null && response.body === streamResponse.response.body) return {
			...streamResponse,
			response
		};
		await disposeStreamResponse("middleware response replaced");
		return response;
	};
	let nextPromise;
	function next(nextCtx) {
		const result = runNext(nextCtx);
		nextPromise = result;
		return result;
	}
	async function runNext(nextCtx) {
		if (signal.aborted) throw signal.reason;
		if (nextCtx) {
			if (nextCtx.context) ctx.context = safeObjectMerge(ctx.context, nextCtx.context);
			for (const key of Object.keys(nextCtx)) if (key === "response") setResponse(nextCtx.response);
			else if (key !== "context") ctx[key] = nextCtx[key];
		}
		index++;
		const middleware = middlewares[index];
		if (!middleware) return ctx;
		let result;
		try {
			const pending = middleware({
				...ctx,
				next
			});
			if (pending === nextPromise) {
				nextPromise = void 0;
				result = await pending;
				if (isSignalAborted(signal)) {
					disposeAbandonedResult(result);
					throw signal.reason;
				}
			} else result = await waitForRequest(pending, signal, disposeAbandonedResult);
		} catch (err) {
			if (isSignalAborted(signal)) throw signal.reason;
			if (isSpecialResponse(err)) {
				setResponse(err);
				return ctx;
			}
			throw err;
		}
		const normalized = handleCtxResult(result);
		if (normalized) {
			if (normalized.response !== void 0) setResponse(normalized.response);
			if (normalized.context) ctx.context = safeObjectMerge(ctx.context, normalized.context);
		}
		return ctx;
	}
	try {
		await runNext();
		const response = await waitForRequest(getFinalResponse(), signal, disposeAbandonedResult);
		if (signal.aborted) {
			disposeAbandonedResult(response);
			throw signal.reason;
		}
		return {
			ctx,
			response
		};
	} catch (err) {
		const disposal = disposeStreamResponse(signal.aborted ? signal.reason : err);
		if (signal.aborted) disposal.catch(console.error);
		else await disposal;
		throw err;
	}
}
/**
* Wrap a route handler as middleware
*/
function handlerToMiddleware(handler, mayDefer = false) {
	if (mayDefer) return handler;
	return async (ctx) => {
		const response = await handler({
			...ctx,
			next: throwIfMayNotDefer
		});
		if (!response) throwRouteHandlerError();
		return response;
	};
}
/**
* Creates the TanStack Start request handler.
*
* @example Backwards-compatible usage (handler callback only):
* ```ts
* export default createStartHandler(defaultStreamHandler)
* ```
*
* @example With CDN URL rewriting:
* ```ts
* export default createStartHandler({
*   handler: defaultStreamHandler,
*   transformAssets: 'https://cdn.example.com',
* })
* ```
*
* @example With per-request URL rewriting:
* ```ts
* export default createStartHandler({
*   handler: defaultStreamHandler,
*   transformAssets: {
*     transform: ({ url }) => {
*       const cdnBase = getRequest().headers.get('x-cdn-base') || ''
*       return { href: `${cdnBase}${url}` }
*     },
*     cache: false,
*   },
* })
* ```
*/
function createStartHandler(cbOrOptions) {
	const handlerOptions = typeof cbOrOptions === "function" ? {} : cbOrOptions;
	const cb = typeof cbOrOptions === "function" ? cbOrOptions : cbOrOptions.handler;
	const finalManifestResolver = createFinalManifestResolver({
		...handlerOptions,
		cacheCreateTransform: true
	});
	const resolveManifestForRequest = finalManifestResolver.resolveCached;
	finalManifestResolver.warmup({ getBaseManifest: () => getBaseManifest(void 0) });
	const startRequestResolver = async (request, requestOpts) => {
		let router = null;
		let responseOwnsCleanup = false;
		try {
			request.signal.throwIfAborted();
			const { url, handledProtocolRelativeURL } = getNormalizedURL(request.url);
			const href = url.pathname + url.search + url.hash;
			const origin = getOrigin(request);
			if (handledProtocolRelativeURL) return Response.redirect(url, 308);
			const entries = await waitForRequest(getEntries(), request.signal);
			const hasStartInstance = !!entries.startEntry.startInstance;
			const startOptions = await waitForRequest(entries.startEntry.startInstance?.getOptions(), request.signal) || {};
			const { hasPluginAdapters, pluginSerializationAdapters } = entries.pluginAdapters;
			const serializationAdapters = [
				...startOptions.serializationAdapters || [],
				...hasPluginAdapters ? pluginSerializationAdapters : [],
				ServerFunctionSerializationAdapter
			];
			const requestStartOptions = {
				...startOptions,
				requestMiddleware: hasStartInstance ? startOptions.requestMiddleware : [defaultCsrfMiddleware],
				serializationAdapters
			};
			const flattenedRequestMiddlewares = requestStartOptions.requestMiddleware ? flattenMiddlewares(requestStartOptions.requestMiddleware) : [];
			const executedRequestMiddlewares = new Set(flattenedRequestMiddlewares);
			const getRouter = async () => {
				if (router) return router;
				router = await waitForRequest(entries.routerEntry.getRouter(), request.signal);
				let isShell = IS_SHELL_ENV;
				if (IS_PRERENDERING && !isShell) isShell = request.headers.get(HEADERS.TSS_SHELL) === "true";
				const history = createMemoryHistory({ initialEntries: [href] });
				router.update({
					history,
					isShell,
					isPrerendering: IS_PRERENDERING,
					origin: router.options.origin ?? origin,
					defaultSsr: requestStartOptions.defaultSsr,
					serializationAdapters: [...requestStartOptions.serializationAdapters, ...router.options.serializationAdapters || []],
					basepath: ROUTER_BASEPATH
				});
				return router;
			};
			if (SERVER_FN_BASE && url.pathname.startsWith(SERVER_FN_BASE)) {
				const serverFnId = url.pathname.slice(SERVER_FN_BASE.length).split("/")[0];
				if (!serverFnId) throw new Error("Invalid server action param for serverFnId");
				const serverFnHandler = async ({ context }) => {
					return runWithStartContext({
						getRouter,
						startOptions: requestStartOptions,
						contextAfterGlobalMiddlewares: context,
						request,
						executedRequestMiddlewares,
						handlerType: "serverFn"
					}, () => handleServerAction({
						request,
						context: requestOpts?.context,
						serverFnId
					}));
				};
				const { response: middlewareResponse } = await executeMiddleware([...flattenedRequestMiddlewares.map((d) => d.options.server), serverFnHandler], {
					request,
					pathname: url.pathname,
					handlerType: "serverFn",
					context: createNullProtoObject(requestOpts?.context)
				}, request.signal);
				const result = await handleRedirectResponse(middlewareResponse, request, getRouter, request.signal);
				bindSsrResponseToRequest(router ?? void 0, result, request.signal);
				request.signal.throwIfAborted();
				responseOwnsCleanup = result.serverSsrCleanup === "stream";
				return result.response;
			}
			const executeRouter = async (serverContext, matchedRoutes) => {
				const acceptParts = (request.headers.get("Accept") || "*/*").split(",");
				if (!["*/*", "text/html"].some((mimeType) => acceptParts.some((part) => part.trim().startsWith(mimeType)))) return normalizeSsrResponse(Response.json({ error: "Only HTML requests are supported here" }, { status: 500 }));
				const manifest = await waitForRequest(resolveManifestForRequest({
					request,
					requestInlineCss: requestOpts?.inlineCss,
					getBaseManifest: () => getBaseManifest(matchedRoutes)
				}), request.signal);
				const earlyHints = createEarlyHintsForRequest({
					onEarlyHints: requestOpts?.onEarlyHints,
					responseLinkHeader: requestOpts?.responseLinkHeader
				});
				earlyHints?.collectStatic({
					manifest,
					matchedRoutes
				});
				const routerInstance = await getRouter();
				attachRouterServerSsrUtils({
					router: routerInstance,
					manifest,
					getRequestAssets: () => getStartContext({ throwIfNotFound: false })?.requestAssets
				});
				routerInstance.options.additionalContext = { serverContext };
				await routerInstance.load({ _signal: request.signal });
				request.signal.throwIfAborted();
				if (routerInstance._serverResult?.type === "redirect") return normalizeSsrResponse(routerInstance._serverResult.redirect);
				earlyHints?.collectDynamic(_getRenderedMatches(routerInstance.stores.matches.get()));
				const ctx = getStartContext({ throwIfNotFound: false });
				await waitForRequest(routerInstance.serverSsr.dehydrate({ requestAssets: ctx?.requestAssets }), request.signal);
				request.signal.throwIfAborted();
				const responseHeaders = getStartResponseHeaders({ router: routerInstance });
				earlyHints?.appendResponseHeaders(responseHeaders);
				request.signal.throwIfAborted();
				return normalizeSsrResponse(await waitForRequest(cb({
					request,
					router: routerInstance,
					responseHeaders
				}), request.signal, (late) => disposeLateResponse(late, request.signal)));
			};
			const requestHandlerMiddleware = async ({ context }) => {
				return runWithStartContext({
					getRouter,
					startOptions: requestStartOptions,
					contextAfterGlobalMiddlewares: context,
					request,
					executedRequestMiddlewares,
					handlerType: "router"
				}, async () => {
					try {
						return await handleServerRoutes({
							getRouter,
							request,
							url,
							executeRouter,
							context,
							executedRequestMiddlewares
						});
					} catch (err) {
						if (err instanceof Response) return err;
						throw err;
					}
				});
			};
			const { response: middlewareResponse } = await executeMiddleware([...flattenedRequestMiddlewares.map((d) => d.options.server), requestHandlerMiddleware], {
				request,
				pathname: url.pathname,
				handlerType: "router",
				context: createNullProtoObject(requestOpts?.context)
			}, request.signal);
			const response = await handleRedirectResponse(middlewareResponse, request, getRouter, request.signal);
			bindSsrResponseToRequest(router ?? void 0, response, request.signal);
			request.signal.throwIfAborted();
			responseOwnsCleanup = response.serverSsrCleanup === "stream";
			return response.response;
		} finally {
			if (router?.serverSsr && !responseOwnsCleanup) router.serverSsr.cleanup();
			router = null;
		}
	};
	return requestHandler(startRequestResolver);
}
async function handleRedirectResponse(response, request, getRouter, signal) {
	signal.throwIfAborted();
	const ssrResponse = normalizeSsrResponse(response);
	if (!isRedirect(ssrResponse.response)) return ssrResponse;
	if (isResolvedRedirect(ssrResponse.response)) {
		if (request.headers.get("x-tsr-serverFn") === "true") return waitForRequest(replaceSsrResponse(ssrResponse, Response.json({
			...ssrResponse.response.options,
			isSerializedRedirect: true
		}, { headers: ssrResponse.response.headers }), "redirect response replaced"), signal);
		return ssrResponse;
	}
	const opts = ssrResponse.response.options;
	if (opts.to && typeof opts.to === "string" && !opts.to.startsWith("/")) throw new Error(`Server side redirects must use absolute paths via the 'href' or 'to' options. The redirect() method's "to" property accepts an internal path only. Use the "href" property to provide an external URL. Received: ${JSON.stringify(opts)}`);
	if ([
		"params",
		"search",
		"hash"
	].some((d) => typeof opts[d] === "function")) throw new Error(`Server side redirects must use static search, params, and hash values and do not support functional values. Received functional values for: ${Object.keys(opts).filter((d) => typeof opts[d] === "function").map((d) => `"${d}"`).join(", ")}`);
	signal.throwIfAborted();
	const router = await waitForRequest(getRouter(), signal);
	signal.throwIfAborted();
	const redirect = router.resolveRedirect(ssrResponse.response);
	if (request.headers.get("x-tsr-serverFn") === "true") return waitForRequest(replaceSsrResponse(ssrResponse, Response.json({
		...ssrResponse.response.options,
		isSerializedRedirect: true
	}, { headers: ssrResponse.response.headers }), "redirect response replaced"), signal);
	return waitForRequest(replaceSsrResponse(ssrResponse, redirect, "redirect response replaced"), signal);
}
async function handleServerRoutes({ getRouter, request, url, executeRouter, context, executedRequestMiddlewares }) {
	const router = await getRouter();
	const pathname = executeRewriteInput(router.rewrite, url).pathname;
	const [matchedRoutes, rawParams, foundRoute] = router.getMatchedRoutes(pathname);
	const isExactMatch = foundRoute && rawParams["**"] === void 0;
	const routeMiddlewares = [];
	for (const route of matchedRoutes) {
		const serverMiddleware = route.options.server?.middleware;
		if (serverMiddleware) {
			const flattened = flattenMiddlewares(serverMiddleware);
			for (const m of flattened) if (!executedRequestMiddlewares.has(m)) routeMiddlewares.push(m.options.server);
		}
	}
	const server = foundRoute?.options.server;
	let isHeadFallback = false;
	if (server?.handlers && isExactMatch) {
		const handlers = typeof server.handlers === "function" ? server.handlers({ createHandlers: (d) => d }) : server.handlers;
		const requestMethod = request.method.toUpperCase();
		const handler = requestMethod === "HEAD" ? handlers["HEAD"] ?? handlers["GET"] ?? handlers["ANY"] : handlers[requestMethod] ?? handlers["ANY"];
		isHeadFallback = requestMethod === "HEAD" && handler !== void 0 && !handlers["HEAD"];
		if (handler) {
			const mayDefer = !!foundRoute.options.component;
			if (typeof handler === "function") routeMiddlewares.push(handlerToMiddleware(handler, mayDefer));
			else {
				if (handler.middleware?.length) {
					const handlerMiddlewares = flattenMiddlewares(handler.middleware);
					for (const m of handlerMiddlewares) routeMiddlewares.push(m.options.server);
				}
				if (handler.handler) routeMiddlewares.push(handlerToMiddleware(handler.handler, mayDefer));
			}
		}
	}
	routeMiddlewares.push(((ctx) => executeRouter(ctx.context, matchedRoutes)));
	const { ctx, response } = await executeMiddleware(routeMiddlewares, {
		request,
		context,
		params: rawParams,
		pathname,
		handlerType: "router"
	}, request.signal);
	if (isHeadFallback) {
		if (!ctx.response) throwRouteHandlerError();
		return waitForRequest(stripSsrResponseBody(await handleRedirectResponse(response, request, getRouter, request.signal), "HEAD body stripped"), request.signal);
	}
	return normalizeSsrResponse(response);
}
var server_exports = /* @__PURE__ */ __exportAll$1({ setCookie: () => setCookie$1 });
var fetch = createStartHandler(defaultStreamHandler);
function createServerEntry(entry) {
	return { async fetch(...args) {
		return await entry.fetch(...args);
	} };
}
var server_default = createServerEntry({ fetch });
//#endregion
export { deleteCookie$1 as a, getServerFnById as c, setCookie$1 as d, createServerFn as i, server_default as l, createMiddleware as n, getCookie as o, createServerEntry as r, getRequest as s, TSS_SERVER_FUNCTION as t, server_exports as u };
