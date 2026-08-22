import { listAuditLog } from "@/lib/server/autonomy-audit.server";
import { readPlaybookPolicies } from "@/lib/server/autonomy-policy.server";
import { readAppSetting, writeAppSetting } from "@/lib/server/app-settings.server";
import { routedText } from "@/lib/server/llm-router.server";
import { createSkillInternalFromDistill } from "@/lib/server/skills.server";

const DISTILLED_KEY = "SKILLS_DISTILLED_RUNS";

async function alreadyDistilled(runId: string): Promise<boolean> {
  const raw = await readAppSetting(DISTILLED_KEY);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) && parsed.includes(runId);
  } catch {
    return false;
  }
}

async function markDistilled(runId: string): Promise<void> {
  const raw = await readAppSetting(DISTILLED_KEY);
  let ids: string[] = [];
  try {
    ids = Array.isArray(JSON.parse(raw ?? "[]")) ? (JSON.parse(raw ?? "[]") as string[]) : [];
  } catch {
    ids = [];
  }
  ids = [runId, ...ids.filter((id) => id !== runId)].slice(0, 200);
  await writeAppSetting(DISTILLED_KEY, JSON.stringify(ids));
}

export async function maybeDistillSkillFromRun(input: {
  runId: string;
  playbookId?: string | null;
  actorLabel?: string | null;
}): Promise<void> {
  if (!input.runId) return;
  const policies = await readPlaybookPolicies();
  const minCalls = policies.skillsMinToolCallsToDistill ?? 5;
  if (await alreadyDistilled(input.runId)) return;
  const audit = await listAuditLog(80);
  const rows = audit.filter((row) => row.runId === input.runId && row.result === "ok");
  const tools = [...new Set(rows.map((row) => row.action))];
  if (tools.length < minCalls) return;
  await markDistilled(input.runId);

  const summary = rows
    .slice(0, 40)
    .map((row) => `- ${row.action}${row.entityType ? ` (${row.entityType})` : ""}`)
    .join("\n");

  let md: string;
  try {
    md = await routedText({
      feature: "skillAuthor",
      temperature: 0.3,
      maxTokens: 1200,
      messages: [
        {
          role: "system",
          content:
            "You write SKILL.md files for Agency Admin. Output ONLY markdown starting with YAML frontmatter. Never include API keys, tokens, passwords, or sandbox ids. Only reference tools from the provided list. permissions must be a subset of clients:read, social:read, social:write, analytics:read, llm:invoke. runtime.network must be false. provenance: agent.",
        },
        {
          role: "user",
          content: `Playbook: ${input.playbookId ?? "unknown"}\nTools used:\n${tools.join(", ")}\nTrace:\n${summary}\nWrite a reusable SKILL.md capturing this procedure.`,
        },
      ],
    });
  } catch {
    return;
  }
  if (!md.includes("---")) return;
  const auto = policies.skillsAutoPublishAgent === true;
  await createSkillInternalFromDistill({
    skillMd: md,
    autoPublish: auto,
    createdBy: input.actorLabel ?? "agent",
  });
}
