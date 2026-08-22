import { Bt as _enum, Jt as object, Xt as record, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { d as __exportAll } from "./ssr.mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
import { i as writeAppSetting, r as readAppSetting } from "./app-settings.server-BlmGCrwi.mjs";
import { i as LLM_MODELS, o as LLM_PROVIDER_IDS, t as DEFAULT_LLM_ROUTER } from "./llm-Nttit1BP.mjs";
import { i as xaiRateLimitSnapshot, n as llmStatus, o as xaiTextContent, r as xaiChat } from "./xai.server-D2IejPGx.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/llm-router.server-TNnMY3uU.js
var llm_router_server_exports = /* @__PURE__ */ __exportAll({
	buildLlmSnapshot: () => buildLlmSnapshot,
	parseLlmRouter: () => parseLlmRouter,
	readLlmRouter: () => readLlmRouter,
	routedChat: () => routedChat,
	routedText: () => routedText,
	writeLlmRouter: () => writeLlmRouter
});
var ROUTER_KEY = "LLM_ROUTER_JSON";
function parseLlmRouter(raw) {
	if (!raw || typeof raw !== "object") return { ...DEFAULT_LLM_ROUTER };
	const row = raw;
	const provider = String(row.defaultProvider ?? "");
	const fallback = String(row.fallbackProvider ?? "");
	const features = {};
	if (row.features && typeof row.features === "object") {
		for (const [key, value] of Object.entries(row.features)) if (LLM_PROVIDER_IDS.includes(value)) features[key] = value;
	}
	return {
		defaultProvider: LLM_PROVIDER_IDS.includes(provider) ? provider : DEFAULT_LLM_ROUTER.defaultProvider,
		defaultModel: String(row.defaultModel ?? "grok-4.6") || "grok-4.6",
		fallbackProvider: LLM_PROVIDER_IDS.includes(fallback) ? fallback : DEFAULT_LLM_ROUTER.fallbackProvider,
		features
	};
}
async function readLlmRouter() {
	const raw = await readAppSetting(ROUTER_KEY);
	if (!raw) return { ...DEFAULT_LLM_ROUTER };
	try {
		return parseLlmRouter(JSON.parse(raw));
	} catch {
		return { ...DEFAULT_LLM_ROUTER };
	}
}
async function writeLlmRouter(config) {
	await writeAppSetting(ROUTER_KEY, JSON.stringify(config));
}
function last4(value) {
	if (!value || value.length < 4) return null;
	return value.slice(-4);
}
async function buildLlmSnapshot() {
	const [router, status, xaiKey, compatKey] = await Promise.all([
		readLlmRouter(),
		llmStatus(),
		readAppSetting("XAI_API_KEY"),
		readAppSetting("AI_API_KEY")
	]);
	const models = LLM_MODELS.map((row) => row.id);
	return {
		router,
		providers: {
			"xai-oauth": {
				id: "xai-oauth",
				configured: status.source === "oauth",
				health: status.source === "oauth" ? "connected" : "not_configured",
				last4: null,
				email: status.email,
				models
			},
			"xai-api": {
				id: "xai-api",
				configured: Boolean(xaiKey?.trim()) || status.source === "key" || status.source === "platform",
				health: status.source === "key" || status.source === "platform" ? "connected" : xaiKey?.trim() ? "connected" : "not_configured",
				last4: last4(xaiKey) ?? (status.source === "platform" ? "plat" : null),
				email: null,
				models
			},
			"openai-compat": {
				id: "openai-compat",
				configured: Boolean(compatKey?.trim()),
				health: compatKey?.trim() ? "connected" : "not_configured",
				last4: last4(compatKey),
				email: null,
				models: []
			}
		},
		catalog: LLM_MODELS,
		rateLimit: xaiRateLimitSnapshot()
	};
}
async function routedChat(input) {
	const router = await readLlmRouter();
	const preferred = router.features[input.feature] ?? router.defaultProvider;
	const model = router.defaultModel || "grok-4.6";
	const attempt = async (provider) => xaiChat({
		messages: input.messages,
		temperature: input.temperature,
		maxTokens: input.maxTokens,
		tools: input.tools,
		toolChoice: input.toolChoice,
		timeoutMs: input.timeoutMs,
		reasoningEffort: input.reasoningEffort,
		model,
		provider,
		conversationId: input.conversationId,
		promptCacheKey: input.promptCacheKey
	});
	try {
		return {
			...await attempt(preferred),
			provider: preferred,
			model
		};
	} catch (error) {
		const code = error instanceof Error ? error.message : "";
		if (code === "AI_TIER_GATED") throw error;
		const fallback = router.fallbackProvider;
		if (fallback && fallback !== preferred && (code === "AI_UNAVAILABLE" || code === "AI_RATE_LIMIT")) return {
			...await attempt(fallback),
			provider: fallback,
			model
		};
		throw error;
	}
}
async function routedText(input) {
	const { message } = await routedChat(input);
	const text = xaiTextContent(message.content);
	if (!text) throw new Error("GENERATION_FAILED");
	return text;
}
createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("c19c8b7cf98b01ae99815720579757308e2b0e1f977669121576471dc201e6ee"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	defaultProvider: _enum(LLM_PROVIDER_IDS),
	defaultModel: string().min(1).max(80),
	fallbackProvider: _enum(LLM_PROVIDER_IDS).nullable(),
	features: record(string(), _enum(LLM_PROVIDER_IDS)).optional()
}).parse(input)).handler(createSsrRpc("b180d8b95ca071dd178f93c83633a4615ca2994ad067c7de9cf8fdadbb4576d5"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	provider: _enum(["xai-api", "openai-compat"]),
	key: string().trim().min(8).max(400)
}).parse(input)).handler(createSsrRpc("e629a5d65b2c4053a4679c5d6def4a659823efe6a421356a957fcbc13ccbec8c"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ provider: _enum(["xai-api", "openai-compat"]) }).parse(input)).handler(createSsrRpc("389e0052e4583bf67dce9a36261d7137e78f76c970b2a0cc7d84b2a8133f8215"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ provider: _enum(LLM_PROVIDER_IDS) }).parse(input)).handler(createSsrRpc("9a04c7b14ef0a2985d00981b8a2f089221cda620367755f14653faf95df8c8b0"));
//#endregion
export { routedText as i, readLlmRouter as n, routedChat as r, llm_router_server_exports as t };
