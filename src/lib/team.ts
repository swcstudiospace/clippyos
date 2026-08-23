/** Live team allocation + capacity. Derived from Client + TeamMember only. */

import type {
  AutomationKind,
  AutomationRuntimeHint,
  BotRoleKey,
  Client,
  TeamMember,
} from "./entities.ts";
import { CAPACITY_OVERLOAD_THRESHOLD } from "./constants.ts";
import { asMoney, isActiveClient } from "./money.ts";

export const TEAM_QUERY_KEY = ["team"] as const;

export type TeamLane = {
  clientId: string;
  clientName: string;
  members: TeamMember[];
  aiTeammates: TeamMember[];
  totalCost: number;
};

export type CapacityRow = {
  key: string;
  name: string;
  clientCount: number;
  clientNames: string[];
  overloaded: boolean;
};

export type TeamSettings = {
  showAiTeammates: boolean;
  includeAutomationCostInMargin: boolean;
  grokBotRosterNotes: string;
};

export const DEFAULT_TEAM_SETTINGS: TeamSettings = {
  showAiTeammates: true,
  includeAutomationCostInMargin: false,
  grokBotRosterNotes: "",
};

export type LinkableToken = {
  id: string;
  label: string;
  last4: string;
  revokedAt: string | null;
  source: "mcp" | "hermes";
};

export type AiTeammatePreset = {
  botRoleKey: BotRoleKey;
  botLabel: string;
  automationKind: AutomationKind;
  runtimeHint: AutomationRuntimeHint;
  blurb: string;
};

export const AI_TEAMMATE_PRESETS: readonly AiTeammatePreset[] = [
  {
    botRoleKey: "CLIPPY_OPS",
    botLabel: "Clippy Ops",
    automationKind: "GROK_BOT",
    runtimeHint: "GROK_BOT",
    blurb: "Always-on operator. Claims Grok Bot work and keeps Command moving.",
  },
  {
    botRoleKey: "PUBLISH_DESK",
    botLabel: "Publish Desk",
    automationKind: "GROK_BOT",
    runtimeHint: "GROK_BOT",
    blurb: "Uploads and session logins on the premium computer.",
  },
  {
    botRoleKey: "CLIENT_SUCCESS",
    botLabel: "Client Success",
    automationKind: "GROK_BOT",
    runtimeHint: "GROK_BOT",
    blurb: "Follow-ups, briefs, and liaison — not a headcount seat.",
  },
  {
    botRoleKey: "ENG_BOT",
    botLabel: "Eng Bot",
    automationKind: "HERMES_WORKER",
    runtimeHint: "HERMES",
    blurb: "Hermes worker for Linear, skills, and failed-job tickets.",
  },
  {
    botRoleKey: "LEARNING_BOT",
    botLabel: "Learning Bot",
    automationKind: "HERMES_WORKER",
    runtimeHint: "HERMES",
    blurb: "Distills winning posts into pending_review skills.",
  },
  {
    botRoleKey: "REVENUE_OPS",
    botLabel: "Revenue Ops",
    automationKind: "GROK_BOT",
    runtimeHint: "GROK_BOT",
    blurb: "Collections queue and guarantee window — never auto mark-paid.",
  },
  {
    botRoleKey: "CUSTOM",
    botLabel: "",
    automationKind: "OTHER",
    runtimeHint: "AUTO",
    blurb: "Custom label. Link a ClippyOS MCP token after minting.",
  },
] as const;

export const AUTOMATION_KIND_LABELS: Record<AutomationKind, string> = {
  GROK_BOT: "Grok Bot",
  HERMES_WORKER: "Hermes",
  OTHER: "Other",
};

export const BOT_ROLE_LABELS: Record<BotRoleKey, string> = {
  CLIPPY_OPS: "Clippy Ops",
  PUBLISH_DESK: "Publish Desk",
  CLIENT_SUCCESS: "Client Success",
  ENG_BOT: "Eng Bot",
  LEARNING_BOT: "Learning Bot",
  REVENUE_OPS: "Revenue Ops",
  CUSTOM: "Custom",
};

export const RUNTIME_HINT_LABELS: Record<AutomationRuntimeHint, string> = {
  HERMES: "Hermes",
  GROK_BOT: "Grok Bot",
  AUTO: "Auto",
};

export type TeamDerived = {
  lanes: TeamLane[];
  capacity: CapacityRow[];
  overallCost: number;
  assignedPeople: number;
  overloadedCount: number;
  aiTeammates: TeamMember[];
  aiActiveCount: number;
};

