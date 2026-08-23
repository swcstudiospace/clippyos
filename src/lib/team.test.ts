import assert from "node:assert/strict";
import { test } from "node:test";
import type { Client, TeamMember } from "./entities.ts";
import {
  automationCoversClient,
  countsTowardCapacity,
  deriveTeam,
  mcpTokenStatus,
  parseTeamSettings,
} from "./team.ts";
import { perClientTeamCost, workspaceAutomationCost } from "./money.ts";

function client(id: string, name: string): Client {
  return {
    id,
    name,
    channelUrl: null,
    channelThumbnail: null,
    channelSummary: null,
    offers: null,
    contentStrategy: null,
    planType: "TEAM_ONLY",
    customPlanLabel: null,
    setupFee: "0",
    monthlyFee: "3000",
    startDate: "2026-01-01",
    status: "ACTIVE",
    discordServerId: null,
    googleAccountEmail: null,
    notes: null,
    suggestedTitles: null,
    suggestedIdeas: null,
    suggestedTitlesAt: null,
    suggestedIdeasAt: null,
    onboardingChecklist: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    createdBy: "u1",
    deletedAt: null,
  };
}

function human(partial: Partial<TeamMember> & Pick<TeamMember, "id" | "name" | "clientId">): TeamMember {
  return {
    role: "SHORT_FORM_EDITOR",
    cost: "2000",
    isAutomation: false,
    automationKind: null,
    botLabel: null,
    botRoleKey: null,
    mcpTokenId: null,
    mcpTokenLabel: null,
    runtimeHint: null,
    isActive: true,
    notes: null,
    assignedClientIds: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    createdBy: "u1",
    deletedAt: null,
    ...partial,
  };
}

function bot(partial: Partial<TeamMember> & Pick<TeamMember, "id" | "botLabel">): TeamMember {
  return {
    clientId: null,
    role: "AUTOMATION",
    name: partial.botLabel,
    cost: "0",
    isAutomation: true,
    automationKind: "GROK_BOT",
    botRoleKey: "CLIPPY_OPS",
    mcpTokenId: null,
    mcpTokenLabel: null,
    runtimeHint: "GROK_BOT",
    isActive: true,
    notes: null,
    assignedClientIds: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    createdBy: "u1",
    deletedAt: null,
    ...partial,
  };
}

const clients = [client("c1", "North"), client("c2", "South"), client("c3", "East"), client("c4", "West")];

test("capacity ignores automation seats even when bound to many clients", () => {
  const members = [
    human({ id: "h1", name: "Alex", clientId: "c1" }),
    human({ id: "h2", name: "Alex", clientId: "c2" }),
    human({ id: "h3", name: "Alex", clientId: "c3" }),
    human({ id: "h4", name: "Alex", clientId: "c4" }),
    bot({
      id: "b1",
      botLabel: "Clippy Ops",
      assignedClientIds: ["c1", "c2", "c3", "c4"],
    }),
  ];
  const derived = deriveTeam(clients, members);
  assert.equal(derived.assignedPeople, 1);
  assert.equal(derived.overloadedCount, 1);
  assert.equal(derived.capacity[0]?.name, "Alex");
  assert.equal(derived.aiActiveCount, 1);
  assert.equal(countsTowardCapacity(members[4]!), false);
  assert.equal(derived.lanes[0]?.aiTeammates.length, 1);
  assert.equal(derived.lanes[0]?.members.every((row) => !row.isAutomation), true);
});

test("disabled automation hides from active roster without deleting", () => {
  const members = [
    bot({ id: "b1", botLabel: "Clippy Ops", isActive: false }),
    bot({ id: "b2", botLabel: "Publish Desk", isActive: true }),
  ];
  const derived = deriveTeam(clients, members);
  assert.equal(derived.aiTeammates.length, 2);
  assert.equal(derived.aiActiveCount, 1);
  assert.equal(automationCoversClient(members[0]!, "c1"), false);
  assert.equal(automationCoversClient(members[1]!, "c1"), true);
});

test("profit cost ignores automation unless policy is on", () => {
  const members = [
    human({ id: "h1", name: "Alex", clientId: "c1", cost: "1500" }),
    bot({ id: "b1", botLabel: "Clippy Ops", cost: "400", assignedClientIds: ["c1"] }),
    bot({ id: "b2", botLabel: "Studio share", cost: "200", assignedClientIds: [] }),
  ];
  assert.equal(perClientTeamCost("c1", members, false), 1500);
  assert.equal(perClientTeamCost("c1", members, true), 1900);
  assert.equal(workspaceAutomationCost(members), 200);
});

test("token status flags revoked links", () => {
  const seat = bot({ id: "b1", botLabel: "Clippy Ops", mcpTokenId: "tok-1", mcpTokenLabel: "Grok Bot" });
  assert.equal(mcpTokenStatus(seat, []), "revoked");
  assert.equal(
    mcpTokenStatus(seat, [{ id: "tok-1", label: "Grok Bot", last4: "ab12", revokedAt: "2026-08-01", source: "mcp" }]),
    "revoked",
  );
  assert.equal(
    mcpTokenStatus(seat, [{ id: "tok-1", label: "Grok Bot", last4: "ab12", revokedAt: null, source: "mcp" }]),
    "linked",
  );
  assert.equal(mcpTokenStatus({ ...seat, mcpTokenId: null }, []), "missing");
});

test("team settings default show AI teammates and exclude automation cost", () => {
  const parsed = parseTeamSettings({});
  assert.equal(parsed.showAiTeammates, true);
  assert.equal(parsed.includeAutomationCostInMargin, false);
});

test("inactive humans drop out of capacity", () => {
  const members = [
    human({ id: "h1", name: "Alex", clientId: "c1", isActive: false }),
    human({ id: "h2", name: "Bea", clientId: "c1" }),
  ];
  const derived = deriveTeam(clients, members);
  assert.equal(derived.assignedPeople, 1);
  assert.equal(derived.capacity[0]?.name, "Bea");
  assert.equal(countsTowardCapacity(members[0]!), false);
});

test("covers-all automation attaches to every active client", () => {
  const members = [bot({ id: "b1", botLabel: "Clippy Ops", assignedClientIds: [] })];
  const derived = deriveTeam(clients, members);
  assert.equal(derived.lanes.every((lane) => lane.aiTeammates.length === 1), true);
  assert.equal(derived.overallCost, 0);
});

test("grokBotRosterJson notes parse as roster notes", () => {
  const parsed = parseTeamSettings({ grokBotRosterJson: { clippy: "Clippy Ops" } });
  assert.match(parsed.grokBotRosterNotes, /Clippy Ops/);
});
