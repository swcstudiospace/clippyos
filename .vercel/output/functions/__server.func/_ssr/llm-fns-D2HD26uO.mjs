import { Bt as _enum, Jt as object, Xt as record, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { o as LLM_PROVIDER_IDS } from "./llm-Nttit1BP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/llm-fns-D2HD26uO.js
var getLlmSnapshot_createServerFn_handler = createServerRpc({
	id: "8563d5d35eafa88891ee81c8f6fb7007790f0951b760f93f224489c470513872",
	name: "getLlmSnapshot",
	filename: "src/lib/server/llm-fns.ts"
}, (opts) => getLlmSnapshot.__executeServer(opts));
var getLlmSnapshot = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getLlmSnapshot_createServerFn_handler, async ({ context }) => {
	if (!context.userId) throw new Error("Unauthorized");
	const { buildLlmSnapshot } = await import("./llm-router.server-TNnMY3uU.mjs").then((n) => n.t);
	return buildLlmSnapshot();
});
var saveLlmRouter_createServerFn_handler = createServerRpc({
	id: "e324ef90b1450b502109118a9618e32fc13b94e0bfbdf76fab60a9335ae0253f",
	name: "saveLlmRouter",
	filename: "src/lib/server/llm-fns.ts"
}, (opts) => saveLlmRouter.__executeServer(opts));
var saveLlmRouter = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	defaultProvider: _enum(LLM_PROVIDER_IDS),
	defaultModel: string().min(1).max(80),
	fallbackProvider: _enum(LLM_PROVIDER_IDS).nullable(),
	features: record(string(), _enum(LLM_PROVIDER_IDS)).optional()
}).parse(input)).handler(saveLlmRouter_createServerFn_handler, async ({ context, data }) => {
	const { requireAdmin } = await import("./access-CV3glphY.mjs").then((n) => n.t).then((n) => n.t);
	await requireAdmin(context.userId);
	const { writeLlmRouter } = await import("./llm-router.server-TNnMY3uU.mjs").then((n) => n.t);
	const next = {
		defaultProvider: data.defaultProvider,
		defaultModel: data.defaultModel,
		fallbackProvider: data.fallbackProvider,
		features: data.features ?? {}
	};
	await writeLlmRouter(next);
	return {
		ok: true,
		router: next
	};
});
var saveLlmApiKey_createServerFn_handler = createServerRpc({
	id: "c9a7eafe6863a2b88031ad2cdf536708cb42fe2feb63f79574d3d67988fe0a91",
	name: "saveLlmApiKey",
	filename: "src/lib/server/llm-fns.ts"
}, (opts) => saveLlmApiKey.__executeServer(opts));
var saveLlmApiKey = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	provider: _enum(["xai-api", "openai-compat"]),
	key: string().trim().min(8).max(400)
}).parse(input)).handler(saveLlmApiKey_createServerFn_handler, async ({ context, data }) => {
	const { requireAdmin } = await import("./access-CV3glphY.mjs").then((n) => n.t).then((n) => n.t);
	await requireAdmin(context.userId);
	const { writeAppSetting } = await import("./app-settings.server-BlmGCrwi.mjs").then((n) => n.t).then((n) => n.t);
	await writeAppSetting(data.provider === "xai-api" ? "XAI_API_KEY" : "AI_API_KEY", data.key);
	return { ok: true };
});
var disconnectLlmProvider_createServerFn_handler = createServerRpc({
	id: "93b41c206c1ce587af1a5e284786d5281ed5bfb9f064804b3a71e9787208e5cd",
	name: "disconnectLlmProvider",
	filename: "src/lib/server/llm-fns.ts"
}, (opts) => disconnectLlmProvider.__executeServer(opts));
var disconnectLlmProvider = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ provider: _enum(["xai-api", "openai-compat"]) }).parse(input)).handler(disconnectLlmProvider_createServerFn_handler, async ({ context, data }) => {
	const { requireAdmin } = await import("./access-CV3glphY.mjs").then((n) => n.t).then((n) => n.t);
	await requireAdmin(context.userId);
	const { deleteAppSetting } = await import("./app-settings.server-BlmGCrwi.mjs").then((n) => n.t).then((n) => n.t);
	await deleteAppSetting(data.provider === "xai-api" ? "XAI_API_KEY" : "AI_API_KEY");
	return { ok: true };
});
var testLlmProvider_createServerFn_handler = createServerRpc({
	id: "7a1549fe0868dbfb93cbdf92aa484b5a51a96f98b01f16d5c6f132aca7384436",
	name: "testLlmProvider",
	filename: "src/lib/server/llm-fns.ts"
}, (opts) => testLlmProvider.__executeServer(opts));
var testLlmProvider = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ provider: _enum(LLM_PROVIDER_IDS) }).parse(input)).handler(testLlmProvider_createServerFn_handler, async ({ context, data }) => {
	const { requireAdmin } = await import("./access-CV3glphY.mjs").then((n) => n.t).then((n) => n.t);
	await requireAdmin(context.userId);
	const { readLlmRouter } = await import("./llm-router.server-TNnMY3uU.mjs").then((n) => n.t);
	const { xaiChat, xaiTextContent, XAI_MODEL } = await import("./xai.server-D2IejPGx.mjs").then((n) => n.s).then((n) => n.c);
	const { message } = await xaiChat({
		messages: [{
			role: "user",
			content: "Reply with the single word pong."
		}],
		maxTokens: 8,
		temperature: 0,
		timeoutMs: 2e4,
		model: (await readLlmRouter()).defaultModel || XAI_MODEL,
		provider: data.provider
	});
	const text = xaiTextContent(message.content);
	if (!text) throw new Error("GENERATION_FAILED");
	return {
		ok: true,
		preview: text.slice(0, 40)
	};
});
//#endregion
export { disconnectLlmProvider_createServerFn_handler, getLlmSnapshot_createServerFn_handler, saveLlmApiKey_createServerFn_handler, saveLlmRouter_createServerFn_handler, testLlmProvider_createServerFn_handler };
