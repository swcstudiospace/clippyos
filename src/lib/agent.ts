/** AI Clipping Agent — client-safe types. Secrets never live here. */

import type { JsonValue } from "@/lib/skills";

export const CLIPPING_PRESET_SKILLS = [
  "clipping-ideation-pack",
  "clipping-thumbnail-pass",
  "clipping-full-package",
  "clipping-social-draft-distribute",
  "clipping-social-verify",
  "clipping-pipeline-nudge",
  "clipping-30d-guarantee-check",
  "clipping-agent-self-improve",
] as const;
export type ClippingPresetSkill = (typeof CLIPPING_PRESET_SKILLS)[number];

export const AGENT_PRESETS = [...CLIPPING_PRESET_SKILLS, "custom"] as const;
export type AgentPreset = (typeof AGENT_PRESETS)[number];

const LEGACY_PRESET_MAP: Record<string, AgentPreset> = {
  ideation: "clipping-ideation-pack",
  thumbnail: "clipping-thumbnail-pass",
  full_package: "clipping-full-package",
  social_drafts: "clipping-social-draft-distribute",
  skill_run: "custom",
  custom: "custom",
};

export function normalizePreset(raw: string | null | undefined): AgentPreset {
  const value = (raw ?? "").trim();
  if ((AGENT_PRESETS as readonly string[]).includes(value)) return value as AgentPreset;
  return LEGACY_PRESET_MAP[value] ?? "custom";
}

export function presetSkillSlug(preset: AgentPreset): string | null {
  return preset === "custom" ? null : preset;
}

export const AGENT_RUN_STATUSES = [
  "queued",
  "planning",
  "stepping",
  "waiting_human",
  "waiting_resource",
  "backoff",
  "succeeded",
  "failed",
  "cancelled",
  // legacy (normalized on read)
  "running",
  "paused",
  "needs_login",
  "completed",
  "error",
] as const;
export type AgentRunStatus = (typeof AGENT_RUN_STATUSES)[number];

export function normalizeRunStatus(raw: string | null | undefined): AgentRunStatus {
  switch (raw) {
    case "running":
      return "stepping";
    case "paused":
    case "needs_login":
      return "waiting_human";
    case "completed":
      return "succeeded";
    case "error":
      return "failed";
    default:
      return (AGENT_RUN_STATUSES as readonly string[]).includes(raw ?? "")
        ? (raw as AgentRunStatus)
        : "queued";
  }
}

export const AGENT_ACTIVE_STATUSES: readonly AgentRunStatus[] = [
  "queued",
  "planning",
  "stepping",
  "backoff",
];

export const AGENT_ITERATION_KINDS = [
  "plan",
  "tool",
  "observe",
  "decide",
  "message",
  "backoff",
  "error",
  "complete",
] as const;
export type AgentIterationKind = (typeof AGENT_ITERATION_KINDS)[number];

export type AgentPlanStep = {
  id: string;
  tool: string;
  args: Record<string, JsonValue>;
  purpose: string;
  successCriteria: string;
};

export type AgentRun = {
  id: string;
  goal: string;
  preset: AgentPreset;
  clientId: string | null;
  skillId: string | null;
  status: AgentRunStatus;
  model: string;
  provider: string | null;
  summary: string | null;
  errorCode: string | null;
  iterationCount: number;
  plan: AgentPlanStep[] | null;
  outputs: Record<string, JsonValue> | null;
  idempotencyKey: string | null;
  cancelRequested: boolean;
  deadlineAt: string | null;
  startedAt: string;
  finishedAt: string | null;
  createdBy: string | null;
  triggeredByTeamMemberId: string | null;
};

export type AgentIteration = {
  id: string;
  runId: string;
  index: number;
  kind: AgentIterationKind;
  stepId: string | null;
  toolName: string | null;
  argsSummary: string | null;
  resultSummary: string | null;
  screenshotRef: string | null;
  screenshotDataUrl: string | null;
  durationMs: number | null;
  status: "ok" | "error" | "running";
  createdAt: string;
};

