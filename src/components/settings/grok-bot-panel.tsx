import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Copy, KeyRound, Radio, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
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
import { ShineBorder } from "@/components/magicui/shine-border";
import { copyTextToClipboard } from "@/lib/clipboard";
import { userFacingErrorMessage } from "@/lib/errors";
import { formatRelativeTime } from "@/lib/format";
import {
  GROK_BOT_ACCESS,
  GROK_BOT_CONNECTION_LABELS,
  GROK_BOT_QUERY_KEY,
  GROK_BOT_SHARED_COMPUTER,
  formatGrokBotConnectorJson,
  grokBotConnectionTone,
  type GrokBotSnapshot,
  type GrokBotWorkStatus,
} from "@/lib/grok-bot";
import {
  createGrokBotPresetKeyFn,
  dispatchGrokBotWorkFn,
  getGrokBotStatusFn,
  grokBotBriefFn,
  markGrokBotPastedFn,
  saveGrokBotSettingsFn,
} from "@/lib/server/grok-bot-fns";

const GUIDE_STEPS = [
  {
    title: "Confirm Grok Bot access",
    body: "Grok Bot needs SuperGrok Plus / Heavy or Cursor Pro+ / Ultra. ClippyOS does not sell or provision that computer.",
  },
  {
    title: "Create a Bot",
    body: "Open x.ai/bot, create a named teammate, and keep it always-on. Every Bot on that account shares one cloud computer.",
  },
  {
    title: "Add ClippyOS as a Custom connector",
    body: "grok.com/connectors → New Connector → Custom. Paste either MCP URL (os.swcstudio.space or clippyos.grok.me). Grok opens ClippyOS so an admin can approve OAuth.",
  },
  {
    title: "Paste the operator brief",
    body: "Give the Bot the ClippyOS brief so it heartbeats, lists work, and never starts Daytona.",
  },
];

async function copy(label: string, value: string) {
  const ok = await copyTextToClipboard(value);
  toast[ok ? "success" : "error"](ok ? `Copied ${label}` : "Couldn’t copy — select the text instead");
  return ok;
}

function workTone(status: GrokBotWorkStatus): "green" | "orange" | "red" | "blue" | "neutral" {
  if (status === "succeeded") return "green";
  if (status === "failed" || status === "cancelled") return "red";
  if (status === "claimed") return "blue";
  if (status === "queued") return "orange";
  return "neutral";
}

