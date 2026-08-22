import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Copy, PlugZap, Unplug } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ErrorState } from "@/components/ui/error-state";
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
import { copyTextToClipboard } from "@/lib/clipboard";
import { userFacingErrorMessage } from "@/lib/errors";
import { INTEGRATIONS_QUERY_KEY } from "@/lib/integrations";
import {
  LINEAR_COLUMN_HINTS,
  LINEAR_COLUMN_LABELS,
  LINEAR_KANBAN_COLUMNS,
  LINEAR_QUERY_KEY,
  type LinearKanbanColumn,
  type LinearPublicStatus,
  type LinearWorkflowState,
} from "@/lib/linear";
import {
  disconnectLinearFn,
  ensureLinearMilestonesFn,
  getLinearStatusFn,
  loadLinearCatalogFn,
  saveLinearApiKeyFn,
  saveLinearBindingFn,
  saveLinearOauthAppFn,
  startLinearOAuthFn,
  testLinearFn,
} from "@/lib/server/linear-fns";

const GUIDE_STEPS = [
  {
    title: "Create a Linear API key (or OAuth app)",
    body: "Linear Settings → API. Create a personal API key, or an OAuth application with read + write + issues:create. Prefer a dedicated “AI Clipping Dashboard” project.",
  },
  {
    title: "Paste the key, Test Connection",
    body: "Paste the API key here (never shown again in full). Test fetches viewer, teams, and projects. OAuth is optional if you saved a Linear app Client ID + secret.",
  },
  {
    title: "Select Team + Project",
    body: "Bind the Agency Admin team and the AI Clipping Dashboard project. Issues created from failed jobs land there.",
  },
  {
    title: "Map Kanban columns",
    body: "Map Backlog, Ready, In Progress, In Review, and Done to Linear workflow states. Load workflow states if the dropdowns are empty.",
  },
];

function healthLabel(health: LinearPublicStatus["health"]): string {
  if (health === "connected") return "Connected";
  if (health === "error") return "Error";
  if (health === "saved") return "Saved";
  return "Not configured";
}

