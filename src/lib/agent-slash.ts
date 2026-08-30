/** Slash commands for the Agent chat composer. No secrets. */

import { AGENT_PRESET_COPY, normalizePreset, type AgentPreset } from "./agent.ts";

export type AgentSlashCommand = {
  cmd: string;
  preset: AgentPreset;
  hint: string;
};

export const AGENT_SLASH_COMMANDS: readonly AgentSlashCommand[] = [
  { cmd: "/ideas", preset: "clipping-ideation-pack", hint: "Long-form ideas + titles" },
  { cmd: "/thumb", preset: "clipping-thumbnail-pass", hint: "Critique + generate a 16:9 thumb" },
  { cmd: "/package", preset: "clipping-full-package", hint: "End-to-end clip package" },
  { cmd: "/social", preset: "clipping-social-draft-distribute", hint: "Queue draft social posts" },
  { cmd: "/verify", preset: "clipping-social-verify", hint: "Verify an upload on the machine" },
  { cmd: "/nudge", preset: "clipping-pipeline-nudge", hint: "Next pipeline action with evidence" },
  { cmd: "/guarantee", preset: "clipping-30d-guarantee-check", hint: "30-day views check" },
  { cmd: "/improve", preset: "clipping-agent-self-improve", hint: "Draft a pending skill from a run" },
  { cmd: "/clip", preset: "clipping-full-package", hint: "Walk the clipping workflow" },
];

export const CLIPPING_WORKFLOW_STEPS = [
  { id: "client", title: "Pin a client", hint: "The walkthrough needs a client so research isn’t empty." },
  { id: "ideas", title: "Ideas + titles", command: "/ideas" },
  { id: "thumb", title: "Thumbnail pass", command: "/thumb" },
  { id: "package", title: "Full package", command: "/package" },
  { id: "social", title: "Draft social (optional)", command: "/social" },
] as const;

export function parseAgentSlash(input: string): {
  command: AgentSlashCommand | null;
  rest: string;
  matching: AgentSlashCommand[];
} {
  const trimmed = input.trimStart();
  if (!trimmed.startsWith("/")) return { command: null, rest: input, matching: [] };
  const space = trimmed.search(/\s/);
  const token = (space === -1 ? trimmed : trimmed.slice(0, space)).toLowerCase();
  const rest = space === -1 ? "" : trimmed.slice(space).trim();
  const matching = AGENT_SLASH_COMMANDS.filter((row) => row.cmd.startsWith(token));
  const command = AGENT_SLASH_COMMANDS.find((row) => row.cmd === token) ?? null;
  return { command, rest, matching };
}

export function goalFromSlash(command: AgentSlashCommand, rest: string): { preset: AgentPreset; goal: string } {
  const preset = normalizePreset(command.preset);
  const base = AGENT_PRESET_COPY[preset].goal;
  const extra = rest.trim();
  return { preset, goal: extra ? `${base}\n\nOperator note: ${extra}` : base };
}
