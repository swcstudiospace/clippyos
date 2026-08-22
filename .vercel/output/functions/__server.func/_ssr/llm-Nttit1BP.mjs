//#region node_modules/.nitro/vite/services/ssr/assets/llm-Nttit1BP.js
/** LLM provider catalog — client-safe. Tokens never live here. */
var LLM_PROVIDER_IDS = [
	"xai-oauth",
	"xai-api",
	"openai-compat"
];
var LLM_FEATURES = [
	"system",
	"ideation",
	"thumbnails",
	"discord",
	"skillAuthor",
	"agent",
	"vision"
];
var LLM_MODELS = [{
	id: "grok-4.6",
	label: "Grok 4.6",
	provider: "xai",
	class: "flagship"
}, {
	id: "grok-4.5",
	label: "Grok 4.5",
	provider: "xai",
	class: "flagship"
}];
var DEFAULT_LLM_ROUTER = {
	defaultProvider: "xai-oauth",
	defaultModel: "grok-4.6",
	fallbackProvider: "xai-api",
	features: {}
};
var LLM_PROVIDER_COPY = {
	"xai-oauth": {
		name: "xAI Grok (SuperGrok / X Premium+ OAuth)",
		purpose: "Subscription quota via the same device-code flow Hermes and Grok Build use. No XAI_API_KEY required.",
		billing: "Uses SuperGrok / linked X Premium+ quota. A 403 means this tier cannot run inference — switch to the metered API key."
	},
	"xai-api": {
		name: "xAI API (metered)",
		purpose: "Production server workloads billed against console.x.ai credits.",
		billing: "Separate from SuperGrok subscription. Key stored in AppSetting (XAI_API_KEY)."
	},
	"openai-compat": {
		name: "OpenAI-compatible API",
		purpose: "Existing Claude / OpenAI-style key (AI_API_KEY) for continuity.",
		billing: "Whatever that provider bills. Kept until you migrate defaults to Grok."
	}
};
var LLM_FEATURE_LABELS = {
	system: "System default",
	ideation: "Ideation",
	thumbnails: "Thumbnails",
	discord: "Discord agent",
	skillAuthor: "Skill author",
	agent: "Clipping Agent",
	vision: "Vision"
};
var LLM_QUERY_KEY = ["llm-providers"];
//#endregion
export { LLM_PROVIDER_COPY as a, LLM_MODELS as i, LLM_FEATURES as n, LLM_PROVIDER_IDS as o, LLM_FEATURE_LABELS as r, LLM_QUERY_KEY as s, DEFAULT_LLM_ROUTER as t };
