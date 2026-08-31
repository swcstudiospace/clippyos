import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Bot, PanelLeft, PanelRight, Square } from "lucide-react";
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
import { listClients } from "@/lib/server/clients";
import { listSkillsFn } from "@/lib/server/skill-fns";
import {
  cancelAgentRunFn,
  getAgentRunFn,
  listAgentRunsFn,
  startAgentRunFn,
} from "@/lib/server/agent-fns";
import { getLlmSnapshot } from "@/lib/server/llm-fns";
import { LLM_PROVIDER_COPY, LLM_PROVIDER_IDS, LLM_QUERY_KEY } from "@/lib/llm";
import { AgentTimeline } from "@/components/agent/timeline";
import { AgentChatComposer } from "@/components/agent/composer";
import { HermesCrayoRail } from "@/components/agent/hermes-rail";
import { AgentToolCardView, type AgentToolCard } from "@/components/agent/tool-cards";
import { AIFallbackPanel } from "@/components/ui/ai-fallback-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { Particles } from "@/components/magicui/particles";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { userFacingErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { GROK_BOT_QUERY_KEY } from "@/lib/grok-bot";
import { getGrokBotStatusFn } from "@/lib/server/grok-bot-fns";
import { crayoAccountFn, hermesConnectFn } from "@/lib/server/studio-fns";
import { HERMES_CONNECT_QUERY_KEY } from "@/lib/connect";
import type { AgentSlashUi } from "@/lib/agent-slash";

type AgentSearch = { run?: string };

export const Route = createFileRoute("/_app/agent")({
  validateSearch: (search: Record<string, unknown>): AgentSearch => ({
    run: typeof search.run === "string" && search.run.length > 0 ? search.run : undefined,
  }),
  component: AgentPage,
});

