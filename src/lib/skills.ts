/** Skills catalog — client-safe. Packages are SKILL.md + optional scripts. */

export const SKILL_PROVENANCE = ["human", "agent", "builtin"] as const;
export type SkillProvenance = (typeof SKILL_PROVENANCE)[number];

export const SKILL_STATUSES = ["active", "pending_review", "disabled", "archived"] as const;
export type SkillStatus = (typeof SKILL_STATUSES)[number];

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type SkillRuntime = {
  python?: "3.11";
  timeoutSec?: number;
  network?: boolean;
  entrypoint?: string;
};

export type SkillRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  version: string;
  tags: string[];
  category: string | null;
  provenance: SkillProvenance;
  status: SkillStatus;
  permissions: string[];
  runtime: SkillRuntime;
  inputsSchema: JsonValue | null;
  outputsSchema: JsonValue | null;
  skillMd: string;
  scripts: Record<string, string>;
  references: Record<string, string>;
  templates: Record<string, string>;
  enabled: boolean;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
};

export type SkillRun = {
  id: string;
  skillId: string;
  version: string;
  status: "queued" | "running" | "completed" | "error" | "cancelled";
  stdout: string | null;
  stderr: string | null;
  exitCode: number | null;
  durationMs: number | null;
  errorCode: string | null;
  artifacts: Array<{ name: string; size: number }>;
  createdAt: string;
  updatedAt: string;
};

export const SKILLS_QUERY_KEY = ["skills"] as const;
export const SKILL_RUNS_QUERY_KEY = ["skill-runs"] as const;

export function parseSkillFrontmatter(md: string): {
  meta: Record<string, unknown>;
  body: string;
} {
  const match = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: md };
  const meta: Record<string, unknown> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx < 1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (value.startsWith("[") && value.endsWith("]")) {
      meta[key] = value
        .slice(1, -1)
        .split(",")
        .map((item) => item.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else if (value === "true" || value === "false") {
      meta[key] = value === "true";
    } else {
      meta[key] = value;
    }
  }
  return { meta, body: match[2] ?? "" };
}

export function stripSecretsFromSkillText(text: string): string {
  return text
    .replace(/dtn_[a-zA-Z0-9]+/g, "[redacted]")
    .replace(/xai-[A-Za-z0-9_-]{10,}/g, "[redacted]")
    .replace(/sk-[A-Za-z0-9_-]{10,}/g, "[redacted]")
    .replace(/agk_live_[A-Za-z0-9]+/g, "[redacted]")
    .replace(/mcp_[A-Za-z0-9]+/g, "[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]");
}

export function skillPackageContainsSecrets(text: string): boolean {
  return /dtn_[a-zA-Z0-9]{8,}|xai-[A-Za-z0-9_-]{12,}|sk-[A-Za-z0-9_-]{12,}|agk_live_[A-Za-z0-9]+|mcp_[A-Za-z0-9]{12,}|Bearer\s+[A-Za-z0-9._-]{12,}/i.test(
    text,
  );
}

export const AGENT_SKILL_PERMISSIONS = [
  "clients:read",
  "social:read",
  "social:write",
  "analytics:read",
  "llm:invoke",
  "actions:ai",
  "stream:read",
  "stream:write_clips",
] as const;

export function clipAgentSkillPermissions(requested: string[]): string[] {
  const allow = new Set<string>(AGENT_SKILL_PERMISSIONS);
  return requested.filter((item) => allow.has(item));
}

export function skillListItem(skill: SkillRecord) {
  return {
    id: skill.id,
    slug: skill.slug,
    name: skill.name,
    description: skill.description,
    version: skill.version,
    tags: skill.tags,
    category: skill.category,
    provenance: skill.provenance,
    status: skill.status,
    enabled: skill.enabled,
    permissions: skill.permissions,
    runtime: skill.runtime,
    scriptNames: Object.keys(skill.scripts),
  };
}

export function skillMcpGet(skill: SkillRecord) {
  return {
    ...skillListItem(skill),
    skillMd: stripSecretsFromSkillText(skill.skillMd),
  };
}

