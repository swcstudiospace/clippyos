//#region node_modules/.nitro/vite/services/ssr/assets/sandbox-DPO25eIO.js
var SANDBOX_LABELS = {
	social: {
		purpose: "social",
		title: "Social Machine",
		blurb: "Windows VM + browser profiles for Instagram, X, TikTok, and YouTube. Explicit Start / Hibernate only. Idle auto-pause (hot snapshot) 15–30 min. Never starts on login. Clock is Australia/Sydney."
	},
	skill: {
		purpose: "skill",
		title: "Skill Execution",
		blurb: "Short-lived Python sandbox for skills.invoke. Aggressive auto-stop (5–15 min). Network default deny. Never mounts Social browser profiles."
	},
	"agent-computer": {
		purpose: "agent-computer",
		title: "Agent Computer Use",
		blurb: "Optional desktop if the Agent needs Computer Use while Social is stopped. Prefers the running Social Machine to save cost. Never auto-starts on navigation."
	}
};
var SKILL_ENV_ALLOWLIST = [
	"SKILL_ID",
	"SKILL_VERSION",
	"INPUT_PATH",
	"OUTPUT_DIR",
	"AGENCY_API_BASE",
	"AGENCY_RUN_TOKEN"
];
var SKILL_ENV_DENY = [
	"DAYTONA_API_KEY",
	"XAI_API_KEY",
	"XAI_ACCESS_TOKEN",
	"XAI_REFRESH_TOKEN",
	"OPENAI_API_KEY",
	"ANTHROPIC_API_KEY",
	"WEBHOOK_SECRET",
	"WEBHOOK_SIGNING_SECRET",
	"SUPABASE_SERVICE_ROLE_KEY",
	"DATABASE_URL",
	"BETTER_AUTH_SECRET"
];
var SKILL_ARTIFACT_EXTS = [
	".json",
	".txt",
	".md",
	".csv",
	".png",
	".jpg",
	".jpeg",
	".webp"
];
var SANDBOX_THREAT_MITIGATIONS = [
	{
		id: "malicious-script",
		title: "Malicious skill script",
		detail: "Contained by no-network default, timeout, non-root, no secrets in env, artifact allowlist."
	},
	{
		id: "prompt-injection",
		title: "Prompt injection / key exfil",
		detail: "Keys are not in the sandbox env. Model tools cannot read AppSetting wholesale."
	},
	{
		id: "cost",
		title: "Parallel cost explosion",
		detail: "Concurrency limits on sandboxes and AgentRuns. Idle Social auto-stop. Test Connection never leaves a VM running."
	},
	{
		id: "session",
		title: "Social session isolation",
		detail: "Browser profiles stay in the Social sandbox. Skill sandboxes cannot mount them unless computer:social_profile (default deny)."
	}
];
//#endregion
export { SKILL_ENV_DENY as a, SKILL_ENV_ALLOWLIST as i, SANDBOX_THREAT_MITIGATIONS as n, SKILL_ARTIFACT_EXTS as r, SANDBOX_LABELS as t };
