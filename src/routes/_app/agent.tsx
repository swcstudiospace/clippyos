import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Bot, PanelLeft, PanelRight } from "lucide-react";
import {
  AGENT_QUERY_KEY,
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
import { LLM_QUERY_KEY } from "@/lib/llm";
import { AgentTimeline } from "@/components/agent/timeline";
import { AgentChatComposer } from "@/components/agent/composer";
import { AIFallbackPanel } from "@/components/ui/ai-fallback-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
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
  const [preset, setPreset] = useState<AgentPreset>("clipping-full-package");
  const [goal, setGoal] = useState(presetCopy("clipping-full-package").goal);
  const [clientId, setClientId] = useState<string>("");
  const [skillId, setSkillId] = useState<string>("");
  const [runsOpen, setRunsOpen] = useState(false);
  const [ctxOpen, setCtxOpen] = useState(false);
  const [runner, setRunner] = useState<"local" | "grok_bot">("local");

  const grokQuery = useQuery({ queryKey: GROK_BOT_QUERY_KEY, queryFn: () => getGrokBotStatusFn() });
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
          skillId: skillId || null,
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
  const selectedSkill = skills.find((row) => row.id === skillId) ?? null;
  const rateLimit = llmQuery.data?.rateLimit;

  const contextPanel = (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-caption text-muted">Context</p>
      <div>
        <p className="text-body font-medium">{selectedClient?.name ?? "No client selected"}</p>
        <p className="text-caption text-muted">
          {selectedClient?.currentStage ?? "Stage unknown"} · pin a skill if you want a custom run
        </p>
      </div>
      {selectedSkill ? (
        <p className="text-caption">
          Skill: {selectedSkill.name} v{selectedSkill.version}
        </p>
      ) : (
        <p className="text-caption text-muted">No skill pinned.</p>
      )}
      <p className="text-caption text-muted">
        Social Machine is on-demand. Presets never start it on login. Draft social jobs wait if the VM is stopped.
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
          <p className="text-caption text-muted">AI Clipping Agent</p>
          <h1 className="flex min-w-0 items-center gap-2 text-page font-semibold tracking-tight">
            <Bot className="size-6 shrink-0" aria-hidden="true" />
            <SparklesText className="text-page font-semibold tracking-tight">Agent</SparklesText>
          </h1>
        </div>
        <div className="flex items-center gap-2">
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
        <AIFallbackPanel title="Connect Grok or an API key to run the clipping agent" />
      ) : null}

      {rateLimit?.retrying || rateLimit?.recent429 ? (
        <p className="rounded-control bg-warning/10 px-3 py-2 text-caption text-warning" role="status">
          {rateLimit.message ?? "Capacity — retrying…"}
        </p>
      ) : null}

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(16rem,18rem)_minmax(0,1fr)_minmax(14rem,16rem)]">
        <aside className="hidden min-w-0 max-h-[70vh] overflow-y-auto rounded-card border border-border/60 bg-secondary-surface/30 lg:block">
          {runsQuery.isPending ? <Skeleton className="h-40" /> : runsPanel}
        </aside>
        <section className="flex min-w-0 flex-col gap-3">
          {!runId ? (
            <GlassCard className="grid min-h-48 place-items-center">
              <p className="text-body text-muted">Type a goal or /clip to walk through clipping. Steps show up here.</p>
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
          <AgentChatComposer
            clientId={clientId}
            onClientId={setClientId}
            clients={clients}
            llmReady={llmReady}
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
            onSubmit={(input) => {
              setPreset(input.preset);
              setGoal(input.goal);
              const match = skills.find((row) => row.slug === input.preset);
              setSkillId(match?.id ?? "");
              start.mutate(input);
            }}
            onCancel={() => cancel.mutate()}
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
          <SheetDescription className="sr-only">Selected client and skill</SheetDescription>
          {contextPanel}
        </SheetContent>
      </Sheet>
    </div>
  );
}
