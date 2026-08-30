/** Daytona sandbox security model — client-safe. No secrets. */

export const SANDBOX_TYPES = ["social", "skill", "agent-computer"] as const;
export type SandboxType = (typeof SANDBOX_TYPES)[number];

export const SANDBOX_LABELS: Record<SandboxType, { purpose: string; title: string; blurb: string }> = {
  social: {
    purpose: "social",
    title: "Social Machine",
    blurb:
      "Linux VM (daytona-vm-medium) + browser for Instagram, X, TikTok, and YouTube. Windows snapshots need a Daytona plan that includes them. Explicit Start / Hibernate only. Idle auto-pause (hot snapshot) 15–30 min. Never starts on login. Clock is Australia/Sydney.",
  },
  skill: {
    purpose: "skill",
    title: "Skill Execution",
    blurb:
      "Short-lived Python sandbox for skills.invoke. Aggressive auto-stop (5–15 min). Network default deny. Never mounts Social browser profiles.",
  },
  "agent-computer": {
    purpose: "agent-computer",
    title: "Agent Computer Use",
    blurb:
      "Optional desktop if the Agent needs Computer Use while Social is stopped. Prefers the running Social Machine to save cost. Never auto-starts on navigation.",
  },
};

export const SKILL_ENV_ALLOWLIST = [
  "SKILL_ID",
  "SKILL_VERSION",
  "INPUT_PATH",
  "OUTPUT_DIR",
  "AGENCY_API_BASE",
  "AGENCY_RUN_TOKEN",
] as const;

export const SKILL_ENV_DENY = [
  "DAYTONA_API_KEY",
  "XAI_API_KEY",
  "XAI_ACCESS_TOKEN",
  "XAI_REFRESH_TOKEN",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "WEBHOOK_SECRET",
  "WEBHOOK_SIGNING_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "CRON_SECRET",
  "CRAYO_API_KEY",
  "OPERATOR_SECRETS_KEY",
  "GOOGLE_CLIENT_SECRET",
  "TWITTER_CLIENT_SECRET",
] as const;

export const SKILL_ARTIFACT_EXTS = [
  ".json",
  ".txt",
  ".md",
  ".csv",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
] as const;

export const SKILL_ARTIFACT_MAX_BYTES = 2_000_000;
export const SKILL_NETWORK_DOMAIN_ALLOWLIST =
  "os.swcstudio.space,*.swcstudio.space,clippyos.grok.me";
export const SKILL_SANDBOX_AUTOSTOP_MINUTES = 5;
export const SOCIAL_SANDBOX_AUTOSTOP_MINUTES = 20;

/** Shell-safe KEY='value' assignment, or null if the pair is unsafe to interpolate. */
export function shellEnvAssignment(key: string, value: string): string | null {
  if (!/^[A-Z][A-Z0-9_]*$/.test(key)) return null;
  if (/[\n\r\0`$;&|<>]/.test(value)) return null;
  return `${key}='${value.replace(/'/g, "")}'`;
}

export const SANDBOX_THREAT_MITIGATIONS = [
  {
    id: "malicious-script",
    title: "Malicious skill script",
    detail: "Contained by no-network default, timeout, non-root, no secrets in env, artifact allowlist.",
  },
  {
    id: "prompt-injection",
    title: "Prompt injection / key exfil",
    detail: "Keys are not in the sandbox env. Model tools cannot read AppSetting wholesale.",
  },
  {
    id: "cost",
    title: "Parallel cost explosion",
    detail: "Concurrency limits on sandboxes and AgentRuns. Idle Social auto-stop. Test Connection never leaves a VM running.",
  },
  {
    id: "session",
    title: "Social session isolation",
    detail: "Browser profiles stay in the Social sandbox. Skill sandboxes cannot mount them unless computer:social_profile (default deny).",
  },
] as const;
