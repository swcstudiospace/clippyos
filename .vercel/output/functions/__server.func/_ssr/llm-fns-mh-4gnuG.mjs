import { Bt as _enum, Jt as object, Ut as boolean, Vt as any, Xt as record, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
import { o as LLM_PROVIDER_IDS } from "./llm-Nttit1BP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/llm-fns-mh-4gnuG.js
var listSkillsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("97e84c153f96825b13c896c5f319da64bc37978b32df54d274a4538db1a64084"));
var getSkillFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(createSsrRpc("35e5a690165a5ac2f48655708627402ac002230b920143e04278725136579c91"));
var createSkillFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	skillMd: string().min(10).max(2e5),
	scripts: record(string(), string()).optional(),
	provenance: _enum(["human", "agent"]).optional()
}).parse(input)).handler(createSsrRpc("05a6e20a33954d0575259efcb43226b95c33c5d707de1945b46b556a12ce324f"));
var setSkillEnabledFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	id: string(),
	enabled: boolean()
}).parse(input)).handler(createSsrRpc("8fb89e0c64b8b41feddf465166602ce13ccc08a3d11497b2cdabe48561846583"));
var approveSkillFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(createSsrRpc("e460bc4a70baad75efa0cd56ee3d670e6e3f2c4af7712c74321b32ed88ab2e6e"));
var invokeSkillFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	id: string(),
	args: record(string(), any()).optional()
}).parse(input)).handler(createSsrRpc("910ba37385f0084a821f82b01eefd0ed05023585de5547716963cd681e386d1f"));
var listSkillRunsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(createSsrRpc("1b9240b2504378178cc160e867598fdc64dc8bfd1a7d5a7b78343c5eb2d9ae46"));
var getLlmSnapshot = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("8563d5d35eafa88891ee81c8f6fb7007790f0951b760f93f224489c470513872"));
var saveLlmRouter = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	defaultProvider: _enum(LLM_PROVIDER_IDS),
	defaultModel: string().min(1).max(80),
	fallbackProvider: _enum(LLM_PROVIDER_IDS).nullable(),
	features: record(string(), _enum(LLM_PROVIDER_IDS)).optional()
}).parse(input)).handler(createSsrRpc("e324ef90b1450b502109118a9618e32fc13b94e0bfbdf76fab60a9335ae0253f"));
var saveLlmApiKey = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	provider: _enum(["xai-api", "openai-compat"]),
	key: string().trim().min(8).max(400)
}).parse(input)).handler(createSsrRpc("c9a7eafe6863a2b88031ad2cdf536708cb42fe2feb63f79574d3d67988fe0a91"));
var disconnectLlmProvider = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ provider: _enum(["xai-api", "openai-compat"]) }).parse(input)).handler(createSsrRpc("93b41c206c1ce587af1a5e284786d5281ed5bfb9f064804b3a71e9787208e5cd"));
var testLlmProvider = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ provider: _enum(LLM_PROVIDER_IDS) }).parse(input)).handler(createSsrRpc("7a1549fe0868dbfb93cbdf92aa484b5a51a96f98b01f16d5c6f132aca7384436"));
//#endregion
export { getSkillFn as a, listSkillsFn as c, setSkillEnabledFn as d, testLlmProvider as f, getLlmSnapshot as i, saveLlmApiKey as l, createSkillFn as n, invokeSkillFn as o, disconnectLlmProvider as r, listSkillRunsFn as s, approveSkillFn as t, saveLlmRouter as u };
