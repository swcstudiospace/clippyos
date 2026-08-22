//#region node_modules/.nitro/vite/services/ssr/assets/agent-BK3m7JzY.js
var CLIPPING_PRESET_SKILLS = [
	"clipping-ideation-pack",
	"clipping-thumbnail-pass",
	"clipping-full-package",
	"clipping-social-draft-distribute",
	"clipping-social-verify",
	"clipping-pipeline-nudge",
	"clipping-30d-guarantee-check",
	"clipping-agent-self-improve"
];
var AGENT_PRESETS = [...CLIPPING_PRESET_SKILLS, "custom"];
var LEGACY_PRESET_MAP = {
	ideation: "clipping-ideation-pack",
	thumbnail: "clipping-thumbnail-pass",
	full_package: "clipping-full-package",
	social_drafts: "clipping-social-draft-distribute",
	skill_run: "custom",
	custom: "custom"
};
function normalizePreset(raw) {
	const value = (raw ?? "").trim();
	if (AGENT_PRESETS.includes(value)) return value;
	return LEGACY_PRESET_MAP[value] ?? "custom";
}
function presetSkillSlug(preset) {
	return preset === "custom" ? null : preset;
}
var AGENT_RUN_STATUSES = [
	"queued",
	"planning",
	"stepping",
	"waiting_human",
	"waiting_resource",
	"backoff",
	"succeeded",
	"failed",
	"cancelled",
	"running",
	"paused",
	"needs_login",
	"completed",
	"error"
];
function normalizeRunStatus(raw) {
	switch (raw) {
		case "running": return "stepping";
		case "paused":
		case "needs_login": return "waiting_human";
		case "completed": return "succeeded";
		case "error": return "failed";
		default: return AGENT_RUN_STATUSES.includes(raw ?? "") ? raw : "queued";
	}
}
var AGENT_ACTIVE_STATUSES = [
	"queued",
	"planning",
	"stepping",
	"backoff"
];
var AGENT_QUERY_KEY = ["agent-runs"];
function agentRunQueryKey(id) {
	return ["agent-run", id];
}
var AGENT_MAX_DURATION_MS = 27e5;
var AGENT_PRESET_COPY = {
	"clipping-ideation-pack": {
		label: "Ideation pack",
		goal: "Generate 5 long-form video ideas and title alternatives for this client. Use only videos ≥ 4 minutes.",
		hint: "Ideas + titles. No social, no VM."
	},
	"clipping-thumbnail-pass": {
		label: "Thumbnail pass",
		goal: "Critique the latest thumbnail with vision if an image exists, then generate a fresh 16:9 4K direction.",
		hint: "Vision critique + Higgsfield generation."
	},
	"clipping-full-package": {
		label: "Full clip package",
		goal: "End-to-end package: research, 5 ideas, titles for latest long-form, thumbnail, optional stage note. Write package.json.",
		hint: "SKILL.md plan + orchestrate.py export. Never auto-starts Social."
	},
	"clipping-social-draft-distribute": {
		label: "Social drafts",
		goal: "Queue draft Instagram / X / TikTok posts for the latest publishable asset. Do not start the Social Machine.",
		hint: "create_upload_job in draft mode. MACHINE_STOPPED waits for a human."
	},
	"clipping-social-verify": {
		label: "Social verify",
		goal: "After an upload job, screenshot the desktop and verify compose/success UI with vision.",
		hint: "Needs a running Social Machine. Never types passwords."
	},
	"clipping-pipeline-nudge": {
		label: "Pipeline nudge",
		goal: "Read progress (including Discord-sourced stages) and suggest the next human action. Only set a stage with evidence.",
		hint: "Cautious set_client_stage. No fabricated analytics."
	},
	"clipping-30d-guarantee-check": {
		label: "30-day check",
		goal: "Single-client 30-day views check from AnalyticsSnapshots. Never invent views.",
		hint: "Honest insufficient-data when snapshots are missing."
	},
	"clipping-agent-self-improve": {
		label: "Self-improve",
		goal: "From the last successful Agent run, draft a pending_review skill capturing the plan.",
		hint: "skill_manage.create pending. Never auto-publishes."
	},
	custom: {
		label: "Custom goal",
		goal: "",
		hint: "Describe the clipping workflow. The planner cannot call undeclared tools."
	}
};
function presetCopy(preset) {
	return AGENT_PRESET_COPY[normalizePreset(preset)];
}
/** Ordered plan skeletons. LLM may fill args, not invent out-of-scope tools. */
var PRESET_PLAN_SKELETONS = {
	"clipping-ideation-pack": [
		{
			id: "load",
			tool: "clipping.research_channel",
			args: {},
			purpose: "Load client + long-form videos (≥ 4 minutes).",
			successCriteria: "Client profile returned; long-form list present or honestly empty."
		},
		{
			id: "ideas",
			tool: "clipping.generate_ideas",
			args: {},
			purpose: "Generate tailored long-form ideas.",
			successCriteria: "Ideas persisted on the client record."
		},
		{
			id: "titles",
			tool: "clipping.generate_titles",
			args: {},
			purpose: "3 title alternatives for each of the last 5 long-form uploads.",
			successCriteria: "Titles persisted, grouped by original video."
		},
		{
			id: "finish",
			tool: "clipping.finish",
			args: { summary: "Ideation pack complete." },
			purpose: "Summarize ideas and titles for the operator.",
			successCriteria: "Short operator summary."
		}
	],
	"clipping-thumbnail-pass": [
		{
			id: "load",
			tool: "clipping.research_channel",
			args: {},
			purpose: "Load client context for thumbnail direction.",
			successCriteria: "Client name and channel context available."
		},
		{
			id: "thumb",
			tool: "clipping.generate_thumbnail",
			args: {},
			purpose: "Generate a 16:9 4K thumbnail via Higgsfield.",
			successCriteria: "Image URL returned or honest provider gap."
		},
		{
			id: "finish",
			tool: "clipping.finish",
			args: { summary: "Thumbnail pass complete." },
			purpose: "Report critique + image.",
			successCriteria: "Operator can open the image URL."
		}
	],
	"clipping-full-package": [
		{
			id: "load",
			tool: "clipping.research_channel",
			args: {},
			purpose: "Load client + long-form context.",
			successCriteria: "Safe client fields + latest long-form (or empty)."
		},
		{
			id: "ideas",
			tool: "clipping.generate_ideas",
			args: {},
			purpose: "Generate 5 long-form ideas.",
			successCriteria: "Ideas persisted."
		},
		{
			id: "titles",
			tool: "clipping.generate_titles",
			args: {},
			purpose: "Titles for latest long-form (3× last 5 if available).",
			successCriteria: "Titles persisted."
		},
		{
			id: "thumb",
			tool: "clipping.generate_thumbnail",
			args: {},
			purpose: "Thumbnail direction + generation.",
			successCriteria: "Image URL or honest Higgsfield gap."
		},
		{
			id: "finish",
			tool: "clipping.finish",
			args: { summary: "Full clip package complete." },
			purpose: "Aggregate package.json outputs. Do not start Social.",
			successCriteria: "ideas, titles, thumbnailUrl, notes assembled."
		}
	],
	"clipping-social-draft-distribute": [
		{
			id: "machine",
			tool: "social.get_machine_status",
			args: {},
			purpose: "Check Social Machine without starting it.",
			successCriteria: "Status returned. Stopped is valid — do not auto-start."
		},
		{
			id: "queue",
			tool: "clipping.distribute_social",
			args: {},
			purpose: "Queue draft upload jobs for publishable assets.",
			successCriteria: "Job ids returned, or MACHINE_STOPPED / needs_login handled."
		},
		{
			id: "finish",
			tool: "clipping.finish",
			args: { summary: "Draft social jobs queued." },
			purpose: "Report job ids.",
			successCriteria: "Operator sees job ids or a wait-for-human reason."
		}
	],
	"clipping-social-verify": [
		{
			id: "job",
			tool: "social.get_upload_job",
			args: {},
			purpose: "Load the upload job to verify.",
			successCriteria: "Job status known."
		},
		{
			id: "shot",
			tool: "clipping.observe_desktop",
			args: {},
			purpose: "Screenshot + vision of compose/success UI.",
			successCriteria: "Screenshot captured, or MACHINE_STOPPED / needs_login."
		},
		{
			id: "finish",
			tool: "clipping.finish",
			args: { summary: "Social verification complete." },
			purpose: "Return verification { ok, notes, screenshotRef }.",
			successCriteria: "Honest pass/fail notes."
		}
	],
	"clipping-pipeline-nudge": [
		{
			id: "progress",
			tool: "clipping.get_progress",
			args: {},
			purpose: "Read ClientProgress including AI_DISCORD.",
			successCriteria: "Current stage + recent notes."
		},
		{
			id: "dash",
			tool: "get_dashboard_snapshot",
			args: {},
			purpose: "Read live dashboard snapshot for context.",
			successCriteria: "Metrics returned without invented views."
		},
		{
			id: "finish",
			tool: "clipping.finish",
			args: { summary: "Pipeline nudge complete." },
			purpose: "Suggest next human action. Do not set stage without evidence.",
			successCriteria: "Clear next action for the operator."
		}
	],
	"clipping-30d-guarantee-check": [{
		id: "check",
		tool: "clipping.guarantee_check",
		args: {},
		purpose: "Day-count + views delta from AnalyticsSnapshots only.",
		successCriteria: "dayCount and honest viewsSignal (never invented)."
	}, {
		id: "finish",
		tool: "clipping.finish",
		args: { summary: "30-day check complete." },
		purpose: "Flag escalation if day ≥ 25 / ≥ 30 and views not up.",
		successCriteria: "Escalation flag is evidence-based."
	}],
	"clipping-agent-self-improve": [{
		id: "propose",
		tool: "clipping.propose_skill",
		args: {},
		purpose: "Draft a pending_review skill from the last successful Agent run.",
		successCriteria: "Skill created as pending_review, or honest skip."
	}, {
		id: "finish",
		tool: "clipping.finish",
		args: { summary: "Self-improve proposal filed." },
		purpose: "Tell the operator to review in Settings → Skills.",
		successCriteria: "Pending skill id returned."
	}]
};
var DOMAIN_AGENT_TOOLS = [
	"clipping.research_channel",
	"clipping.generate_ideas",
	"clipping.generate_titles",
	"clipping.generate_thumbnail",
	"clipping.set_stage",
	"clipping.mark_published",
	"clipping.distribute_social",
	"clipping.run_skill",
	"clipping.observe_desktop",
	"clipping.get_progress",
	"clipping.guarantee_check",
	"clipping.verify_upload",
	"clipping.propose_skill",
	"clipping.finish",
	"vision.analyze",
	"computer.screenshot",
	"computer.status",
	"browser.get_page_summary",
	"social.get_machine_status",
	"social.get_publisher_status",
	"social.get_upload_job",
	"social.list_platforms",
	"library.search_assets",
	"library.get_asset",
	"library.queue_render",
	"library.attach_to_social_job",
	"get_dashboard_snapshot",
	"get_client_progress",
	"list_at_risk_clients",
	"get_analytics_snapshot",
	"skills.invoke"
];
function allowlistForPreset(preset) {
	const allow = /* @__PURE__ */ new Set(["clipping.finish"]);
	if (preset === "custom") {
		for (const tool of DOMAIN_AGENT_TOOLS) allow.add(tool);
		return allow;
	}
	const skeleton = PRESET_PLAN_SKELETONS[preset];
	for (const step of skeleton) allow.add(step.tool);
	allow.add("vision.analyze");
	allow.add("computer.status");
	allow.add("social.get_machine_status");
	allow.add("social.get_publisher_status");
	return allow;
}
function isAgentBusy(status) {
	return AGENT_ACTIVE_STATUSES.includes(normalizeRunStatus(status));
}
function agentStatusTone(status) {
	switch (normalizeRunStatus(status)) {
		case "succeeded": return "green";
		case "queued":
		case "planning":
		case "stepping": return "blue";
		case "waiting_human":
		case "waiting_resource":
		case "backoff": return "orange";
		case "failed": return "red";
		case "cancelled": return "neutral";
		default: return "purple";
	}
}
function agentStatusLabel(status) {
	switch (normalizeRunStatus(status)) {
		case "waiting_human": return "Needs you";
		case "waiting_resource": return "Waiting";
		case "planning": return "Planning";
		case "stepping": return "Stepping";
		case "backoff": return "Backoff";
		case "succeeded": return "Succeeded";
		case "failed": return "Failed";
		case "queued": return "Queued";
		case "cancelled": return "Cancelled";
		default: return status;
	}
}
//#endregion
export { CLIPPING_PRESET_SKILLS as a, agentStatusLabel as c, isAgentBusy as d, normalizePreset as f, presetSkillSlug as h, AGENT_QUERY_KEY as i, agentStatusTone as l, presetCopy as m, AGENT_PRESETS as n, PRESET_PLAN_SKELETONS as o, normalizeRunStatus as p, AGENT_PRESET_COPY as r, agentRunQueryKey as s, AGENT_MAX_DURATION_MS as t, allowlistForPreset as u };