export type AgentRunDetail = {
  run: AgentRun;
  iterations: AgentIteration[];
  clientName: string | null;
  skillName: string | null;
};

export const AGENT_QUERY_KEY = ["agent-runs"] as const;
export function agentRunQueryKey(id: string) {
  return ["agent-run", id] as const;
}

export const AGENT_MAX_STEPS = 25;
export const AGENT_MAX_DURATION_MS = 45 * 60 * 1000;
export const AGENT_MAX_CONCURRENT = 2;
export const AGENT_STEP_RETRIES = 2;
export const AGENT_PROPOSE_MIN_STEPS = 5;

export const AGENT_PRESET_COPY: Record<
  AgentPreset,
  { label: string; goal: string; hint: string }
> = {
  "clipping-ideation-pack": {
    label: "Ideation pack",
    goal: "Research this client's channel (long-form only, ≥ 4 minutes). Produce 5 packaging-ready ideas: each with a working title, hook mechanism, promise/tension/payoff, spoken 3-second hook, and a ≤4-word thumbnail overlay. Then generate 3 mechanistically distinct title alternatives for the latest long-form upload. Do not duplicate existing titles. No social, no VM.",
    hint: "Ideas + titles. No social, no VM.",
  },
  "clipping-thumbnail-pass": {
    label: "Thumbnail pass",
    goal: "If a latest thumbnail image exists, vision-critique it (emotion, contrast, overlay ≤4 words, postage-stamp legibility). Then generate a fresh 16:9 4K direction whose overlay complements — not repeats — the title. One focal face/object, mandatory emotion, complementary palette.",
    hint: "Vision critique + Higgsfield generation.",
  },
  "clipping-full-package": {
    label: "Full clip package",
    goal: "End-to-end production brief for this client: research long-form (≥ 4 min), 5 ideas with hooks + overlays, 3 titles for the latest long-form, one thumbnail direction, optional stage note only if evidence exists. Write package.json. Never invent analytics. Never start the Social Machine.",
    hint: "SKILL.md plan + orchestrate.py export. Never auto-starts Social.",
  },
  "clipping-social-draft-distribute": {
    label: "Social drafts",
    goal: "Queue draft Instagram / X / TikTok posts for the latest publishable library asset (prefer 9:16). preferredRail=AUTO, mode=draft. Do not start the Social Machine. If MACHINE_STOPPED, wait for a human — do not imply start.",
    hint: "create_upload_job in draft mode. MACHINE_STOPPED waits for a human.",
  },
  "clipping-social-verify": {
    label: "Social verify",
    goal: "After an upload job, screenshot the desktop and verify compose/success UI with vision. Never type passwords, 2FA, or CAPTCHA. If needs_login, stop for a human.",
    hint: "Needs a running Social Machine. Never types passwords.",
  },
  "clipping-pipeline-nudge": {
    label: "Pipeline nudge",
    goal: "Read this client's progress (including Discord-sourced stages). Recommend the next human action with evidence. Only set_stage if notes can cite a real artifact. Never fabricate views or CTR.",
    hint: "Cautious set_client_stage. No fabricated analytics.",
  },
  "clipping-30d-guarantee-check": {
    label: "30-day check",
    goal: "Single-client 30-day views check from AnalyticsSnapshots only. Need ≥2 real snapshots to call a delta. If missing, say Insufficient data — never invent views or treat unknown as zero.",
    hint: "Honest insufficient-data when snapshots are missing.",
  },
  "clipping-agent-self-improve": {
    label: "Self-improve",
    goal: "From the last successful Agent run (≥5 tool steps), draft a pending_review skill capturing the plan and pitfalls. No secrets in SKILL.md. Do not auto-publish.",
    hint: "skill_manage.create pending. Never auto-publishes.",
  },
  custom: {
    label: "Custom goal",
    goal: "",
    hint: "Describe the clipping workflow. The planner cannot call undeclared tools.",
  },
};

export function presetCopy(preset: string): { label: string; goal: string; hint: string } {
  return AGENT_PRESET_COPY[normalizePreset(preset)];
}

