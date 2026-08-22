//#region node_modules/.nitro/vite/services/ssr/assets/addons-BHnLQdrp.js
/** Add-On SDK — client-safe catalog. Secrets never live here. */
var ADDON_PERMISSIONS = [
	"clients:read",
	"clients:write",
	"payments:write",
	"progress:write",
	"leads:write",
	"social:read",
	"social:write",
	"skills:execute",
	"skills:manage",
	"llm:invoke",
	"analytics:read",
	"hooks:subscribe"
];
var ADDON_TYPES = [
	"core",
	"integration",
	"runtime",
	"skill-pack",
	"llm-provider"
];
var ADDONS_QUERY_KEY = ["addons"];
var BUILTIN_ADDONS = [
	{
		schemaVersion: 1,
		id: "agency.core-ai",
		name: "Core AI",
		version: "1.0.0",
		description: "Required LLM for Ideation, titles, ideas, Discord classification, and skill authoring.",
		type: "llm-provider",
		entry: {
			mcp: true,
			uiSlots: [
				"ideation",
				"thumbnails",
				"clients",
				"settings.llm"
			]
		},
		permissions: ["llm:invoke"],
		dependencies: {},
		configSchema: {
			type: "object",
			properties: { key: { type: "string" } }
		},
		hooks: [],
		mcp: { tools: ["regenerate_suggested_titles", "regenerate_suggested_ideas"] },
		skills: [],
		sandbox: {},
		usedBy: [
			"Ideation",
			"Thumbnails",
			"Client titles & ideas",
			"Discord Status Agent",
			"Clipping Agent"
		],
		required: true
	},
	{
		schemaVersion: 1,
		id: "agency.xai-oauth",
		name: "xAI Grok (SuperGrok OAuth)",
		version: "1.0.0",
		description: "Subscription-quota Grok via SuperGrok / X Premium+ OAuth. No metered API key required.",
		type: "llm-provider",
		entry: { uiSlots: ["settings.llm"] },
		permissions: ["llm:invoke"],
		dependencies: { addons: ["agency.core-ai"] },
		configSchema: {
			type: "object",
			properties: {}
		},
		hooks: [],
		mcp: { resources: ["agency://llm/providers"] },
		skills: [],
		sandbox: {},
		usedBy: [
			"Ideation",
			"Skill author",
			"Discord agent",
			"Clipping Agent"
		]
	},
	{
		schemaVersion: 1,
		id: "agency.higgsfield",
		name: "Higgsfield",
		version: "1.0.0",
		description: "16:9 4K YouTube thumbnails via nano-banana-pro.",
		type: "integration",
		entry: { uiSlots: ["thumbnails"] },
		permissions: ["llm:invoke"],
		dependencies: {},
		configSchema: {
			type: "object",
			properties: {
				keyId: { type: "string" },
				secret: { type: "string" }
			}
		},
		hooks: [],
		mcp: {},
		skills: [],
		sandbox: {},
		usedBy: ["Thumbnails", "Clipping Agent"]
	},
	{
		schemaVersion: 1,
		id: "agency.youtube",
		name: "YouTube Data API",
		version: "1.0.0",
		description: "Public channel stats into AnalyticsSnapshot.",
		type: "integration",
		entry: {
			mcp: true,
			uiSlots: ["analytics"]
		},
		permissions: ["analytics:read"],
		dependencies: {},
		configSchema: {
			type: "object",
			properties: { apiKey: { type: "string" } }
		},
		hooks: [],
		mcp: { tools: ["pull_client_analytics", "get_analytics_snapshot"] },
		skills: [],
		sandbox: {},
		usedBy: [
			"Analytics",
			"weekly_analytics_refresh",
			"Clipping Agent"
		]
	},
	{
		schemaVersion: 1,
		id: "agency.discord",
		name: "Discord Status Agent",
		version: "1.0.0",
		description: "Read-only bot that classifies production stages.",
		type: "integration",
		entry: { uiSlots: ["clients"] },
		permissions: ["progress:write"],
		dependencies: { addons: ["agency.core-ai"] },
		configSchema: {
			type: "object",
			properties: { token: { type: "string" } }
		},
		hooks: ["onProgressStageChanged"],
		mcp: {},
		skills: [],
		sandbox: {},
		usedBy: ["Client pipeline", "discord_agent_followthrough"]
	},
	{
		schemaVersion: 1,
		id: "agency.notion",
		name: "Notion",
		version: "1.0.0",
		description: "Optional notes and briefing access.",
		type: "integration",
		entry: { uiSlots: ["settings"] },
		permissions: ["clients:read"],
		dependencies: {},
		configSchema: {
			type: "object",
			properties: { token: { type: "string" } }
		},
		hooks: [],
		mcp: {},
		skills: [],
		sandbox: {},
		usedBy: ["Optional notes"]
	},
	{
		schemaVersion: 1,
		id: "agency.linear",
		name: "Linear",
		version: "1.0.0",
		description: "Kanban / delivery board for ops tickets. Deep-links only.",
		type: "integration",
		entry: {
			mcp: true,
			uiSlots: ["settings.linear"]
		},
		permissions: ["hooks:subscribe"],
		dependencies: {},
		configSchema: {
			type: "object",
			properties: { apiKey: { type: "string" } }
		},
		hooks: ["onSocialUploadResult", "onRenderFailed"],
		mcp: {
			tools: [
				"linear.get_status",
				"linear.create_issue",
				"linear.update_issue",
				"linear.find_issues"
			],
			resources: ["agency://linear/status"]
		},
		skills: [],
		sandbox: {},
		usedBy: [
			"Social",
			"Library",
			"Agent",
			"Knowledge proposals"
		]
	},
	{
		schemaVersion: 1,
		id: "agency.daytona-social",
		name: "Daytona browser runtime",
		version: "1.0.0",
		description: "On-demand Windows Social Machine for Instagram, X, TikTok, YouTube, and Python skill sandboxes.",
		type: "runtime",
		entry: {
			mcp: true,
			uiSlots: ["social", "settings.skills"]
		},
		permissions: [
			"social:read",
			"social:write",
			"skills:execute"
		],
		dependencies: {},
		configSchema: {
			type: "object",
			properties: { apiKey: { type: "string" } }
		},
		hooks: ["onSocialUploadResult", "onClientPublished"],
		mcp: {
			tools: ["social.get_machine_status", "social.create_upload_job"],
			resources: ["agency://social/machine"]
		},
		skills: ["social-session-health"],
		sandbox: {
			requiresDaytona: true,
			requiresPython: true
		},
		usedBy: [
			"Social",
			"Skills runtime",
			"Clipping Agent",
			"distribute_published_client_asset"
		]
	},
	{
		schemaVersion: 1,
		id: "agency.hermes-control-plane",
		name: "Hermes control plane",
		version: "1.0.0",
		description: "API, MCP, and webhooks. Always present. Credentials stay operator-issued.",
		type: "core",
		entry: {
			mcp: true,
			apiRoutes: ["/api/v1", "/api/mcp"],
			uiSlots: ["settings.automation"]
		},
		permissions: ["clients:read"],
		dependencies: {},
		configSchema: { type: "object" },
		hooks: ["onPlaybookStep"],
		mcp: { resources: [
			"agency://playbooks",
			"agency://addons",
			"agency://skills"
		] },
		skills: [],
		sandbox: {},
		usedBy: ["Automation & Hermes", "Dashboard widget"],
		required: true,
		locked: true
	},
	{
		schemaVersion: 1,
		id: "agency.skills-runtime",
		name: "Skills runtime",
		version: "1.0.0",
		description: "SKILL.md packages with optional Python, executed in an isolated Daytona sandbox.",
		type: "skill-pack",
		entry: {
			mcp: true,
			uiSlots: ["settings.skills"]
		},
		permissions: ["skills:execute", "skills:manage"],
		dependencies: { addons: ["agency.daytona-social"] },
		configSchema: { type: "object" },
		hooks: ["onPlaybookStep"],
		mcp: {
			tools: [
				"skills.list",
				"skills.invoke",
				"skill_manage.create"
			],
			resources: ["agency://skills/{id}"]
		},
		skills: [],
		sandbox: {
			requiresPython: true,
			requiresDaytona: true
		},
		usedBy: [
			"Hermes skills/invoke",
			"Self-improve loop",
			"Clipping Agent"
		]
	}
];
function isAddonPermission(value) {
	return ADDON_PERMISSIONS.includes(value);
}
function validateManifest(raw) {
	if (!raw || typeof raw !== "object") return {
		ok: false,
		error: "Manifest must be a JSON object."
	};
	const row = raw;
	if (row.schemaVersion !== 1) return {
		ok: false,
		error: "Unsupported schemaVersion."
	};
	const id = String(row.id ?? "").trim();
	if (!/^[a-z0-9][a-z0-9.-]{2,80}$/i.test(id)) return {
		ok: false,
		error: "Invalid add-on id."
	};
	const type = String(row.type ?? "");
	if (!ADDON_TYPES.includes(type)) return {
		ok: false,
		error: "Unknown add-on type."
	};
	const permissions = Array.isArray(row.permissions) ? row.permissions.map(String) : [];
	const unknown = permissions.filter((item) => !isAddonPermission(item));
	if (unknown.length) return {
		ok: false,
		error: `Unknown permissions: ${unknown.join(", ")}`
	};
	const name = String(row.name ?? "").trim();
	if (!name) return {
		ok: false,
		error: "name is required."
	};
	return {
		ok: true,
		manifest: {
			schemaVersion: 1,
			id,
			name,
			version: String(row.version ?? "0.0.0"),
			description: String(row.description ?? "").slice(0, 400),
			type,
			entry: row.entry ?? {},
			permissions,
			dependencies: row.dependencies ?? {},
			configSchema: row.configSchema ?? { type: "object" },
			hooks: Array.isArray(row.hooks) ? row.hooks.map(String) : [],
			mcp: row.mcp ?? {},
			skills: Array.isArray(row.skills) ? row.skills.map(String) : [],
			sandbox: row.sandbox ?? {},
			usedBy: Array.isArray(row.usedBy) ? row.usedBy.map(String) : []
		}
	};
}
/** Map an MCP/API tool name to the add-on that owns it. Null = always-on core OS. */
function addonIdForTool(name) {
	if (name.startsWith("library.")) return null;
	if (name === "social.create_upload_job" || name === "social.get_upload_job" || name === "social.list_upload_jobs" || name === "social.retry_upload_job" || name === "social.cancel_upload_job" || name === "social.list_posts" || name === "social.get_post" || name === "social.plan_distribution" || name === "social.bulk_create_upload_jobs" || name === "social.list_uploadable_assets" || name === "social.resolve_asset" || name.startsWith("approvals.")) return null;
	if (name.startsWith("linear.")) return "agency.linear";
	if (name.startsWith("social.")) return "agency.daytona-social";
	if (name.startsWith("skills.") || name === "tasks.get" || name.startsWith("skill.")) return "agency.skills-runtime";
	if (name === "regenerate_suggested_titles" || name === "regenerate_suggested_ideas") return "agency.core-ai";
	if (name === "pull_client_analytics" || name === "get_analytics_snapshot") return "agency.youtube";
	if (name === "analytics.refresh_post_performance" || name === "analytics.list_winners" || name === "knowledge.list_proposals" || name === "knowledge.decide_proposal") return null;
	if (name === "get_connect_status" || name === "get_playbook_package" || name === "list_addons" || name === "get_llm_providers") return "agency.hermes-control-plane";
	return null;
}
//#endregion
export { validateManifest as i, BUILTIN_ADDONS as n, addonIdForTool as r, ADDONS_QUERY_KEY as t };