function nextCardId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `card-${Date.now()}`;
}

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
  const [moreOpen, setMoreOpen] = useState(false);
  const [cards, setCards] = useState<AgentToolCard[]>([]);

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
  const plannerId = llmQuery.data?.router.features.agent ?? llmQuery.data?.router.defaultProvider ?? "xai-oauth";
  const planner = LLM_PROVIDER_COPY[plannerId];
  const clients = useMemo(
    () => (clientsQuery.data ?? []).filter((row) => row.status === "ACTIVE" && !row.deletedAt),
    [clientsQuery.data],
  );
  const skills = (skillsQuery.data ?? []).filter((row) => row.enabled && row.status === "active");
  const selectedClient = clients.find((row) => row.id === clientId) ?? null;
  const rateLimit = llmQuery.data?.rateLimit;
  const crayoReady = Boolean(crayoQuery.data?.configured);

  function openCard(ui: AgentSlashUi, draft: Record<string, string>) {
    setCards((current) => {
      const existing = current.find((card) => card.ui === ui);
      if (existing) {
        return current.map((card) => (card.id === existing.id ? { ...card, draft: { ...card.draft, ...draft } } : card));
      }
      return [...current, { id: nextCardId(), ui, draft }];
    });
  }

  function submitRun(input: { preset: AgentPreset; goal: string }) {
    setPreset(input.preset);
    setGoal(input.goal);
    const match = skills.find((row) => row.slug === input.preset);
    setSkillId(match?.id ?? "");
    start.mutate(input);
  }

  const contextPanel = (
    <div className="flex flex-col gap-3 p-4">
      <HermesCrayoRail
        connect={hermesQuery.data}
        crayo={crayoQuery.data}
        plannerName={planner.name}
        model={model}
      />
      <p className="text-caption text-muted">Who actually runs what</p>
      <ul className="flex flex-col gap-1.5">
        {LLM_PROVIDER_IDS.map((id) => {
          const row = llmQuery.data?.providers[id];
          const active = id === plannerId;
          return (
            <li key={id} className="text-caption">
              <span className="font-medium">{LLM_PROVIDER_COPY[id].name}</span>
              {active ? " · this run’s planner" : ""}
              <span className="text-muted">
                {" "}
                — {row?.configured ? "connected" : "not configured"}
              </span>
            </li>
          );
        })}
      </ul>
      <div>
        <p className="text-body font-medium">{selectedClient?.name ?? "No client selected"}</p>
        <p className="text-caption text-muted">{selectedClient?.currentStage ?? "Optional — shorts don’t require a client."}</p>
      </div>
      <p className="text-caption text-muted">
        Crayo runs never start the Social Machine. Leave Grok Bot off unless a computer should claim the job.
      </p>
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
          <p className="text-caption text-muted">Hermes Agent · general + Crayo specialities</p>
          <h1 className="flex min-w-0 items-center gap-2 text-page font-semibold tracking-tight">
            <Bot className="size-6 shrink-0" aria-hidden="true" />
            <SparklesText className="text-page font-semibold tracking-tight">Agent</SparklesText>
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
        <AIFallbackPanel title="Connect Grok or an API key so free-text and /ideas can plan. Crayo slash commands still mint without a planner." />
      ) : null}

      {rateLimit?.retrying || rateLimit?.recent429 ? (
        <p className="rounded-control bg-warning/10 px-3 py-2 text-caption text-warning" role="status">
          {rateLimit.message ?? "Capacity — retrying…"}
        </p>
      ) : null}

      {!crayoQuery.isPending && !crayoQuery.data?.configured ? (
        <p className="rounded-control bg-warning/10 px-3 py-2 text-caption text-warning" role="status">
          Crayo API key is not live on this deploy yet. Production has it; wait for the next deploy or paste
          CRAYO_API_KEY in Vercel.
        </p>
      ) : null}

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

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(16rem,18rem)_minmax(0,1fr)_minmax(14rem,16rem)]">
        <aside className="hidden min-w-0 max-h-[70vh] overflow-y-auto rounded-card border border-border/60 bg-secondary-surface/30 lg:block">
          {runsQuery.isPending ? <Skeleton className="h-40" /> : runsPanel}
        </aside>
        <section className="flex min-w-0 flex-col gap-3">
          {cards.map((card) => (
            <AgentToolCardView
              key={card.id}
              card={card}
              clientName={selectedClient?.name}
              crayoReady={crayoReady}
              starting={start.isPending}
              onChange={(draft) =>
                setCards((current) => current.map((row) => (row.id === card.id ? { ...row, draft } : row)))
              }
              onDismiss={() => setCards((current) => current.filter((row) => row.id !== card.id))}
              onRun={(input) => {
                setCards((current) => current.filter((row) => row.id !== card.id));
                submitRun(input);
              }}
            />
          ))}
          {!runId && cards.length === 0 ? (
            <GlassCard className="grid min-h-48 place-items-center p-6">
              <div className="max-w-md text-center">
                <p className="text-body">Hermes Agent</p>
                <p className="mt-1 text-caption text-muted">
                  General clipping operator with Crayo specialities. Type /short, /voice, /image, or /autoclip — a
                  specialty card pops in. Free text uses the planner.
                </p>
              </div>
            </GlassCard>
          ) : null}
          {runId ? (
            detailQuery.isPending ? (
              <Skeleton className="h-64 w-full rounded-card" />
            ) : detailQuery.isError || !detailQuery.data ? (
              <ErrorState
                title="Couldn’t load this run"
                description="Retry in a moment."
                onRetry={() => void detailQuery.refetch()}
              />
            ) : (
              <AgentTimeline detail={detailQuery.data} rateLimitMessage={rateLimit?.message} />
            )
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
                    <Label htmlFor="agent-runner-more">Run on Grok Bot</Label>
                    <p className="text-caption text-muted">
                      {grokQuery.data?.hasKey
                        ? "Optional. Crayo API does not need the Bot computer."
                        : "Connect Grok Bot in Settings if you want the Bot computer."}
                    </p>
                  </div>
                  <Switch
                    id="agent-runner-more"
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
                  Run clipping goal
                </Button>
              </GlassCard>
            ) : null}
          </div>
          <AgentChatComposer
            clientId={clientId}
            onClientId={setClientId}
            clients={clients}
            llmReady={llmReady}
            crayoReady={crayoReady}
            starting={start.isPending}
            cancelling={cancel.isPending}
            canCancel={Boolean(
              detailQuery.data &&
                (isAgentBusy(detailQuery.data.run.status) ||
                  detailQuery.data.run.status === "waiting_human" ||
                  detailQuery.data.run.status === "waiting_resource"),
            )}
            grokAvailable={Boolean(grokQuery.data?.hasKey && grokQuery.data.enabled)}
            runner={runner}
            onRunner={setRunner}
            onSubmit={submitRun}
            onCancel={() => cancel.mutate()}
            onOpenCard={openCard}
          />
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
          <SheetDescription className="sr-only">Planner, Crayo credits, and client</SheetDescription>
          {contextPanel}
        </SheetContent>
      </Sheet>
    </div>
  );
}