export const BUILTIN_SKILLS: Array<{
  slug: string;
  skillMd: string;
  scripts?: Record<string, string>;
  templates?: Record<string, string>;
  references?: Record<string, string>;
  runtime?: SkillRuntime;
  inputsSchema?: JsonValue;
  outputsSchema?: JsonValue;
}> = [
  {
    slug: "daily-ops-brief",
    skillMd: `---
name: Daily ops brief
description: Assemble the morning command-center brief from live Agency Admin tools.
version: 1.0.0
tags: [ops, read-only]
category: ops
provenance: builtin
permissions: [clients:read]
runtime: { timeoutSec: 30, network: false }
---

# Daily ops brief

Use only existing tools. Never invent analytics.

1. Call \`get_dashboard_snapshot\`
2. Call \`list_at_risk_clients\`
3. Call \`list_payments\` and keep OVERDUE plus PENDING due soon
4. Call \`get_integration_status\`
5. Summarize MRR, outstanding cash, clients day ≥ 25, stalled stages, and integration health

Do not mutate. If a tool is unavailable, report the gap honestly.
`,
  },
  {
    slug: "social-session-health",
    skillMd: `---
name: Social session health
description: Check Instagram, X, and TikTok sessions before a distribution window.
version: 1.0.0
tags: [social, daytona]
category: social
provenance: builtin
permissions: [social:read, social:write]
runtime: { python: "3.11", timeoutSec: 120, network: false }
---

# Social session health

1. Call \`social.get_machine_status\` — never start the VM from this skill unless the operator enabled auto_start_for_upload
2. If stopped, return MACHINE_STOPPED and ask a human to Start
3. \`social.check_session_health\` for instagram, x, tiktok, youtube
4. \`social.take_screenshot\` for evidence
5. Escalate any needs_login — never type passwords
`,
    scripts: {
      "health.py": `#!/usr/bin/env python3
"""Format a session-health report from JSON on stdin. No network."""
import json, sys
raw = sys.stdin.read().strip() or "{}"
try:
    data = json.loads(raw)
except json.JSONDecodeError:
    print("invalid json", file=sys.stderr)
    sys.exit(2)
platforms = data.get("platforms") or []
for row in platforms:
    name = row.get("platform", "?")
    status = row.get("sessionStatus", "unknown")
    print(f"{name}: {status}")
needs = [r.get("platform") for r in platforms if r.get("sessionStatus") == "needs_login"]
if needs:
    print("NEEDS_LOGIN " + ",".join(needs))
    sys.exit(0)
print("OK")
`,
    },
  },
  {
    slug: "caption-from-titles",
    skillMd: `---
name: Caption from titles
description: Turn suggested titles into a short social caption. Local Python, no network.
version: 1.0.0
tags: [social, copy]
category: content
provenance: builtin
permissions: [clients:read]
runtime: { python: "3.11", timeoutSec: 20, network: false }
---

# Caption from titles

Input JSON: \`{ "titles": ["..."], "clientName": "..." }\`

The Python script picks the first title, clips to 180 characters, and prints a caption.
Never fetch URLs. Never include secrets.
`,
    scripts: {
      "caption.py": `#!/usr/bin/env python3
import json, sys
raw = sys.stdin.read().strip() or "{}"
try:
    data = json.loads(raw)
except json.JSONDecodeError:
    print("invalid json", file=sys.stderr)
    sys.exit(2)
titles = data.get("titles") or []
name = (data.get("clientName") or "").strip()
title = str(titles[0] if titles else "New upload").strip()[:180]
prefix = f"{name}: " if name else ""
print(f"{prefix}{title}")
`,
    },
  },
  {
    slug: "clipping-ideation-pack",
    skillMd: `---
name: Clipping ideation pack
description: Long-form ideas + titles for one client. Strict 4-minute rule.
version: 1.0.0
tags: [clipping, ideation]
category: clipping
provenance: builtin
permissions: [clients:read, llm:invoke]
tools: [clipping.research_channel, clipping.generate_ideas, clipping.generate_titles]
runtime: { timeoutSec: 30, network: false }
---

# Clipping ideation pack

Inputs: \`clientId\`

1. \`clipping.research_channel\` — only videos ≥ 4 minutes
2. \`clipping.generate_ideas\` — persist 5 long-form ideas
3. \`clipping.generate_titles\` — 3 alternatives × last 5 long-form
4. Return \`{ ideas, titlesGrouped }\`

Never invent analytics. Never start the Social Machine.
`,
  },
  {
    slug: "clipping-thumbnail-pass",
    skillMd: `---
name: Clipping thumbnail pass
description: Critique existing thumb + generate a new 16:9 4K direction.
version: 1.0.0
tags: [clipping, thumbnail]
category: clipping
provenance: builtin
permissions: [clients:read, llm:invoke]
tools: [clipping.research_channel, vision.analyze, clipping.generate_thumbnail]
runtime: { timeoutSec: 60, network: false }
---

# Clipping thumbnail pass

Inputs: \`clientId\`, optional \`sessionId\`

1. Load client context
2. \`vision.analyze\` on the last thumbnail if an image URL exists
3. \`clipping.generate_thumbnail\` (Higgsfield nano-banana-pro, 16:9, 4K)
4. Return critique, imageUrl, and a rating prompt

Honest gap if Higgsfield is disconnected.
`,
  },
  {
    slug: "clipping-full-package",
    skillMd: `---
name: Clipping full package
description: End-to-end content package for one client. Tool-plan first; orchestrate.py exports package.json.
version: 1.0.0
tags: [clipping, package]
category: clipping
provenance: builtin
permissions: [clients:read, llm:invoke, progress:write]
tools: [clipping.research_channel, clipping.generate_ideas, clipping.generate_titles, clipping.generate_thumbnail, clipping.set_stage]
runtime: { python: "3.11", timeoutSec: 90, network: false, entrypoint: "scripts/orchestrate.py" }
---

# Clipping full package

Inputs: \`clientId\`, \`includeThumbnail\` (default true), \`includeStageSeed\` (default false)

1. Load client + long-form context (≥ 4 minutes)
2. Generate 5 ideas
3. Generate titles for latest long-form (3× last 5 if available)
4. Thumbnail direction + generation when includeThumbnail
5. Optionally set WAITING_FOR_FOOTAGE only if long-form is empty and includeStageSeed — notes required
6. Write package.json via scripts/orchestrate.py (script mode) or Agent COMPLETE

Never invent analytics. Never auto-start the Social Machine.

## orchestrate.py contract
- reads INPUT_PATH (inputs.json)
- env: SKILL_ID, SKILL_VERSION, INPUT_PATH, OUTPUT_DIR
- optional RPC: AGENCY_API_BASE + AGENCY_RUN_TOKEN (short-lived, skills:execute only)
- writes OUTPUT_DIR/package.json and OUTPUT_DIR/result.json
`,
    runtime: { python: "3.11", timeoutSec: 90, network: false, entrypoint: "scripts/orchestrate.py" },
    templates: {
      "caption.txt": "{{clientName}} — {{title}}\n\nLong-form clip. Not a Short.\n",
    },
    scripts: {
      "orchestrate.py": `#!/usr/bin/env python3
"""Assemble package.json from inputs. No network. No secrets."""
import json, os, sys
from pathlib import Path

out_dir = Path(os.environ.get("OUTPUT_DIR") or "output")
out_dir.mkdir(parents=True, exist_ok=True)
inp = Path(os.environ.get("INPUT_PATH") or "inputs.json")
raw = inp.read_text() if inp.exists() else (sys.stdin.read() or "{}")
try:
    data = json.loads(raw)
except json.JSONDecodeError:
    print("invalid json", file=sys.stderr)
    sys.exit(2)

secret_keys = ("key", "token", "secret", "password", "cookie", "authorization")
for k in list(data):
    if any(s in str(k).lower() for s in secret_keys):
        data.pop(k, None)

caption_path = Path("templates/caption.txt")
caption = ""
if caption_path.exists():
    caption = caption_path.read_text()[:500]
    name = str(data.get("clientName") or "")
    title = ""
    titles = data.get("titles") or data.get("titlesGrouped") or []
    if titles and isinstance(titles, list):
        first = titles[0]
        if isinstance(first, dict):
            alts = first.get("alternatives") or first.get("titles") or []
            title = str(alts[0] if alts else first.get("title") or "")
        else:
            title = str(first)
    caption = caption.replace("{{clientName}}", name).replace("{{title}}", title)

pkg = {
    "skillId": os.environ.get("SKILL_ID"),
    "skillVersion": os.environ.get("SKILL_VERSION"),
    "clientId": data.get("clientId"),
    "ideas": data.get("ideas") or [],
    "titles": data.get("titles") or data.get("titlesGrouped") or [],
    "thumbnailUrl": data.get("thumbnailUrl"),
    "notes": str(data.get("notes") or "")[:1000],
    "caption": (data.get("caption") or caption or "").strip()[:500],
}
(out_dir / "package.json").write_text(json.dumps(pkg, indent=2))
(out_dir / "result.json").write_text(json.dumps({"ok": True, "path": "package.json"}))
print(json.dumps(pkg))
`,
    },
  },
  {
    slug: "clipping-social-draft-distribute",
    skillMd: `---
name: Clipping social draft distribute
description: Queue draft social posts for publishable assets. Never auto-start the VM.
version: 1.0.0
tags: [clipping, social]
category: clipping
provenance: builtin
permissions: [clients:read, social:read, social:write]
tools: [social.get_machine_status, clipping.distribute_social]
runtime: { timeoutSec: 60, network: false }
---

# Social draft distribute

Inputs: \`clientId\`, optional \`platforms[]\`, \`assetId\`

1. \`social.get_machine_status\` — do not start
2. If stopped and auto_start_for_upload is off → MACHINE_STOPPED (waiting_resource)
3. \`clipping.distribute_social\` with mode=draft
4. Return jobIds[]

Respect session health. Escalate needs_login. Never type passwords.
`,
  },
  {
    slug: "clipping-social-verify",
    skillMd: `---
name: Clipping social verify
description: After upload, screenshot + vision-verify compose/success UI.
version: 1.0.0
tags: [clipping, social, vision]
category: clipping
provenance: builtin
permissions: [social:read]
tools: [social.get_upload_job, clipping.observe_desktop, vision.analyze]
runtime: { timeoutSec: 60, network: false }
---

# Social verify

Inputs: \`jobId\`

1. \`social.get_upload_job\`
2. \`clipping.observe_desktop\` / computer.screenshot
3. vision.analyze for success vs login wall vs error
4. Return \`{ ok, notes, screenshotRef }\`

If the Social Machine is stopped → waiting_resource. Never start it from this skill.
`,
  },
  {
    slug: "clipping-pipeline-nudge",
    skillMd: `---
name: Clipping pipeline nudge
description: Read progress + Discord-sourced stage; suggest next human action.
version: 1.0.0
tags: [clipping, pipeline]
category: clipping
provenance: builtin
permissions: [clients:read]
tools: [clipping.get_progress, get_dashboard_snapshot, clipping.set_stage]
runtime: { timeoutSec: 30, network: false }
---

# Pipeline nudge

Inputs: \`clientId\`

1. \`clipping.get_progress\` (label AI_DISCORD when source is Discord)
2. \`get_dashboard_snapshot\` for live context
3. Suggest the next human action
4. \`clipping.set_stage\` only with evidence/notes — never a silent jump

Do not invent analytics.
`,
  },
  {
    slug: "clipping-30d-guarantee-check",
    skillMd: `---
name: Clipping 30-day guarantee check
description: Single-client 30-day views check from AnalyticsSnapshots. Never invent data.
version: 1.0.0
tags: [clipping, analytics]
category: clipping
provenance: builtin
permissions: [clients:read, analytics:read]
tools: [clipping.guarantee_check]
runtime: { timeoutSec: 30, network: false }
---

# 30-day guarantee check

Inputs: \`clientId\`

1. Load ACTIVE client + startDate
2. Derive dayCount toward 30
3. Read AnalyticsSnapshots only — never fabricate views
4. Return \`{ dayCount, viewsSignal, escalation }\`

escalation is true when day ≥ 25 and views are not up (or data is insufficient past day 30).
`,
  },
  {
    slug: "clipping-agent-self-improve",
    skillMd: `---
name: Clipping agent self-improve
description: From a successful AgentRun, draft a pending_review skill.
version: 1.0.0
tags: [clipping, skills]
category: clipping
provenance: builtin
permissions: [llm:invoke]
tools: [clipping.propose_skill]
runtime: { timeoutSec: 60, network: false }
---

# Agent self-improve

Inputs: \`agentRunId\` (optional — defaults to last succeeded run)

1. Load the run plan + tool trace
2. \`clipping.propose_skill\` → skill_manage.create pending_review
3. Never auto-publish unless skills.auto_publish_agent is on (default off)

Only when the operator runs this preset or policy skills.propose_on_agent_success fires.
`,
  },
];