export function LinearPanel() {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [catalog, setCatalog] = useState<{
    teams: LinearPublicStatus["teams"];
    projects: LinearPublicStatus["projects"];
    states: LinearWorkflowState[];
  } | null>(null);

  const query = useQuery({
    queryKey: LINEAR_QUERY_KEY,
    queryFn: () => getLinearStatusFn(),
  });

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { source?: string; ok?: boolean; error?: string };
      if (!data || data.source !== "clippy-linear-oauth") return;
      void queryClient.invalidateQueries({ queryKey: LINEAR_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
      if (data.ok) toast.success("Linear connected");
      else toast.error(data.error || "Couldn’t connect Linear");
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [queryClient]);

  const saveKey = useMutation({
    mutationFn: () => saveLinearApiKeyFn({ data: { apiKey } }),
    onSuccess: async () => {
      setApiKey("");
      toast.success("Linear API key saved");
      await queryClient.invalidateQueries({ queryKey: LINEAR_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const saveOauth = useMutation({
    mutationFn: () => saveLinearOauthAppFn({ data: { clientId, clientSecret } }),
    onSuccess: async () => {
      setClientId("");
      setClientSecret("");
      toast.success("Linear OAuth app saved");
      await queryClient.invalidateQueries({ queryKey: LINEAR_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const test = useMutation({
    mutationFn: () => testLinearFn(),
    onSuccess: async (status) => {
      setCatalog({ teams: status.teams, projects: status.projects, states: status.states });
      toast.success(status.viewerName ? `Connected as ${status.viewerName}` : "Connected");
      await queryClient.invalidateQueries({ queryKey: LINEAR_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const load = useMutation({
    mutationFn: (teamId?: string) => loadLinearCatalogFn({ data: { teamId } }),
    onSuccess: (data) => setCatalog(data),
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const bind = useMutation({
    mutationFn: saveLinearBindingFn,
    onSuccess: async () => {
      toast.success("Linear mapping saved");
      await queryClient.invalidateQueries({ queryKey: LINEAR_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const disconnect = useMutation({
    mutationFn: () => disconnectLinearFn(),
    onSuccess: async () => {
      setDisconnectOpen(false);
      setCatalog(null);
      toast.success("Linear disconnected");
      await queryClient.invalidateQueries({ queryKey: LINEAR_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const oauth = useMutation({
    mutationFn: () => startLinearOAuthFn(),
    onSuccess: async (data) => {
      const popup = window.open(data.url, "clippy-linear-oauth", "popup=yes,width=560,height=740");
      if (!popup) {
        const ok = await copyTextToClipboard(data.url);
        toast.message(
          ok
            ? "Pop-up blocked — the connect URL is copied. Open it in a new tab."
            : "Pop-up blocked. Allow pop-ups, then Connect Linear again.",
        );
      }
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const milestones = useMutation({
    mutationFn: () => ensureLinearMilestonesFn(),
    onSuccess: async (data) => {
      toast.success(`Milestones ready · ${data.items.length}`);
      await queryClient.invalidateQueries({ queryKey: LINEAR_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  if (query.isPending) return <Skeleton className="h-72 w-full" />;
  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Couldn’t load Linear"
        description="Retry in a moment."
        onRetry={() => void query.refetch()}
      />
    );
  }

  const status = query.data;
  const teams = catalog?.teams.length ? catalog.teams : status.teams;
  const projects = catalog?.projects.length ? catalog.projects : status.projects;
  const states = catalog?.states.length ? catalog.states : status.states;
  const configured = status.configured;

  function patchFlags(patch: Partial<typeof status.flags>) {
    bind.mutate({ data: { flags: { ...status.flags, ...patch } } });
  }

  function patchColumn(column: LinearKanbanColumn, stateId: string) {
    bind.mutate({
      data: { stateMap: { ...status.stateMap, [column]: stateId === "none" ? null : stateId } },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-section font-semibold tracking-tight">Linear</h2>
        <p className="mt-1 text-body text-muted">
          Human Kanban for the AI Clipping Dashboard. Agency Admin stays the system of record for
          clients and media. Linear tracks engineering and ops tickets — outages never block a
          publish.
        </p>
      </div>
      <GlassCard>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-card font-semibold tracking-tight">Workspace binding</h3>
            <p className="mt-1 text-caption text-muted">
              {status.viewerName
                ? `Connected as ${status.viewerName}${status.organizationName ? ` · ${status.organizationName}` : ""}`
                : "Paste a Linear API key or connect OAuth. Tokens stay on the server."}
            </p>
          </div>
          <Badge tone={statusTone(status.health === "connected" ? "SUCCEEDED" : status.health === "error" ? "FAILED" : "PENDING")}>
            {healthLabel(status.health)}
          </Badge>
        </div>

        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (apiKey.trim()) saveKey.mutate();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="linear-api-key">Personal API key</Label>
            <Input
              id="linear-api-key"
              type="password"
              autoComplete="new-password"
              spellCheck={false}
              value={apiKey}
              placeholder={configured ? "•••• stored on the server" : "lin_api_…"}
              onChange={(event) => setApiKey(event.target.value)}
            />
          </div>
          <p className="break-all font-mono text-caption text-muted">{status.callbackUrl}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="linear-cid">OAuth client ID (optional)</Label>
              <Input
                id="linear-cid"
                type="text"
                autoComplete="off"
                value={clientId}
                placeholder={status.oauthConfigured ? "•••• stored" : "Linear OAuth app id"}
                onChange={(event) => setClientId(event.target.value)}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="linear-csec">OAuth client secret</Label>
              <Input
                id="linear-csec"
                type="password"
                autoComplete="new-password"
                value={clientSecret}
                placeholder={status.oauthConfigured ? "•••• stored" : "Linear OAuth secret"}
                onChange={(event) => setClientSecret(event.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="secondary" disabled={saveKey.isPending || !apiKey.trim()}>
              {saveKey.isPending ? "Saving…" : "Save API key"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={saveOauth.isPending || !clientId.trim() || !clientSecret.trim()}
              onClick={() => saveOauth.mutate()}
            >
              Save OAuth app
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={async () => {
                const ok = await copyTextToClipboard(status.callbackUrl);
                toast[ok ? "success" : "error"](ok ? "Callback URL copied" : "Couldn’t copy");
              }}
            >
              <Copy className="size-4" aria-hidden="true" />
              Copy callback
            </Button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setGuideOpen(true)}>
            <BookOpen className="size-3.5" />
            Setup Guide
          </Button>
          {status.oauthConfigured ? (
            <Button size="sm" variant="secondary" disabled={oauth.isPending} onClick={() => oauth.mutate()}>
              <PlugZap className="size-3.5" />
              {oauth.isPending ? "Connecting…" : "Connect Linear"}
            </Button>
          ) : null}
          <Button size="sm" variant="secondary" disabled={test.isPending} onClick={() => test.mutate()}>
            <PlugZap className="size-3.5" />
            {test.isPending ? "Testing…" : "Test Connection"}
          </Button>
          {configured ? (
            <Button size="sm" variant="ghost" onClick={() => setDisconnectOpen(true)}>
              <Unplug className="size-3.5" />
              Disconnect
            </Button>
          ) : null}
        </div>
        {status.lastError ? <p className="mt-2 text-caption text-danger">{status.lastError}</p> : null}
      </GlassCard>

      <GlassCard>
        <h3 className="text-card font-semibold tracking-tight">Team, project, columns</h3>
        <p className="mt-1 text-caption text-muted">
          Canonical board: Backlog → Ready → In Progress → In Review → Done. Agency Admin deep-links
          into Linear — it does not clone the board.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Team</Label>
            <Select
              value={status.teamId ?? undefined}
              onValueChange={(teamId) => {
                bind.mutate({ data: { teamId } });
                load.mutate(teamId);
              }}
              disabled={!configured}
            >
              <SelectTrigger aria-label="Linear team">
                <SelectValue placeholder={status.teamName ?? "Select team"} />
              </SelectTrigger>
              <SelectContent>
                {(teams.length ? teams : status.teamId ? [{ id: status.teamId, name: status.teamName ?? "Team", key: "" }] : []).map(
                  (team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                      {team.key ? ` (${team.key})` : ""}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Project</Label>
            <Select
              value={status.projectId ?? undefined}
              onValueChange={(projectId) => bind.mutate({ data: { projectId } })}
              disabled={!configured}
            >
              <SelectTrigger aria-label="Linear project">
                <SelectValue placeholder={status.projectName ?? "Select project"} />
              </SelectTrigger>
              <SelectContent>
                {(projects.length
                  ? projects
                  : status.projectId
                    ? [{ id: status.projectId, name: status.projectName ?? "Project" }]
                    : []
                ).map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-3">
          <Button
            size="sm"
            variant="secondary"
            disabled={!configured || load.isPending}
            onClick={() => load.mutate(status.teamId ?? undefined)}
          >
            {load.isPending ? "Loading…" : "Load workflow states"}
          </Button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {LINEAR_KANBAN_COLUMNS.map((column) => (
            <div key={column} className="flex flex-col gap-1.5">
              <Label>
                {LINEAR_COLUMN_LABELS[column]}
                <span className="ml-1 font-normal text-muted">· {LINEAR_COLUMN_HINTS[column]}</span>
              </Label>
              <Select
                value={status.stateMap[column] ?? "none"}
                onValueChange={(value) => patchColumn(column, value)}
                disabled={!configured}
              >
                <SelectTrigger aria-label={`${LINEAR_COLUMN_LABELS[column]} state`}>
                  <SelectValue placeholder="Unmapped" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unmapped</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state.id} value={state.id}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-card font-semibold tracking-tight">Sync policy</h3>
        <p className="mt-1 text-caption text-muted">
          Opt-in. Issues with the <code>manual-board</code> label are never auto-moved. Failed
          uploads still succeed or fail in Agency Admin if Linear is down.
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <Toggle
            title="LINEAR_ENABLED"
            hint="Master switch. When off, Hermes degrades silently with an audit note."
            checked={status.flags.enabled}
            onChange={(enabled) => patchFlags({ enabled })}
          />
          <Toggle
            title="Sync linked jobs"
            hint="Move linked issues: running → In Progress, awaiting approval → In Review, succeeded → Done. Default off."
            checked={status.flags.syncJobs}
            onChange={(syncJobs) => patchFlags({ syncJobs })}
          />
          <Toggle
            title="Auto-issue on fail"
            hint="Create a Linear issue when a social upload, render, or agent run fails."
            checked={status.flags.autoIssueOnFail}
            onChange={(autoIssueOnFail) => patchFlags({ autoIssueOnFail })}
          />
          <Toggle
            title="Issue on knowledge proposal"
            hint="Optional. Label learning. Off by default — proposals already have an inbox here."
            checked={status.flags.autoIssueOnProposal}
            onChange={(autoIssueOnProposal) => patchFlags({ autoIssueOnProposal })}
          />
          <Toggle
            title="Members can create issues"
            hint="Owners/Admins always can. Members only when this is on."
            checked={status.flags.membersCanCreate}
            onChange={(membersCanCreate) => patchFlags({ membersCanCreate })}
          />
        </div>
        <div className="mt-4 flex flex-col gap-1.5 sm:max-w-xs">
          <Label>Failed jobs land in</Label>
          <Select
            value={status.flags.failColumn}
            onValueChange={(failColumn) => patchFlags({ failColumn: failColumn as LinearKanbanColumn })}
          >
            <SelectTrigger aria-label="Fail column">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LINEAR_KANBAN_COLUMNS.filter((col) => col !== "done").map((col) => (
                <SelectItem key={col} value={col}>
                  {LINEAR_COLUMN_LABELS[col]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-4">
          <Button
            size="sm"
            variant="secondary"
            disabled={!status.projectId || milestones.isPending}
            onClick={() => milestones.mutate()}
          >
            {milestones.isPending ? "Creating…" : "Ensure M1–M7 milestones"}
          </Button>
          {status.milestones.length ? (
            <p className="mt-2 text-caption text-muted">
              {status.milestones.map((row) => row.name).join(" · ")}
            </p>
          ) : null}
        </div>
      </GlassCard>

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent>
          <DialogTitle>Linear · ~10 min</DialogTitle>
          <DialogDescription>
            Connect Linear as the human Kanban. Agency Admin does not replace the Linear UI.
          </DialogDescription>
          <ol className="mt-3 flex flex-col gap-3">
            {GUIDE_STEPS.map((step, index) => (
              <li key={step.title}>
                <p className="text-body font-medium">
                  {index + 1}. {step.title}
                </p>
                <p className="text-caption text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </DialogContent>
      </Dialog>

      <Dialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
        <DialogContent>
          <DialogTitle>Disconnect Linear?</DialogTitle>
          <DialogDescription>
            Clears the API key and OAuth tokens. Existing Linear issues stay in Linear. Links in
            Agency Admin are left in place so you can reconnect.
          </DialogDescription>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setDisconnectOpen(false)}>
              Keep connected
            </Button>
            <Button onClick={() => disconnect.mutate()} disabled={disconnect.isPending}>
              {disconnect.isPending ? "Disconnecting…" : "Disconnect"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Toggle({
  title,
  hint,
  checked,
  onChange,
}: {
  title: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span>
        <span className="block text-body">{title}</span>
        <span className="text-caption text-muted">{hint}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
