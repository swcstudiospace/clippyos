import { useMemo, useState } from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AGENT_PRESET_COPY, isCrayoPreset, type AgentPreset } from "@/lib/agent";
import {
  AGENT_SLASH_COMMANDS,
  CLIPPING_WORKFLOW_STEPS,
  cardDraftFromSlash,
  goalFromSlash,
  parseAgentSlash,
  slashMissingArg,
  type AgentSlashCommand,
  type AgentSlashUi,
} from "@/lib/agent-slash";
import { cn } from "@/lib/utils";

type ClientOpt = { id: string; name: string };

export function AgentChatComposer({
  clientId,
  onClientId,
  clients,
  llmReady,
  crayoReady,
  starting,
  cancelling,
  canCancel,
  grokAvailable,
  runner,
  onRunner,
  onSubmit,
  onCancel,
  onOpenCard,
}: {
  clientId: string;
  onClientId: (id: string) => void;
  clients: ClientOpt[];
  llmReady: boolean;
  crayoReady: boolean;
  starting: boolean;
  cancelling: boolean;
  canCancel: boolean;
  grokAvailable: boolean;
  runner: "local" | "grok_bot";
  onRunner: (next: "local" | "grok_bot") => void;
  onSubmit: (input: { preset: AgentPreset; goal: string }) => void;
  onCancel: () => void;
  onOpenCard: (ui: AgentSlashUi, draft: Record<string, string>) => void;
}) {
  const [draft, setDraft] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [moreSlash, setMoreSlash] = useState(false);
  const parsed = useMemo(() => parseAgentSlash(draft), [draft]);
  const showMenu = draft.trimStart().startsWith("/") && !parsed.command;

  function canRun(preset: AgentPreset): boolean {
    if (isCrayoPreset(preset)) return crayoReady || llmReady;
    return llmReady;
  }

  function openFromCommand(command: AgentSlashCommand, rest: string) {
    if (!command.ui) return false;
    onOpenCard(command.ui, cardDraftFromSlash(command, rest));
    setDraft("");
    setHint(null);
    setWorkflowOpen(false);
    return true;
  }

  function send(raw: string) {
    const text = raw.trim();
    if (!text) return;
    const slash = parseAgentSlash(text);
    if (slash.command?.cmd === "/clip" && !slash.rest) {
      setWorkflowOpen(true);
      setHint("Walkthrough opened. Pin a client, then run each step.");
      return;
    }
    if (slash.command) {
      if (slash.command.cardOnly && slash.command.ui) {
        openFromCommand(slash.command, slash.rest);
        return;
      }
      const missing = slashMissingArg(slash.command, slash.rest);
      if (missing) {
        if (slash.command.ui) {
          openFromCommand(slash.command, slash.rest);
          setHint(missing);
          return;
        }
        setHint(missing);
        setDraft(`${slash.command.cmd} `);
        return;
      }
      if (slash.command.ui) {
        openFromCommand(slash.command, slash.rest);
        return;
      }
      if (!canRun(slash.command.preset)) {
        setHint(
          isCrayoPreset(slash.command.preset)
            ? "Crayo isn’t live on this deploy yet, so Crayo slash commands can’t mint. Planner commands still need Grok or OpenRouter."
            : "No planner AI is connected. Settings → LLM: SuperGrok OAuth, xAI API key, or OpenRouter. Only one of those actually runs /ideas and /package.",
        );
        return;
      }
      onSubmit(goalFromSlash(slash.command, slash.rest));
      setDraft("");
      setHint(null);
      setWorkflowOpen(false);
      return;
    }
    if (!llmReady) {
      setHint("Free-text goals need a planner (Grok or OpenRouter). Use /short topic for Crayo without the planner.");
      return;
    }
    onSubmit({ preset: "custom", goal: text });
    setDraft("");
    setHint(null);
  }

  function pickChip(row: AgentSlashCommand) {
    if (row.ui) {
      onOpenCard(row.ui, cardDraftFromSlash(row, ""));
      setHint(row.needsArg ?? row.hint);
      return;
    }
    if (row.needsArg) {
      setDraft(`${row.cmd} `);
      setHint(row.needsArg);
      return;
    }
    send(row.cmd);
  }

  const crayoCmds = AGENT_SLASH_COMMANDS.filter((row) => row.group === "crayo");
  const clippingCmds = AGENT_SLASH_COMMANDS.filter((row) => row.group === "clipping");

  return (
    <div className="rounded-card border border-border/70 bg-secondary-surface/40 p-3">
      {workflowOpen ? (
        <div className="mb-3 rounded-control bg-bg/60 p-3">
          <p className="text-body font-medium">Clipping walkthrough</p>
          <p className="text-caption text-muted">Pin a client, then run each step. Skip social if you only need the package.</p>
          <ol className="mt-2 flex flex-col gap-2">
            {CLIPPING_WORKFLOW_STEPS.map((step, index) => (
              <li key={step.id} className="flex items-center justify-between gap-2">
                <span className="text-caption">
                  {index + 1}. {step.title}
                  {"hint" in step && step.hint ? <span className="text-muted"> — {step.hint}</span> : null}
                </span>
                {"command" in step && step.command ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!clientId}
                    onClick={() => send(step.command)}
                  >
                    {step.command}
                  </Button>
                ) : null}
              </li>
            ))}
          </ol>
          <Button size="sm" variant="ghost" className="mt-2" onClick={() => setWorkflowOpen(false)}>
            Hide walkthrough
          </Button>
        </div>
      ) : null}

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Select value={clientId || "none"} onValueChange={(value) => onClientId(value === "none" ? "" : value)}>
          <SelectTrigger className="w-48" aria-label="Client">
            <SelectValue placeholder="Client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No client</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="ghost" onClick={() => setWorkflowOpen((open) => !open)}>
          /clip walkthrough
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Label htmlFor="agent-runner" className="text-caption text-muted">
            Grok Bot computer
          </Label>
          <Switch
            id="agent-runner"
            checked={runner === "grok_bot"}
            disabled={!grokAvailable}
            onCheckedChange={(on) => onRunner(on ? "grok_bot" : "local")}
          />
        </div>
      </div>
      {runner === "grok_bot" ? (
        <p className="mb-2 text-caption text-warning">
          Runs wait until the Grok Bot computer claims them. Leave this off to run here on ClippyOS.
        </p>
      ) : null}

      <div className="relative">
        {showMenu ? (
          <ul className="absolute bottom-full mb-1 max-h-64 w-full overflow-y-auto rounded-control border border-border bg-bg p-1 shadow-lg">
            {(parsed.matching.length ? parsed.matching : AGENT_SLASH_COMMANDS).map((row) => (
              <li key={row.cmd}>
                <button
                  type="button"
                  className="flex w-full items-baseline justify-between gap-2 rounded-control px-2 py-1.5 text-left hover:bg-secondary-surface"
                  onClick={() => pickChip(row)}
                >
                  <span className="font-mono text-caption">{row.cmd}</span>
                  <span className="text-caption text-muted">{row.hint}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <Textarea
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setHint(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send(draft);
            }
          }}
          rows={3}
          className="min-h-20 pr-24"
          placeholder="Ask Hermes, or /short  ·  /voice  ·  /image  ·  /autoclip"
          aria-label="Agent message"
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p className="text-caption text-muted">
          {hint ??
            (parsed.command
              ? (slashMissingArg(parsed.command, parsed.rest) ?? AGENT_PRESET_COPY[parsed.command.preset].hint)
              : "Enter sends. Crayo slash commands open a specialty card. Free text uses the planner.")}
        </p>
        <div className="ml-auto flex gap-2">
          {canCancel ? (
            <Button variant="secondary" onClick={onCancel} disabled={cancelling} className="min-h-11">
              <Square className="size-4" aria-hidden="true" />
              Cancel
            </Button>
          ) : null}
          <Button onClick={() => send(draft)} disabled={starting || !draft.trim()} className="min-h-11">
            <Play className="size-4" aria-hidden="true" />
            {starting ? "Sending…" : "Send"}
          </Button>
        </div>
      </div>
      <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Slash shortcuts">
        {crayoCmds.map((row) => (
          <li key={row.cmd}>
            <button
              type="button"
              className={cn("rounded-full bg-secondary-surface px-2.5 py-1 font-mono text-caption text-muted")}
              onClick={() => pickChip(row)}
            >
              {row.cmd}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-1 text-caption text-muted underline-offset-2 hover:underline"
        onClick={() => setMoreSlash((open) => !open)}
      >
        {moreSlash ? "Hide clipping commands" : "More clipping commands"}
      </button>
      {moreSlash ? (
        <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label="Clipping slash shortcuts">
          {clippingCmds.map((row) => (
            <li key={row.cmd}>
              <button
                type="button"
                className={cn("rounded-full bg-secondary-surface px-2.5 py-1 font-mono text-caption text-muted")}
                onClick={() => pickChip(row)}
              >
                {row.cmd}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