/** Ordered plan skeletons. LLM may fill args, not invent out-of-scope tools. */
export const PRESET_PLAN_SKELETONS: Record<ClippingPresetSkill, AgentPlanStep[]> = {
  "clipping-ideation-pack": [
    {
      id: "load",
      tool: "clipping.research_channel",
      args: {},
      purpose: "Load client + long-form videos (≥ 4 minutes).",
      successCriteria: "Client profile returned; long-form list present or honestly empty.",
    },
    {
      id: "ideas",
      tool: "clipping.generate_ideas",
      args: {},
      purpose: "Generate tailored long-form ideas.",
      successCriteria: "Ideas persisted on the client record.",
    },
    {
      id: "titles",
      tool: "clipping.generate_titles",
      args: {},
      purpose: "3 title alternatives for each of the last 5 long-form uploads.",
      successCriteria: "Titles persisted, grouped by original video.",
    },
    {
      id: "finish",
      tool: "clipping.finish",
      args: { summary: "Ideation pack complete." },
      purpose: "Summarize ideas and titles for the operator.",
      successCriteria: "Short operator summary.",
    },
  ],
  "clipping-thumbnail-pass": [
    {
      id: "load",
      tool: "clipping.research_channel",
      args: {},
      purpose: "Load client context for thumbnail direction.",
      successCriteria: "Client name and channel context available.",
    },
    {
      id: "thumb",
      tool: "clipping.generate_thumbnail",
      args: {},
      purpose: "Generate a 16:9 4K thumbnail via Higgsfield.",
      successCriteria: "Image URL returned or honest provider gap.",
    },
    {
      id: "finish",
      tool: "clipping.finish",
      args: { summary: "Thumbnail pass complete." },
      purpose: "Report critique + image.",
      successCriteria: "Operator can open the image URL.",
    },
  ],
  "clipping-full-package": [
    {
      id: "load",
      tool: "clipping.research_channel",
      args: {},
      purpose: "Load client + long-form context.",
      successCriteria: "Safe client fields + latest long-form (or empty).",
    },
    {
      id: "ideas",
      tool: "clipping.generate_ideas",
      args: {},
      purpose: "Generate 5 long-form ideas.",
      successCriteria: "Ideas persisted.",
    },
    {
      id: "titles",
      tool: "clipping.generate_titles",
      args: {},
      purpose: "Titles for latest long-form (3× last 5 if available).",
      successCriteria: "Titles persisted.",
    },
    {
      id: "thumb",
      tool: "clipping.generate_thumbnail",
      args: {},
      purpose: "Thumbnail direction + generation.",
      successCriteria: "Image URL or honest Higgsfield gap.",
    },
    {
      id: "finish",
      tool: "clipping.finish",
      args: { summary: "Full clip package complete." },
      purpose: "Aggregate package.json outputs. Do not start Social.",
      successCriteria: "ideas, titles, thumbnailUrl, notes assembled.",
    },
  ],
  "clipping-social-draft-distribute": [
    {
      id: "machine",
      tool: "social.get_machine_status",
      args: {},
      purpose: "Check Social Machine without starting it.",
      successCriteria: "Status returned. Stopped is valid — do not auto-start.",
    },
    {
      id: "queue",
      tool: "clipping.distribute_social",
      args: {},
      purpose: "Queue draft upload jobs for publishable assets.",
      successCriteria: "Job ids returned, or MACHINE_STOPPED / needs_login handled.",
    },
    {
      id: "finish",
      tool: "clipping.finish",
      args: { summary: "Draft social jobs queued." },
      purpose: "Report job ids.",
      successCriteria: "Operator sees job ids or a wait-for-human reason.",
    },
  ],
  "clipping-social-verify": [
    {
      id: "job",
      tool: "social.get_upload_job",
      args: {},
      purpose: "Load the upload job to verify.",
      successCriteria: "Job status known.",
    },
    {
      id: "shot",
      tool: "clipping.observe_desktop",
      args: {},
      purpose: "Screenshot + vision of compose/success UI.",
      successCriteria: "Screenshot captured, or MACHINE_STOPPED / needs_login.",
    },
    {
      id: "finish",
      tool: "clipping.finish",
      args: { summary: "Social verification complete." },
      purpose: "Return verification { ok, notes, screenshotRef }.",
      successCriteria: "Honest pass/fail notes.",
    },
  ],
  "clipping-pipeline-nudge": [
    {
      id: "progress",
      tool: "clipping.get_progress",
      args: {},
      purpose: "Read ClientProgress including AI_DISCORD.",
      successCriteria: "Current stage + recent notes.",
    },
    {
      id: "dash",
      tool: "get_dashboard_snapshot",
      args: {},
      purpose: "Read live dashboard snapshot for context.",
      successCriteria: "Metrics returned without invented views.",
    },
    {
      id: "finish",
      tool: "clipping.finish",
      args: { summary: "Pipeline nudge complete." },
      purpose: "Suggest next human action. Do not set stage without evidence.",
      successCriteria: "Clear next action for the operator.",
    },
  ],
  "clipping-30d-guarantee-check": [
    {
      id: "check",
      tool: "clipping.guarantee_check",
      args: {},
      purpose: "Day-count + views delta from AnalyticsSnapshots only.",
      successCriteria: "dayCount and honest viewsSignal (never invented).",
    },
    {
      id: "finish",
      tool: "clipping.finish",
      args: { summary: "30-day check complete." },
      purpose: "Flag escalation if day ≥ 25 / ≥ 30 and views not up.",
      successCriteria: "Escalation flag is evidence-based.",
    },
  ],
  "clipping-agent-self-improve": [
    {
      id: "propose",
      tool: "clipping.propose_skill",
      args: {},
      purpose: "Draft a pending_review skill from the last successful Agent run.",
      successCriteria: "Skill created as pending_review, or honest skip.",
    },
    {
      id: "finish",
      tool: "clipping.finish",
      args: { summary: "Self-improve proposal filed." },
      purpose: "Tell the operator to review in Settings → Skills.",
      successCriteria: "Pending skill id returned.",
    },
  ],
};

