import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Bot, Clapperboard, PanelLeft, PanelRight, Play, Scissors, Square } from "lucide-react";
import {
  AGENT_PRESETS,
  AGENT_PRESET_COPY,
  AGENT_QUERY_KEY,
  CRAYO_AGENT_PRESETS,
  agentRunQueryKey,
  agentStatusLabel,
  agentStatusTone,
  isAgentBusy,
  presetCopy,
  allowlistForPreset,
  type AgentPreset,
} from "@/lib/agent";
import { buildCrayoAutoclipGoal, buildCrayoShortGoal } from "@/lib/agent-crayo";
import { listClients } from "@/lib/server/clients";
import { listSkillsFn } from "@/lib/server/skill-fns";
import {
  cancelAgentRunFn,
  getAgentRunFn,
  listAgentRunsFn,
  startAgentRunFn,
} from "@/lib/server/agent-fns";
import { getLlmSnapshot } from "@/lib/server/llm-fns";
import { LLM_QUERY_KEY } from "@/lib/llm";
import { AgentTimeline } from "@/components/agent/timeline";
import { HermesCrayoRail } from "@/components/agent/hermes-rail";
import { AIFallbackPanel } from "@/components/ui/ai-fallback-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea, Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { ShineBorder } from "@/components/magicui/shine-border";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { Particles } from "@/components/magicui/particles";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { userFacingErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { GROK_BOT_QUERY_KEY } from "@/lib/grok-bot";
import { getGrokBotStatusFn } from "@/lib/server/grok-bot-fns";
import { crayoAccountFn, hermesConnectFn } from "@/lib/server/studio-fns";
import { HERMES_CONNECT_QUERY_KEY } from "@/lib/connect";

type AgentSearch = { run?: string };

export const Route = createFileRoute("/_app/agent")({
  validateSearch: (search: Record<string, unknown>): AgentSearch => ({
    run: typeof search.run === "string" && search.run.length > 0 ? search.run : undefined,
  }),
  component: AgentPage,
});

