/** Slash commands for the Agent chat composer. No secrets. */

import { AGENT_PRESET_COPY, normalizePreset, type AgentPreset } from "./agent.ts";
import {
  buildCrayoAutoclipGoal,
  buildCrayoExportGoal,
  buildCrayoImageGoal,
  buildCrayoImportGoal,
  buildCrayoIngestGoal,
  buildCrayoShortGoal,
  buildCrayoVoiceoverGoal,
} from "./agent-crayo.ts";

export type AgentSlashUi =
  | "short"
  | "autoclip"
  | "voiceover"
  | "image"
  | "import"
  | "export"
  | "ingest"
  | "voices"
  | "account"
  | "assets";

export type AgentSlashGroup = "crayo" | "clipping";

export type AgentSlashCommand = {
  cmd: string;
  preset: AgentPreset;
  hint: string;
  group: AgentSlashGroup;
  needsArg?: string;
  /** Generative UI card that pops into the thread. */
  ui?: AgentSlashUi;
  /** Read-only specialty: open a card, never start a run. */
  cardOnly?: boolean;
};

export const AGENT_SLASH_COMMANDS: readonly AgentSlashCommand[] = [
  { cmd: "/short", preset: "crayo-short", hint: "Make a 9:16 short", group: "crayo", needsArg: "topic after the command", ui: "short" },
  { cmd: "/autoclip", preset: "crayo-autoclip", hint: "AutoClip a long https URL", group: "crayo", needsArg: "https:// video URL", ui: "autoclip" },
  { cmd: "/voice", preset: "crayo-voiceover", hint: "Generate a voiceover", group: "crayo", needsArg: "spoken script", ui: "voiceover" },
  { cmd: "/voiceover", preset: "crayo-voiceover", hint: "Generate a voiceover", group: "crayo", needsArg: "spoken script", ui: "voiceover" },
  { cmd: "/image", preset: "crayo-image", hint: "Generate a 9:16 still", group: "crayo", needsArg: "image prompt", ui: "image" },
  { cmd: "/voices", preset: "custom", hint: "Browse Crayo voices", group: "crayo", ui: "voices", cardOnly: true },
  { cmd: "/account", preset: "custom", hint: "Crayo plan + credits", group: "crayo", ui: "account", cardOnly: true },
  { cmd: "/import", preset: "crayo-import", hint: "Import a public https file", group: "crayo", needsArg: "https:// file URL", ui: "import" },
  { cmd: "/export", preset: "crayo-export", hint: "Export a Crayo project", group: "crayo", needsArg: "project id", ui: "export" },
  { cmd: "/assets", preset: "custom", hint: "List Crayo assets", group: "crayo", ui: "assets", cardOnly: true },
  { cmd: "/ingest", preset: "crayo-ingest", hint: "Crayo CDN → library", group: "crayo", needsArg: "https:// Crayo CDN URL", ui: "ingest" },
  { cmd: "/ideas", preset: "clipping-ideation-pack", hint: "Long-form ideas + titles", group: "clipping" },
  { cmd: "/thumb", preset: "clipping-thumbnail-pass", hint: "Critique + generate a 16:9 thumb", group: "clipping" },
  { cmd: "/package", preset: "clipping-full-package", hint: "End-to-end clip package", group: "clipping" },
  { cmd: "/social", preset: "clipping-social-draft-distribute", hint: "Queue draft social posts", group: "clipping" },
  { cmd: "/verify", preset: "clipping-social-verify", hint: "Verify an upload on the machine", group: "clipping" },
  { cmd: "/nudge", preset: "clipping-pipeline-nudge", hint: "Next pipeline action with evidence", group: "clipping" },
  { cmd: "/guarantee", preset: "clipping-30d-guarantee-check", hint: "30-day views check", group: "clipping" },
  { cmd: "/improve", preset: "clipping-agent-self-improve", hint: "Draft a pending skill from a run", group: "clipping" },
  { cmd: "/clip", preset: "clipping-full-package", hint: "Walk the clipping workflow", group: "clipping" },
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

export function slashMissingArg(command: AgentSlashCommand, rest: string): string | null {
  if (!command.needsArg) return null;
  if (command.cmd === "/autoclip" || command.cmd === "/import" || command.cmd === "/ingest") {
    if (!rest.startsWith("https://")) {
      if (command.cmd === "/ingest") return "Paste a Crayo CDN https URL: /ingest https://cdn-crayo.com/…";
      if (command.cmd === "/import") return "Paste a public https file URL: /import https://…";
      return "Paste a public https video URL: /autoclip https://…";
    }
    return null;
  }
  if (command.cmd === "/short" && !rest.trim()) {
    return "Add a topic: /short three habits that ruin mornings";
  }
  if ((command.cmd === "/voice" || command.cmd === "/voiceover") && !rest.trim()) {
    return "Add a script: /voice Hey — three habits that quietly ruin mornings.";
  }
  if (command.cmd === "/image" && !rest.trim()) {
    return "Add a prompt: /image neon skyline, 9:16, cinematic still";
  }
  if (command.cmd === "/export" && !rest.trim()) {
    return "Add a project id: /export proj_…";
  }
  return null;
}

export function cardDraftFromSlash(command: AgentSlashCommand, rest: string): Record<string, string> {
  const extra = rest.trim();
  switch (command.ui) {
    case "short":
      return { topic: extra, script: "" };
    case "autoclip": {
      const url = extra.split(/\s+/).find((part) => part.startsWith("https://")) ?? extra;
      return { url, clipCount: "5" };
    }
    case "voiceover":
      return { script: extra, voiceId: "", title: "" };
    case "image":
      return { prompt: extra, aspectRatio: "9:16" };
    case "import": {
      const url = extra.split(/\s+/).find((part) => part.startsWith("https://")) ?? extra;
      return { url, name: "" };
    }
    case "export":
      return { projectId: extra };
    case "ingest": {
      const url = extra.split(/\s+/).find((part) => part.startsWith("https://")) ?? extra;
      return { url, title: "" };
    }
    default:
      return {};
  }
}

export function goalFromSlash(command: AgentSlashCommand, rest: string): { preset: AgentPreset; goal: string } {
  const preset = normalizePreset(command.preset);
  const extra = rest.trim();
  if (preset === "crayo-short") {
    return { preset, goal: buildCrayoShortGoal({ topic: extra, script: "" }) };
  }
  if (preset === "crayo-autoclip") {
    const url = extra.split(/\s+/).find((part) => part.startsWith("https://")) ?? extra;
    return { preset, goal: buildCrayoAutoclipGoal({ url, clipCount: 5 }) };
  }
  if (preset === "crayo-voiceover") {
    return { preset, goal: buildCrayoVoiceoverGoal({ script: extra, voiceId: "" }) };
  }
  if (preset === "crayo-image") {
    return { preset, goal: buildCrayoImageGoal({ prompt: extra, aspectRatio: "9:16" }) };
  }
  if (preset === "crayo-import") {
    const url = extra.split(/\s+/).find((part) => part.startsWith("https://")) ?? extra;
    return { preset, goal: buildCrayoImportGoal({ url }) };
  }
  if (preset === "crayo-export") {
    return { preset, goal: buildCrayoExportGoal({ projectId: extra }) };
  }
  if (preset === "crayo-ingest") {
    const url = extra.split(/\s+/).find((part) => part.startsWith("https://")) ?? extra;
    return { preset, goal: buildCrayoIngestGoal({ url }) };
  }
  const base = AGENT_PRESET_COPY[preset].goal;
  return { preset, goal: extra ? `${base}\n\nOperator note: ${extra}` : base };
}
