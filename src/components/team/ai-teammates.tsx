import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, KeyRound, Plus, Unplug } from "lucide-react";
import { toast } from "sonner";
import type { Client, TeamMember } from "@/lib/entities";
import {
  AI_TEAMMATE_PRESETS,
  AUTOMATION_KIND_LABELS,
  BOT_ROLE_LABELS,
  RUNTIME_HINT_LABELS,
  TEAM_QUERY_KEY,
  automationDisplayName,
  mcpTokenStatus,
  type AiTeammatePreset,
  type LinkableToken,
  type TeamSettings,
} from "@/lib/team";
import { MONEY_QUERY_KEY } from "@/lib/money";
import { formatUsd } from "@/lib/format";
import { userFacingErrorMessage } from "@/lib/errors";
import {
  createAiTeammateFn,
  linkAiTeammateTokenFn,
  removeAiTeammateFn,
  saveTeamSettingsFn,
  setAiTeammateActiveFn,
  updateAiTeammateFn,
} from "@/lib/server/team-fns";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function invalidateTeam(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: TEAM_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: MONEY_QUERY_KEY });
}

export function AiTeammatesPanel({
  members,
  tokens,
  clients,
  settings,
  canEdit,
  loading,
}: {
  members: TeamMember[];
  tokens: LinkableToken[];
  clients: Client[];
  settings: TeamSettings;
  canEdit: boolean;
  loading: boolean;
}) {
  const queryClient = useQueryClient();
  const [editor, setEditor] = useState<"create" | TeamMember | null>(null);
  const [linkTarget, setLinkTarget] = useState<TeamMember | null>(null);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [tokenId, setTokenId] = useState<string>("none");

  const saveSettings = useMutation({
    mutationFn: (patch: Partial<TeamSettings>) => saveTeamSettingsFn({ data: patch }),
    onSuccess: () => invalidateTeam(queryClient),
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const setActive = useMutation({
    mutationFn: (input: { id: string; isActive: boolean }) => setAiTeammateActiveFn({ data: input }),
    onSuccess: (member) => {
      toast.success(member.isActive ? `${automationDisplayName(member)} is on the roster` : `${automationDisplayName(member)} hidden from load`);
      invalidateTeam(queryClient);
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const link = useMutation({
    mutationFn: () =>
      linkAiTeammateTokenFn({
        data: { id: linkTarget!.id, mcpTokenId: tokenId === "none" ? null : tokenId },
      }),
    onSuccess: () => {
      toast.success("Token link saved");
      setLinkTarget(null);
      invalidateTeam(queryClient);
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => removeAiTeammateFn({ data: id }),
    onSuccess: () => {
      toast.success("AI teammate removed");
      setRemoveTarget(null);
      invalidateTeam(queryClient);
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const liveTokens = tokens.filter((row) => !row.revokedAt);

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-40 rounded-card" />
        <Skeleton className="h-40 rounded-card" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <GlassCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-card font-semibold tracking-tight">AI teammates</h2>
            <p className="mt-1 max-w-2xl text-caption text-muted">
              Grok Bot and Hermes workers sit on the roster for visibility. They do not count as
              headcount, overload, or margin unless you allocate a cost below.
            </p>
          </div>
          {canEdit ? (
            <Button className="min-h-11 shrink-0" onClick={() => setEditor("create")}>
              <Plus className="size-4" aria-hidden="true" />
              Add AI teammate
            </Button>
          ) : null}
        </div>
        {canEdit ? (
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 rounded-control bg-secondary-surface/50 px-3 py-3">
              <div>
                <Label htmlFor="team-show-ai">Show AI teammates</Label>
                <p className="text-caption text-muted">Hides the grid. Capacity still ignores bots.</p>
              </div>
              <Switch
                id="team-show-ai"
                checked={settings.showAiTeammates}
                onCheckedChange={(checked) => saveSettings.mutate({ showAiTeammates: checked })}
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-control bg-secondary-surface/50 px-3 py-3">
              <div>
                <Label htmlFor="team-ai-cost">Include automation cost in margin</Label>
                <p className="text-caption text-muted">Off by default. Turn on to allocate a SuperGrok share.</p>
              </div>
              <Switch
                id="team-ai-cost"
                checked={settings.includeAutomationCostInMargin}
                onCheckedChange={(checked) =>
                  saveSettings.mutate({ includeAutomationCostInMargin: checked })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="team-roster-notes">Roster notes</Label>
              <Textarea
                id="team-roster-notes"
                defaultValue={settings.grokBotRosterNotes}
                className="min-h-20"
                placeholder="Expected Grok Bot names as they appear in the Bot app"
                onBlur={(event) => {
                  const next = event.target.value;
                  if (next === settings.grokBotRosterNotes) return;
                  saveSettings.mutate({ grokBotRosterNotes: next });
                }}
              />
            </div>
          </div>
        ) : null}
        <p className="mt-3 text-caption text-muted">
          Mint tokens in{" "}
          <Link to="/settings" hash="clippy-mcp" className="text-accent underline-offset-2 hover:underline">
            Settings → ClippyOS MCP
          </Link>
          . Link the id here — never the bearer secret.
        </p>
      </GlassCard>

      {!settings.showAiTeammates ? (
        <EmptyState
          title="AI teammates hidden"
          description="Turn Show AI teammates on to see the roster. Bots still stay out of human load."
        />
      ) : members.length === 0 ? (
        <EmptyState
          title="No AI teammates yet"
          description="Seed Clippy Ops, Publish Desk, or a custom bot. They appear here, not in capacity."
          action={
            canEdit ? (
              <Button onClick={() => setEditor("create")}>
                <Plus className="size-4" aria-hidden="true" />
                Add AI teammate
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {members.map((member) => {
            const status = mcpTokenStatus(member, tokens);
            return (
              <li key={member.id}>
                <GlassCard className={!member.isActive ? "opacity-70" : undefined}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-control bg-secondary-surface">
                        <Bot className="size-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium tracking-tight">{automationDisplayName(member)}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge tone="teal">Automation</Badge>
                          {member.automationKind ? (
                            <Badge tone="blue">{AUTOMATION_KIND_LABELS[member.automationKind]}</Badge>
                          ) : null}
                          {member.botRoleKey ? (
                            <Badge tone="neutral">{BOT_ROLE_LABELS[member.botRoleKey]}</Badge>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    {canEdit ? (
                      <Switch
                        checked={member.isActive}
                        onCheckedChange={(checked) =>
                          setActive.mutate({ id: member.id, isActive: checked })
                        }
                        aria-label={`${member.isActive ? "Disable" : "Enable"} ${automationDisplayName(member)}`}
                      />
                    ) : (
                      <Badge tone={member.isActive ? "green" : "neutral"}>
                        {member.isActive ? "Active" : "Disabled"}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-3 text-caption text-muted">
                    {status === "linked"
                      ? `Token · ${member.mcpTokenLabel ?? "linked"}`
                      : status === "revoked"
                        ? "Token revoked — relink"
                        : "No token linked"}
                    {member.runtimeHint ? ` · ${RUNTIME_HINT_LABELS[member.runtimeHint]}` : ""}
                  </p>
                  <p className="mt-1 text-caption text-muted">
                    {member.assignedClientIds.length === 0
                      ? "Covers all clients"
                      : `${member.assignedClientIds.length} client${member.assignedClientIds.length === 1 ? "" : "s"}`}
                    {settings.includeAutomationCostInMargin && Number(member.cost) > 0
                      ? ` · ${formatUsd(member.cost)} / mo`
                      : ""}
                  </p>
                  {canEdit ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setEditor(member)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setTokenId(member.mcpTokenId ?? "none");
                          setLinkTarget(member);
                        }}
                      >
                        <KeyRound className="size-4" aria-hidden="true" />
                        Link MCP token
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setRemoveTarget(member)}>
                        Remove
                      </Button>
                    </div>
                  ) : null}
                </GlassCard>
              </li>
            );
          })}
        </ul>
      )}

      <SeatEditor
        open={editor !== null}
        member={editor === "create" || editor == null ? null : editor}
        clients={clients}
        tokens={liveTokens}
        onClose={() => setEditor(null)}
        onSaved={() => {
          setEditor(null);
          invalidateTeam(queryClient);
        }}
      />

      <Dialog open={Boolean(linkTarget)} onOpenChange={(open) => !open && setLinkTarget(null)}>
        <DialogContent>
          <DialogTitle>Link MCP token</DialogTitle>
          <DialogDescription>
            Pick a ClippyOS MCP or Hermes key. The bearer secret never lands on the teammate record.
          </DialogDescription>
          <div className="mt-4 flex flex-col gap-1.5">
            <Label htmlFor="ai-token">Token</Label>
            <Select value={tokenId} onValueChange={setTokenId}>
              <SelectTrigger id="ai-token">
                <SelectValue placeholder="No token" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No token linked</SelectItem>
                {liveTokens.map((token) => (
                  <SelectItem key={token.id} value={token.id}>
                    {token.label} · {token.source === "mcp" ? "MCP" : "Hermes"} · {token.last4}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="mt-4 min-h-11 w-full" onClick={() => link.mutate()} disabled={link.isPending}>
            Save link
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(removeTarget)} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <DialogContent>
          <DialogTitle>Remove {removeTarget ? automationDisplayName(removeTarget) : "AI teammate"}?</DialogTitle>
          <DialogDescription>
            Soft-deletes the seat. History stays. This does not revoke the MCP token.
          </DialogDescription>
          <Button
            className="mt-4 min-h-11 w-full"
            variant="destructive"
            onClick={() => removeTarget && remove.mutate(removeTarget.id)}
            disabled={remove.isPending}
          >
            <Unplug className="size-4" aria-hidden="true" />
            Remove from roster
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SeatEditor({
  open,
  member,
  clients,
  tokens,
  onClose,
  onSaved,
}: {
  open: boolean;
  member: TeamMember | null;
  clients: Client[];
  tokens: LinkableToken[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [preset, setPreset] = useState<AiTeammatePreset>(AI_TEAMMATE_PRESETS[0]!);
  const [botLabel, setBotLabel] = useState("");
  const [kind, setKind] = useState(preset.automationKind);
  const [roleKey, setRoleKey] = useState(preset.botRoleKey);
  const [runtime, setRuntime] = useState(preset.runtimeHint);
  const [tokenId, setTokenId] = useState("none");
  const [cost, setCost] = useState("0");
  const [notes, setNotes] = useState("");
  const [coversAll, setCoversAll] = useState(true);
  const [assigned, setAssigned] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    if (member) {
      setBotLabel(member.botLabel || member.name);
      setKind(member.automationKind ?? "GROK_BOT");
      setRoleKey(member.botRoleKey ?? "CUSTOM");
      setRuntime(member.runtimeHint ?? "AUTO");
      setTokenId(member.mcpTokenId ?? "none");
      setCost(member.cost ?? "0");
      setNotes(member.notes ?? "");
      setCoversAll(member.assignedClientIds.length === 0);
      setAssigned(member.assignedClientIds);
    } else {
      const seed = AI_TEAMMATE_PRESETS[0]!;
      setPreset(seed);
      setBotLabel(seed.botLabel);
      setKind(seed.automationKind);
      setRoleKey(seed.botRoleKey);
      setRuntime(seed.runtimeHint);
      setTokenId("none");
      setCost("0");
      setNotes("");
      setCoversAll(true);
      setAssigned([]);
    }
  }, [open, member]);

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        botLabel: botLabel.trim(),
        automationKind: kind,
        botRoleKey: roleKey,
        runtimeHint: runtime,
        mcpTokenId: tokenId === "none" ? null : tokenId,
        cost: Number(cost) || 0,
        notes: notes.trim() || null,
        assignedClientIds: coversAll ? [] : assigned,
      };
      return member
        ? updateAiTeammateFn({ data: { id: member.id, ...payload } })
        : createAiTeammateFn({ data: payload });
    },
    onSuccess: (result) => {
      toast.success(member ? "AI teammate updated" : `${automationDisplayName(result)} added`);
      onSaved();
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  function applyPreset(next: AiTeammatePreset) {
    setPreset(next);
    setRoleKey(next.botRoleKey);
    setKind(next.automationKind);
    setRuntime(next.runtimeHint);
    if (next.botLabel) setBotLabel(next.botLabel);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="md:w-[min(100%-2rem,32rem)]">
        <DialogTitle>{member ? "Edit AI teammate" : "Add AI teammate"}</DialogTitle>
        <DialogDescription>
          No staff password. Link a ClippyOS MCP token after you mint it in Settings.
        </DialogDescription>
        {!member ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {AI_TEAMMATE_PRESETS.map((row) => (
              <button
                key={row.botRoleKey}
                type="button"
                onClick={() => applyPreset(row)}
                className={
                  preset.botRoleKey === row.botRoleKey
                    ? "min-h-11 rounded-full bg-accent px-3 text-caption text-accent-fg"
                    : "min-h-11 rounded-full bg-secondary-surface px-3 text-caption"
                }
              >
                {row.botLabel || "Custom"}
              </button>
            ))}
          </div>
        ) : null}
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (botLabel.trim()) save.mutate();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-label">Bot label</Label>
            <Input
              id="ai-label"
              value={botLabel}
              onChange={(event) => setBotLabel(event.target.value)}
              placeholder="Clippy Ops"
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ai-kind">Kind</Label>
              <Select value={kind} onValueChange={(value) => setKind(value as typeof kind)}>
                <SelectTrigger id="ai-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AUTOMATION_KIND_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ai-runtime">Runtime</Label>
              <Select value={runtime} onValueChange={(value) => setRuntime(value as typeof runtime)}>
                <SelectTrigger id="ai-runtime">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RUNTIME_HINT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-role">Roster role</Label>
            <Select value={roleKey} onValueChange={(value) => setRoleKey(value as typeof roleKey)}>
              <SelectTrigger id="ai-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(BOT_ROLE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-token-edit">MCP token</Label>
            <Select value={tokenId} onValueChange={setTokenId}>
              <SelectTrigger id="ai-token-edit">
                <SelectValue placeholder="Link later" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Link later</SelectItem>
                {tokens.map((token) => (
                  <SelectItem key={token.id} value={token.id}>
                    {token.label} · {token.source === "mcp" ? "MCP" : "Hermes"} · {token.last4}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-control bg-secondary-surface/50 px-3 py-3">
            <div>
              <Label htmlFor="ai-covers">Covers all clients</Label>
              <p className="text-caption text-muted">Off = pick specific clients. Still not a load seat.</p>
            </div>
            <Switch id="ai-covers" checked={coversAll} onCheckedChange={setCoversAll} />
          </div>
          {!coversAll ? (
            <ul className="grid max-h-40 gap-2 overflow-y-auto">
              {clients.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3">
                  <Label htmlFor={`ai-client-${row.id}`}>{row.name}</Label>
                  <Switch
                    id={`ai-client-${row.id}`}
                    checked={assigned.includes(row.id)}
                    onCheckedChange={(checked) =>
                      setAssigned((current) =>
                        checked ? [...current, row.id] : current.filter((id) => id !== row.id),
                      )
                    }
                  />
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-cost">Allocated monthly cost</Label>
            <Input
              id="ai-cost"
              inputMode="decimal"
              value={cost}
              onChange={(event) => setCost(event.target.value)}
            />
            <p className="text-caption text-muted">Default 0. Only hits Money if the margin toggle is on.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-notes">Notes</Label>
            <Textarea
              id="ai-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-20"
              placeholder="Match the name in the Grok Bot UI"
            />
          </div>
          <Button type="submit" className="min-h-11" disabled={save.isPending || !botLabel.trim()}>
            {member ? "Save" : "Add to roster"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
