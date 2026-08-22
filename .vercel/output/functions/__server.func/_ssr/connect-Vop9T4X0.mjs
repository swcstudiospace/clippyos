//#region node_modules/.nitro/vite/services/ssr/assets/connect-Vop9T4X0.js
var PLAYBOOK_PACKAGE_VERSION = "2026.08.orchestrate";
var HERMES_CONNECTION_LABELS = {
	not_connected: "Not connected",
	key_only: "Key only",
	fully_connected: "Fully connected"
};
var SOCIAL_LIFECYCLE_EVENTS = [
	"social.upload.succeeded",
	"social.upload.failed",
	"social.upload.needs_attention",
	"social.session.needs_login",
	"social.session.healthy",
	"social.machine.started",
	"social.machine.stopped",
	"social.machine.error"
];
var ADDON_META = {
	ai: {
		id: "ai",
		layer: "core",
		requiredFor: "Required for Ideation, Thumbnails, titles/ideas, and the Discord agent",
		usedBy: [
			"Ideation",
			"Thumbnails",
			"Client titles & ideas",
			"Discord Status Agent",
			"content_ideation_cadence"
		]
	},
	higgsfield: {
		id: "higgsfield",
		layer: "addon",
		requiredFor: "Media generation for 16:9 4K thumbnails",
		usedBy: ["Thumbnails"]
	},
	youtube: {
		id: "youtube",
		layer: "addon",
		requiredFor: "Public YouTube Data API pulls into AnalyticsSnapshot",
		usedBy: [
			"Analytics",
			"weekly_analytics_refresh",
			"thirty_day_guarantee_monitor"
		]
	},
	discord: {
		id: "discord",
		layer: "addon",
		requiredFor: "Read-only production-stage agent",
		usedBy: ["Client pipeline", "discord_agent_followthrough"]
	},
	notion: {
		id: "notion",
		layer: "addon",
		requiredFor: "Optional notes and briefing access",
		usedBy: ["Optional notes"]
	},
	linear: {
		id: "linear",
		layer: "addon",
		requiredFor: "Optional Kanban for failed jobs, renders, and agent runs",
		usedBy: [
			"Social",
			"Library",
			"Agent",
			"reactor_linear_social_fail"
		]
	},
	x: {
		id: "x",
		layer: "addon",
		requiredFor: "Native X API publishing without Computer Use",
		usedBy: [
			"Social",
			"distribute_published_client_asset",
			"daily_social_distribution_sweep"
		]
	},
	daytona: {
		id: "daytona",
		layer: "core",
		requiredFor: "Required for Social Computer Use (Instagram, X, TikTok)",
		usedBy: [
			"Social",
			"distribute_published_client_asset",
			"daily_social_distribution_sweep",
			"social_session_health_check",
			"reactor_session_needs_login"
		]
	},
	telegram: {
		id: "telegram",
		layer: "addon",
		requiredFor: "Professional Telegram liaison for customers and companies",
		usedBy: ["Inbox"]
	},
	whatsapp: {
		id: "whatsapp",
		layer: "addon",
		requiredFor: "Professional WhatsApp Cloud API liaison",
		usedBy: ["Inbox"]
	},
	airwallex: {
		id: "airwallex",
		layer: "control-plane",
		requiredFor: "Workspace subscription checkout and entitlement",
		usedBy: ["Billing", "Access gate"]
	}
};
var ADDON_LAYER_LABELS = {
	core: "Core OS",
	addon: "Add-on",
	"control-plane": "Control plane"
};
function deriveHermesConnection(input) {
	if (!input.hasHermesKey) return "not_connected";
	if (input.keyLastUsedAt) return "fully_connected";
	return "key_only";
}
function deriveConnectSteps(input) {
	return {
		mintKey: input.hasHermesKey,
		pastePlaybook: input.pastedIntoHermes || Boolean(input.keyLastUsedAt),
		socialPolicy: input.socialPolicyAcked,
		outbound: input.outboundUrlConfigured || input.outboundSkipped
	};
}
//#endregion
export { SOCIAL_LIFECYCLE_EVENTS as a, PLAYBOOK_PACKAGE_VERSION as i, ADDON_META as n, deriveConnectSteps as o, HERMES_CONNECTION_LABELS as r, deriveHermesConnection as s, ADDON_LAYER_LABELS as t };