export const DOMAIN_AGENT_TOOLS = [
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
  "stream.list_sources",
  "stream.list_vods",
  "stream.list_clips",
  "stream.plan_clips",
  "stream.create_clip",
  "stream.update_clip",
  "bridge.status",
  "bridge.apply_mount",
  "bridge.list_drops",
  "bridge.ingest_drop",
  "get_dashboard_snapshot",
  "get_client_progress",
  "list_at_risk_clients",
  "get_analytics_snapshot",
  "skills.invoke",
] as const;

export function allowlistForPreset(preset: AgentPreset): Set<string> {
  const allow = new Set<string>(["clipping.finish"]);
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

export const CLIPPING_TOOL_NAMES = [
  "clipping.research_channel",
  "clipping.generate_ideas",
  "clipping.generate_titles",
  "clipping.generate_thumbnail",
  "clipping.set_stage",
  "clipping.mark_published",
  "clipping.distribute_social",
  "clipping.run_skill",
  "clipping.observe_desktop",
  "clipping.finish",
] as const;

export function isAgentBusy(status: AgentRunStatus): boolean {
  return AGENT_ACTIVE_STATUSES.includes(normalizeRunStatus(status));
}

export function agentStatusTone(
  status: AgentRunStatus,
): "green" | "orange" | "red" | "blue" | "neutral" | "purple" {
  switch (normalizeRunStatus(status)) {
    case "succeeded":
      return "green";
    case "queued":
    case "planning":
    case "stepping":
      return "blue";
    case "waiting_human":
    case "waiting_resource":
    case "backoff":
      return "orange";
    case "failed":
      return "red";
    case "cancelled":
      return "neutral";
    default:
      return "purple";
  }
}

export function agentStatusLabel(status: AgentRunStatus): string {
  switch (normalizeRunStatus(status)) {
    case "waiting_human":
      return "Needs you";
    case "waiting_resource":
      return "Waiting";
    case "planning":
      return "Planning";
    case "stepping":
      return "Stepping";
    case "backoff":
      return "Backoff";
    case "succeeded":
      return "Succeeded";
    case "failed":
      return "Failed";
    case "queued":
      return "Queued";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}