function AgentPage() {
  const { run: runId } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();
  const [preset, setPreset] = useState<AgentPreset>("crayo-short");
  const [goal, setGoal] = useState(AGENT_PRESET_COPY["crayo-short"].goal);
  const [clientId, setClientId] = useState<string>("");
  const [skillId, setSkillId] = useState<string>("");
  const [runsOpen, setRunsOpen] = useState(false);
  const [ctxOpen, setCtxOpen] = useState(false);
  const [runner, setRunner] = useState<"local" | "grok_bot">("local");
  const [topic, setTopic] = useState("");
  const [script, setScript] = useState("");
  const [longUrl, setLongUrl] = useState("");
  const [clipCount, setClipCount] = useState("5");
  const [moreOpen, setMoreOpen] = useState(false);

  const grokQuery = useQuery({ queryKey: GROK_BOT_QUERY_KEY, queryFn: () => getGrokBotStatusFn() });
  const crayoQuery = useQuery({
    queryKey: ["agent-crayo-account"],
    queryFn: () => crayoAccountFn(),
    refetchInterval: 60_000,
  });
  const hermesQuery = useQuery({
    queryKey: HERMES_CONNECT_QUERY_KEY,
    queryFn: () => hermesConnectFn(),
  });
  const llmQuery = useQuery({ queryKey: LLM_QUERY_KEY, queryFn: () => getLlmSnapshot() });
  const clientsQuery = useQuery({ queryKey: ["clients"], queryFn: () => listClients() });
  const skillsQuery = useQuery({ queryKey: ["skills"], queryFn: () => listSkillsFn() });
  const runsQuery = useQuery({
    queryKey: AGENT_QUERY_KEY,
    queryFn: () => listAgentRunsFn(),
    refetchInterval: 4000,
  });
  const detailQuery = useQuery({
    queryKey: agentRunQueryKey(runId ?? ""),
    queryFn: () => getAgentRunFn({ data: runId! }),
    enabled: Boolean(runId),
    refetchInterval: (query) => {
      const status = query.state.data?.run.status;
      return isAgentBusy(status ?? "queued") || status === "waiting_resource" ? 1200 : false;
    },
  });

  const start = useMutation({
    mutationFn: (override?: { preset: AgentPreset; goal: string }) => {
      const nextPreset = override?.preset ?? preset;
      const trimmedGoal = (override?.goal ?? goal).trim();
      const grokGoal =
        runner === "grok_bot"
          ? `${trimmedGoal}\n\nOnly use these tools: ${[...allowlistForPreset(nextPreset)].join(", ")}`
          : trimmedGoal;
      return startAgentRunFn({
        data: {
          goal: grokGoal,
          preset: nextPreset,
          clientId: clientId || null,
          skillId: nextPreset === "custom" ? skillId || null : skillId || null,
          runner,
          triggeredByTeamMemberId: null,
        },
      });
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: AGENT_QUERY_KEY });
      await navigate({ search: { run: result.id } });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const cancel = useMutation({
    mutationFn: () => cancelAgentRunFn({ data: runId! }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: agentRunQueryKey(runId ?? "") });
      toast.success("Run cancelled");
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const llmReady = Boolean(
    llmQuery.data?.providers["xai-oauth"].configured ||
      llmQuery.data?.providers["xai-api"].configured ||
      llmQuery.data?.providers["openai-compat"].configured,
  );
  const model = llmQuery.data?.router.defaultModel ?? "grok-4.6";
  const clients = useMemo(
    () => (clientsQuery.data ?? []).filter((row) => row.status === "ACTIVE" && !row.deletedAt),
    [clientsQuery.data],
  );
  const skills = (skillsQuery.data ?? []).filter((row) => row.enabled && row.status === "active");
  const selectedClient = clients.find((row) => row.id === clientId) ?? null;
  const rateLimit = llmQuery.data?.rateLimit;

  const contextPanel = (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-caption text-muted">Crayo</p>
      <div>
        <p className="text-body font-medium">
          {crayoQuery.data?.configured
            ? crayoQuery.data.plan
              ? `Crayo · ${crayoQuery.data.plan}`
              : "Crayo connected"
            : "Crayo key missing"}
        </p>
        {crayoQuery.data?.credits ? (
          <p className="text-caption text-muted">
            export {crayoQuery.data.credits.export} · voice {crayoQuery.data.credits.voiceover} · image{" "}
            {crayoQuery.data.credits.image} · video {crayoQuery.data.credits.video}
          </p>
        ) : (
          <p className="text-caption text-muted">
            {crayoQuery.data?.error ?? "Credits appear after the key is live on this deploy."}
          </p>
        )}
      </div>
      <div>
        <p className="text-body font-medium">{selectedClient?.name ?? "No client selected"}</p>
        <p className="text-caption text-muted">{selectedClient?.currentStage ?? "Optional — shorts don’t require a client."}</p>
      </div>
      <p className="text-caption text-muted">Crayo runs never start the Social Machine.</p>
    </div>
  );

  const runsPanel = (
    <div className="flex min-w-0 flex-col gap-2 p-3">
      <p className="px-1 text-caption text-muted">Runs</p>
      {(runsQuery.data ?? []).length === 0 ? (
        <p className="px-1 text-caption text-muted">No runs yet.</p>
      ) : (
        (runsQuery.data ?? []).map((run) => (
          <button
            key={run.id}
            type="button"
            onClick={() => {
              void navigate({ search: { run: run.id } });
              setRunsOpen(false);
            }}
            className={cn(
              "flex min-h-11 w-full min-w-0 flex-col gap-1 rounded-control px-3 py-2 text-left",
              run.id === runId ? "bg-accent/15" : "hover:bg-secondary-surface/70",
            )}
          >
            <span className="flex min-w-0 items-start gap-2">
              <span className="min-w-0 flex-1 text-caption font-medium break-words line-clamp-2">
                {run.goal}
              </span>
              <Badge tone={agentStatusTone(run.status)}>{agentStatusLabel(run.status)}</Badge>
            </span>
            <span className="text-caption text-muted">{presetCopy(run.preset).label}</span>
          </button>
        ))
      )}
    </div>
  );

  return (
    <div className="relative mx-auto flex max-w-7xl flex-col gap-4">
      <Particles className="pointer-events-none absolute inset-0 -z-10 opacity-40" quantity={20} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-caption text-muted">Automate Crayo shorts</p>
          <h1 className="flex min-w-0 items-center gap-2 text-page font-semibold tracking-tight">
            <Bot className="size-6 shrink-0" aria-hidden="true" />
            <SparklesText className="text-page font-semibold tracking-tight">Crayo Agent</SparklesText>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={crayoQuery.data?.configured ? "green" : "orange"}>
            {crayoQuery.isPending ? "Crayo…" : crayoQuery.data?.configured ? "Crayo live" : "Crayo off"}
          </Badge>
          <Badge tone="purple">{model}</Badge>
          <Button
            size="sm"
            variant="ghost"
            className="lg:hidden"
            onClick={() => setRunsOpen(true)}
            aria-label="Open runs"
          >
            <PanelLeft className="size-4" />
            Runs
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="lg:hidden"
            onClick={() => setCtxOpen(true)}
            aria-label="Open context"
          >
            <PanelRight className="size-4" />
            Context
          </Button>
        </div>
      </div>

      {!llmQuery.isPending && !llmReady ? (
        <AIFallbackPanel title="Connect Grok or an API key so the Crayo agent can plan the pipeline" />
      ) : null}

      {rateLimit?.retrying || rateLimit?.recent429 ? (
        <p className="rounded-control bg-warning/10 px-3 py-2 text-caption text-warning" role="status">
          {rateLimit.message ?? "Capacity — retrying…"}
        </p>
      ) : null}

      {!crayoQuery.isPending && !crayoQuery.data?.configured ? (
        <p className="rounded-control bg-warning/10 px-3 py-2 text-caption text-warning" role="status">
          Crayo API key is not live on this deploy yet. Production has it; wait for the next deploy or
          paste CRAYO_API_KEY in Vercel.
        </p>
      ) : null}

      <HermesCrayoRail
        connect={hermesQuery.data}
        onRunPlaybook={(next) => {
          setPreset(next);
          setGoal(AGENT_PRESET_COPY[next].goal);
        }}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <div className="relative rounded-card">
          <ShineBorder borderWidth={1} />
          <GlassCard className="flex h-full flex-col gap-3 p-4">
            <div className="flex items-center gap-2">
              <Clapperboard className="size-5" aria-hidden="true" />
              <h2 className="text-card font-semibold tracking-tight">Make a 9:16 short</h2>
            </div>
            <p className="text-caption text-muted">
              Image + voiceover + project + export. Credits spend when Crayo accepts the job.
            </p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="crayo-topic">Topic / hook</Label>
              <Input
                id="crayo-topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Three habits that quietly ruin mornings"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="crayo-script">Spoken script (optional)</Label>
              <Textarea
                id="crayo-script"
                value={script}
                onChange={(event) => setScript(event.target.value)}
                rows={4}
                className="min-h-24"
                placeholder="Leave blank and the agent writes a 12–20s hook"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="agent-client">Client (optional)</Label>
              <Select value={clientId || "none"} onValueChange={(value) => setClientId(value === "none" ? "" : value)}>
                <SelectTrigger id="agent-client">
                  <SelectValue placeholder="Select a client" />
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
            </div>
            <Button
              className="mt-auto min-h-11"
              disabled={start.isPending || !llmReady || (!topic.trim() && !script.trim())}
              onClick={() => {
                const next = buildCrayoShortGoal({
                  topic,
                  script,
                  clientName: selectedClient?.name,
                });
                setPreset("crayo-short");
                setGoal(next);
                start.mutate({ preset: "crayo-short", goal: next });
              }}
            >
              <Play className="size-4" aria-hidden="true" />
              {start.isPending && preset === "crayo-short" ? "Starting…" : "Generate short"}
            </Button>
          </GlassCard>
        </div>

        <div className="relative rounded-card">
          <ShineBorder borderWidth={1} />
          <GlassCard className="flex h-full flex-col gap-3 p-4">
            <div className="flex items-center gap-2">
              <Scissors className="size-5" aria-hidden="true" />
              <h2 className="text-card font-semibold tracking-tight">AutoClip a long video</h2>
            </div>
            <p className="text-caption text-muted">
              Public https file, 1 minute to 3 hours. Five 60s verticals, full edit, by default.
            </p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="crayo-long-url">Video URL</Label>
              <Input
                id="crayo-long-url"
                type="url"
                value={longUrl}
                onChange={(event) => setLongUrl(event.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="crayo-clip-count">How many clips</Label>
              <Select value={clipCount} onValueChange={setClipCount}>
                <SelectTrigger id="crayo-clip-count">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["3", "5", "8", "10"].map((n) => (
                    <SelectItem key={n} value={n}>
                      {n} clips
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="mt-auto min-h-11"
              variant="secondary"
              disabled={start.isPending || !llmReady || !longUrl.startsWith("https://")}
              onClick={() => {
                const next = buildCrayoAutoclipGoal({
                  url: longUrl,
                  clipCount: Number(clipCount),
                });
                setPreset("crayo-autoclip");
                setGoal(next);
                start.mutate({ preset: "crayo-autoclip", goal: next });
              }}
            >
              <Scissors className="size-4" aria-hidden="true" />
              {start.isPending && preset === "crayo-autoclip" ? "Starting…" : "Cut shorts"}
            </Button>
          </GlassCard>
        </div>
      </div>

      {detailQuery.data &&
      (isAgentBusy(detailQuery.data.run.status) ||
        detailQuery.data.run.status === "waiting_human" ||
        detailQuery.data.run.status === "waiting_resource") ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => cancel.mutate()} disabled={cancel.isPending} className="min-h-11">
            <Square className="size-4" aria-hidden="true" />
            Cancel run
          </Button>
        </div>
      ) : null}

      <div>
        <button
          type="button"
          className="text-caption text-muted underline-offset-2 hover:underline"
          onClick={() => setMoreOpen((open) => !open)}
        >
          {moreOpen ? "Hide clipping presets" : "More clipping presets"}
        </button>
        {moreOpen ? (
          <GlassCard className="mt-2 p-4">
            <div className="flex flex-wrap gap-2" role="list" aria-label="Clipping presets">
              {AGENT_PRESETS.filter((id) => !(CRAYO_AGENT_PRESETS as readonly string[]).includes(id)).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setPreset(id);
                    if (id === "custom") {
                      setSkillId("");
                      return;
                    }
                    setGoal(AGENT_PRESET_COPY[id].goal);
                    const match = skills.find((row) => row.slug === id);
                    setSkillId(match?.id ?? "");
                  }}
                  className={cn(
                    "min-h-11 rounded-full px-3 text-caption",
                    preset === id ? "bg-accent text-accent-fg" : "bg-secondary-surface text-fg",
                  )}
                >
                  {AGENT_PRESET_COPY[id].label}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-1.5">
              <Label htmlFor="agent-goal">Goal</Label>
              <Textarea
                id="agent-goal"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                rows={6}
                className="min-h-28"
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-control bg-secondary-surface/50 px-3 py-3">
              <div>
                <Label htmlFor="agent-runner">Run on Grok Bot</Label>
                <p className="text-caption text-muted">
                  {grokQuery.data?.hasKey
                    ? "Optional. Crayo API does not need the Bot computer."
                    : "Connect Grok Bot in Settings if you want the Bot computer."}
                </p>
              </div>
              <Switch
                id="agent-runner"
                checked={runner === "grok_bot"}
                disabled={!grokQuery.data?.hasKey || !grokQuery.data.enabled}
                onCheckedChange={(on) => setRunner(on ? "grok_bot" : "local")}
              />
            </div>
            <Button
              className="mt-3 min-h-11"
              disabled={start.isPending || !llmReady || !goal.trim()}
              onClick={() => start.mutate({ preset, goal })}
            >
              <Play className="size-4" aria-hidden="true" />
              Run clipping goal
            </Button>
          </GlassCard>
        ) : null}
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(16rem,18rem)_minmax(0,1fr)_minmax(14rem,16rem)]">
        <aside className="hidden min-w-0 max-h-[70vh] overflow-y-auto rounded-card border border-border/60 bg-secondary-surface/30 lg:block">
          {runsQuery.isPending ? <Skeleton className="h-40" /> : runsPanel}
        </aside>
        <section>
          {!runId ? (
            <GlassCard className="grid min-h-48 place-items-center">
              <p className="text-body text-muted">Generate a short or AutoClip a URL. The file and steps show up here.</p>
            </GlassCard>
          ) : detailQuery.isPending ? (
            <Skeleton className="h-64 w-full rounded-card" />
          ) : detailQuery.isError || !detailQuery.data ? (
            <ErrorState
              title="Couldn’t load this run"
              description="Retry in a moment."
              onRetry={() => void detailQuery.refetch()}
            />
          ) : (
            <AgentTimeline detail={detailQuery.data} rateLimitMessage={rateLimit?.message} />
          )}
        </section>
        <aside className="hidden min-w-0 max-h-[70vh] overflow-y-auto rounded-card border border-border/60 bg-secondary-surface/30 lg:block">
          {contextPanel}
        </aside>
      </div>

      <Sheet open={runsOpen} onOpenChange={setRunsOpen}>
        <SheetContent side="left" className="p-0 px-0">
          <SheetTitle className="sr-only">Agent runs</SheetTitle>
          <SheetDescription className="sr-only">History of clipping agent runs</SheetDescription>
          {runsPanel}
        </SheetContent>
      </Sheet>
      <Sheet open={ctxOpen} onOpenChange={setCtxOpen}>
        <SheetContent side="right" className="p-0">
          <SheetTitle className="sr-only">Run context</SheetTitle>
          <SheetDescription className="sr-only">Selected client and skill</SheetDescription>
          {contextPanel}
        </SheetContent>
      </Sheet>
    </div>
  );
}