export function parseTeamSettings(raw: unknown): TeamSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_TEAM_SETTINGS };
  const row = raw as Record<string, unknown>;
  return {
    showAiTeammates:
      row.showAiTeammates === undefined && row.show_ai_teammates === undefined
        ? true
        : row.showAiTeammates === true || row.show_ai_teammates === true,
    includeAutomationCostInMargin:
      row.includeAutomationCostInMargin === true ||
      row.include_automation_cost_in_margin === true,
    grokBotRosterNotes:
      typeof row.grokBotRosterNotes === "string"
        ? row.grokBotRosterNotes.slice(0, 4000)
        : typeof row.grok_bot_roster_notes === "string"
          ? row.grok_bot_roster_notes.slice(0, 4000)
          : typeof row.grokBotRosterJson === "string"
            ? row.grokBotRosterJson.slice(0, 4000)
            : typeof row.grok_bot_roster_json === "string"
              ? row.grok_bot_roster_json.slice(0, 4000)
              : row.grokBotRosterJson && typeof row.grokBotRosterJson === "object"
                ? JSON.stringify(row.grokBotRosterJson).slice(0, 4000)
                : "",
  };
}

export function isHumanSeat(member: TeamMember): boolean {
  return !member.isAutomation && !member.deletedAt;
}

export function isAutomationSeat(member: TeamMember): boolean {
  return member.isAutomation && !member.deletedAt;
}

export function isActiveAutomation(member: TeamMember): boolean {
  return isAutomationSeat(member) && member.isActive;
}

export function countsTowardCapacity(member: TeamMember): boolean {
  return isHumanSeat(member) && member.isActive;
}

export function automationCoversClient(member: TeamMember, clientId: string): boolean {
  if (!isActiveAutomation(member)) return false;
  if (member.clientId === clientId) return true;
  if (member.assignedClientIds.length === 0) return true;
  return member.assignedClientIds.includes(clientId);
}

export function automationDisplayName(member: TeamMember): string {
  const label = member.botLabel?.trim() || member.name.trim();
  return label || "AI teammate";
}

export function mcpTokenStatus(
  member: TeamMember,
  tokens: readonly LinkableToken[],
): "linked" | "revoked" | "missing" {
  if (!member.mcpTokenId) return "missing";
  const hit = tokens.find((row) => row.id === member.mcpTokenId);
  if (!hit) return "revoked";
  if (hit.revokedAt) return "revoked";
  return "linked";
}

export function deriveTeam(
  clients: Client[],
  members: TeamMember[],
): TeamDerived {
  const active = clients.filter(isActiveClient);
  const nameById = new Map(active.map((client) => [client.id, client.name]));
  const automations = members.filter(isAutomationSeat);

  const lanes: TeamLane[] = active.map((client) => {
    const team = members.filter(
      (member) => isHumanSeat(member) && member.clientId === client.id,
    );
    team.sort((a, b) => a.name.localeCompare(b.name) || a.role.localeCompare(b.role));
    const aiTeammates = automations
      .filter((member) => automationCoversClient(member, client.id))
      .sort((a, b) => automationDisplayName(a).localeCompare(automationDisplayName(b)));
    return {
      clientId: client.id,
      clientName: client.name,
      members: team,
      aiTeammates,
      totalCost: team.reduce((sum, member) => sum + asMoney(member.cost), 0),
    };
  });
  lanes.sort((a, b) => a.clientName.localeCompare(b.clientName));

  const people = new Map<string, { name: string; clients: Set<string> }>();
  for (const member of members) {
    if (!countsTowardCapacity(member)) continue;
    const clientName = member.clientId ? nameById.get(member.clientId) : undefined;
    if (!clientName) continue;
    const key = member.name.trim().toLowerCase();
    if (!key) continue;
    const record = people.get(key) ?? {
      name: member.name.trim(),
      clients: new Set<string>(),
    };
    record.clients.add(clientName);
    people.set(key, record);
  }

  const capacity: CapacityRow[] = [...people.values()].map((person) => {
    const clientNames = [...person.clients].sort((a, b) => a.localeCompare(b));
    return {
      key: person.name.toLowerCase(),
      name: person.name,
      clientCount: clientNames.length,
      clientNames,
      overloaded: clientNames.length > CAPACITY_OVERLOAD_THRESHOLD,
    };
  });
  capacity.sort(
    (a, b) => b.clientCount - a.clientCount || a.name.localeCompare(b.name),
  );

  const aiActiveCount = automations.filter((row) => row.isActive).length;

  return {
    lanes,
    capacity,
    overallCost: lanes.reduce((sum, lane) => sum + lane.totalCost, 0),
    assignedPeople: capacity.length,
    overloadedCount: capacity.filter((row) => row.overloaded).length,
    aiTeammates: [...automations].sort((a, b) =>
      automationDisplayName(a).localeCompare(automationDisplayName(b)),
    ),
    aiActiveCount,
  };
}

export { CAPACITY_OVERLOAD_THRESHOLD };