export function GrokBotPanel() {
  const queryClient = useQueryClient();
  const [botName, setBotName] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [secret, setSecret] = useState<{ title: string; value: string; warning: string } | null>(null);

  const query = useQuery({
    queryKey: GROK_BOT_QUERY_KEY,
    queryFn: () => getGrokBotStatusFn(),
    refetchInterval: (current) => {
      const connection = current.state.data?.connection;
      return connection === "working" || connection === "waiting" ? 8000 : 30000;
    },
  });
  const briefQuery = useQuery({
    queryKey: [...GROK_BOT_QUERY_KEY, "brief"],
    queryFn: () => grokBotBriefFn(),
    enabled: Boolean(query.data),
  });

  const save = useMutation({
    mutationFn: (patch: { enabled?: boolean; preferAsComputer?: boolean; fallbackToDaytona?: boolean; botName?: string }) =>
      saveGrokBotSettingsFn({ data: patch }),
    onSuccess: async (snap) => {
      queryClient.setQueryData(GROK_BOT_QUERY_KEY, snap);
      toast.success("Grok Bot settings saved");
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const mint = useMutation({
    mutationFn: () => createGrokBotPresetKeyFn(),
    onSuccess: async (result) => {
      const mcpUrl = query.data?.mcpUrl ?? "/api/mcp";
      setSecret({
        title: "Grok Bot MCP token",
        value: result.plaintext,
        warning: `Store this in Grok Bot now. Shown once. Connector JSON:\n${formatGrokBotConnectorJson(mcpUrl, result.plaintext)}`,
      });
      await queryClient.invalidateQueries({ queryKey: GROK_BOT_QUERY_KEY });
      toast.success("Grok Bot key created — copy it now");
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const pasted = useMutation({
    mutationFn: () => markGrokBotPastedFn(),
    onSuccess: async (snap) => {
      queryClient.setQueryData(GROK_BOT_QUERY_KEY, snap);
      toast.success("Marked as pasted into Grok Bot");
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const ping = useMutation({
    mutationFn: () =>
      dispatchGrokBotWorkFn({
        data: {
          kind: "custom",
          title: "ClippyOS ping",
          brief: "Call grokbot.heartbeat, then grokbot.complete_work ok=true. Do not start Daytona.",
        },
      }),
    onSuccess: async () => {
      toast.success("Queued a ping for Grok Bot");
      await queryClient.invalidateQueries({ queryKey: GROK_BOT_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const connectorJson = useMemo(() => {
    const url = query.data?.mcpUrl ?? "/api/mcp";
    return briefQuery.data?.connectorJson ?? formatGrokBotConnectorJson(url);
  }, [briefQuery.data?.connectorJson, query.data?.mcpUrl]);

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Couldn’t load Grok Bot"
        description="Sign in again and retry."
        onRetry={() => void query.refetch()}
      />
    );
  }

  const snap: GrokBotSnapshot = query.data;
  const nameValue = botName || snap.botName;

  return (
    <section id="grok-bot" className="flex scroll-mt-24 flex-col gap-4">
      <div>
        <h2 className="text-section font-semibold tracking-tight">Grok Bot</h2>
        <p className="mt-1 max-w-3xl text-body text-muted">
          Premium always-on computer. Hermes and the Social Machine stay the default. Connect yours if you have
          Grok Bot access — operators can then dispatch uploads and agent runs without starting Daytona.
        </p>
      </div>

      <GlassCard className="relative overflow-hidden">
        <ShineBorder shineColor={["var(--accent)", "var(--teal)", "var(--purple)"]} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
                <Sparkles className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-card font-semibold tracking-tight">Premium computer</h3>
                <p className="mt-1 text-caption text-muted">{GROK_BOT_ACCESS}</p>
              </div>
            </div>
            <Badge tone={grokBotConnectionTone(snap.connection)}>
              {GROK_BOT_CONNECTION_LABELS[snap.connection]}
            </Badge>
          </div>

          <p className="mt-4 rounded-control bg-warning/10 px-3 py-2 text-caption text-warning">{GROK_BOT_SHARED_COMPUTER}</p>

          <div className="mt-4 grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="grok-bot-enabled">Enabled</Label>
              <Switch
                id="grok-bot-enabled"
                checked={snap.enabled}
                onCheckedChange={(enabled) => save.mutate({ enabled })}
                disabled={save.isPending}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label htmlFor="grok-bot-prefer">Prefer as computer</Label>
                <p className="text-caption text-muted">AUTO uses Grok Bot instead of Daytona when APIs aren’t eligible.</p>
              </div>
              <Switch
                id="grok-bot-prefer"
                checked={snap.preferAsComputer}
                onCheckedChange={(preferAsComputer) => save.mutate({ preferAsComputer })}
                disabled={save.isPending}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label htmlFor="grok-bot-fallback">Fall back to Social Machine</Label>
                <p className="text-caption text-muted">If Grok Bot is offline, Daytona still runs Computer Use.</p>
              </div>
              <Switch
                id="grok-bot-fallback"
                checked={snap.fallbackToDaytona}
                onCheckedChange={(fallbackToDaytona) => save.mutate({ fallbackToDaytona })}
                disabled={save.isPending}
              />
            </div>
            <form
              className="flex flex-col gap-2 sm:flex-row sm:items-end"
              onSubmit={(event) => {
                event.preventDefault();
                if (nameValue.trim()) save.mutate({ botName: nameValue.trim() });
              }}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Label htmlFor="grok-bot-name">Bot name</Label>
                <Input
                  id="grok-bot-name"
                  value={nameValue}
                  onChange={(event) => setBotName(event.target.value)}
                  maxLength={80}
                />
              </div>
              <Button type="submit" variant="secondary" disabled={save.isPending} className="min-h-11">
                Save name
              </Button>
            </form>
          </div>

          <ol className="mt-5 grid gap-3">
            <li className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary-surface text-caption font-semibold">
                1
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">Add Custom connector (OAuth)</p>
                <p className="mt-1 text-caption text-muted">
                  Paste either MCP URL at grok.com/connectors — same workspace. Prefer os.swcstudio.space.
                  Grok signs in with OAuth — no bearer key.
                </p>
                <div className="mt-2 flex flex-col gap-2">
                  <CopyRow label="MCP URL · os.swcstudio.space" value={snap.mcpUrl} />
                  <CopyRow label="MCP URL · clippyos.grok.me" value={snap.mcpAliasUrl} />
                  <CopyRow label="Connector JSON" value={connectorJson} />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="secondary" asChild className="min-h-11">
                    <a href={snap.connectorsUrl} target="_blank" rel="noreferrer">
                      Open grok.com/connectors
                    </a>
                  </Button>
                  <Button variant="secondary" asChild className="min-h-11">
                    <a href={snap.botAppUrl} target="_blank" rel="noreferrer">
                      Open Grok Bot
                    </a>
                  </Button>
                </div>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary-surface text-caption font-semibold">
                2
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">Paste operator brief</p>
                <p className="mt-1 text-caption text-muted">
                  {snap.pastedConnectorAt
                    ? `Marked ${formatRelativeTime(snap.pastedConnectorAt)}`
                    : "Tell the Bot to heartbeat and list_work. Never start Daytona."}
                </p>
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-control bg-secondary-surface px-3 py-2 text-caption">
                  {briefQuery.data?.brief ?? "Loading brief…"}
                </pre>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className="min-h-11"
                    disabled={!briefQuery.data?.brief}
                    onClick={() => void copy("operator brief", briefQuery.data?.brief ?? "")}
                  >
                    <Copy className="size-4" aria-hidden="true" />
                    Copy brief
                  </Button>
                  <Button
                    variant="secondary"
                    className="min-h-11"
                    onClick={() => pasted.mutate()}
                    disabled={pasted.isPending}
                  >
                    Mark as pasted
                  </Button>
                </div>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary-surface text-caption font-semibold">
                3
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">Optional Hermes key</p>
                <p className="mt-1 text-caption text-muted">
                  {snap.hasOAuth
                    ? "OAuth is connected. Mint a key only if Hermes needs bearer auth."
                    : snap.hasKey
                    ? `Key …${snap.keyLast4} ready${snap.keyLastUsedAt ? ` · last used ${formatRelativeTime(snap.keyLastUsedAt)}` : ""}`
                    : "Grok should use OAuth. Mint a bearer key only for Hermes."}
                </p>
                <Button className="mt-2 min-h-11" onClick={() => mint.mutate()} disabled={mint.isPending}>
                  <KeyRound className="size-4" aria-hidden="true" />
                  {snap.hasKey ? "Mint another Hermes key" : "Create Hermes key"}
                </Button>
                <a href="/settings#clippy-mcp" className="mt-2 inline-block text-caption text-accent underline-offset-2 hover:underline">
                  ClippyOS MCP settings
                </a>
              </div>
            </li>
          </ol>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="secondary" className="min-h-11" onClick={() => setGuideOpen(true)}>
              <BookOpen className="size-4" aria-hidden="true" />
              Setup guide
            </Button>
            <Button
              variant="secondary"
              className="min-h-11"
              onClick={() => ping.mutate()}
              disabled={ping.isPending || (!snap.hasKey && !snap.hasOAuth) || !snap.enabled}
            >
              <Radio className="size-4" aria-hidden="true" />
              Queue a ping
            </Button>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Queued" value={snap.queued} />
            <Stat label="Claimed" value={snap.claimed} />
            <Stat
              label="Heartbeat"
              value={snap.lastHeartbeatAt ? formatRelativeTime(snap.lastHeartbeatAt) : "—"}
            />
            <Stat label="Auth" value={snap.hasOAuth ? "OAuth" : snap.hasKey ? `…${snap.keyLast4}` : "None"} />
          </dl>

          {snap.work.length ? (
            <ul className="mt-4 grid gap-2">
              {snap.work.slice(0, 8).map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-1 rounded-control bg-secondary-surface/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-caption font-medium">{item.title}</p>
                    <p className="text-caption text-muted">{item.kind}</p>
                  </div>
                  <Badge tone={workTone(item.status)}>{item.status}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-caption text-muted">No Grok Bot work yet. Dispatch from Social or Agent, or queue a ping.</p>
          )}
        </GlassCard>

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="w-[min(100%-2rem,32rem)]">
          <DialogTitle>Connect Grok Bot</DialogTitle>
          <DialogDescription>About 10 minutes. Hermes and Daytona keep working if you skip this.</DialogDescription>
          <ol className="mt-4 grid gap-3">
            {GUIDE_STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary-surface text-caption font-semibold">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium">{step.title}</p>
                  <p className="mt-1 text-caption text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <Button className="mt-4 min-h-11" asChild>
            <a href={snap.docsUrl} target="_blank" rel="noreferrer">
              Open Grok Bot docs
            </a>
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(secret)} onOpenChange={(open) => !open && setSecret(null)}>
        <DialogContent className="w-[min(100%-2rem,32rem)]">
          <DialogTitle>{secret?.title}</DialogTitle>
          <DialogDescription>Store this in Grok Bot now. It is shown once. No secrets in logs.</DialogDescription>
          <code className="mt-4 block max-h-48 overflow-auto break-all rounded-control bg-secondary-surface px-3 py-3 text-caption">
            {secret?.value}
          </code>
          {secret?.warning ? <p className="mt-3 whitespace-pre-wrap text-caption text-muted">{secret.warning}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="min-h-11"
              onClick={() => secret && void copy("MCP token", secret.value)}
            >
              <Copy className="size-4" aria-hidden="true" />
              Copy token
            </Button>
            <Button className="min-h-11" onClick={() => setSecret(null)}>
              I’ve saved it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-caption text-muted">{label}</p>
      <div className="flex gap-2">
        <code className="min-w-0 flex-1 truncate rounded-control bg-secondary-surface px-3 py-2 text-caption">
          {value || "—"}
        </code>
        <Button
          size="icon"
          variant="secondary"
          aria-label={`Copy ${label}`}
          onClick={() => void copy(label, value)}
          disabled={!value}
        >
          <Copy className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-control bg-secondary-surface/50 px-3 py-3">
      <dt className="text-caption text-muted">{label}</dt>
      <dd className="truncate text-body font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
