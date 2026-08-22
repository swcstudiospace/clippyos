import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Image, RotateCcw, Video } from "lucide-react";
import { toast } from "sonner";
import { ChatInput } from "@/components/ideation/chat-input";
import { SectionBoundary } from "@/components/clients/section-boundary";
import { AIFallbackPanel } from "@/components/ui/ai-fallback-panel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorState } from "@/components/ui/error-state";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { SafeMarkdown } from "@/lib/markdown";
import {
  MAX_TRAINING_CHARS,
  TRAINING_COLLAPSE_CHARS,
  TRAINING_COLLAPSE_PREVIEW,
  TRAINING_PLACEHOLDER,
  TRAINING_SCOPE_META,
  formatCharCount,
  knowledgeEntriesQueryKey,
  type TrainingScope,
} from "@/lib/knowledge";
import {
  listKnowledgeEntries,
  resetKnowledge,
  sendTrainingMessage,
  summarizeKnowledge,
  type TrainingEntry,
} from "@/lib/server/knowledge";
import { getAiStatus } from "@/lib/server/clients";
import { captureClientError, userFacingErrorMessage } from "@/lib/errors";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { KnowledgeProposalsInbox } from "@/components/knowledge/proposals-inbox";
import { LearningPanel } from "@/components/settings/learning-panel";

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="msg-bubble-assistant max-w-[min(100%,36rem)] px-4 py-3" aria-live="polite">
        <span className="sr-only">Assistant is extracting principles</span>
        <span className="typing-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </div>
    </div>
  );
}

function CollapsiblePaste({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  if (text.length <= TRAINING_COLLAPSE_CHARS) {
    return <p className="whitespace-pre-wrap text-body">{text}</p>;
  }
  return (
    <div>
      <p className="whitespace-pre-wrap text-body">
        {open ? text : `${text.slice(0, TRAINING_COLLAPSE_PREVIEW).trim()}…`}
      </p>
      <button
        type="button"
        className="mt-2 min-h-11 text-caption text-accent hover:underline"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Show less" : `Show full paste (${formatCharCount(text.length)})`}
      </button>
    </div>
  );
}

function TrainerEmpty({ hint }: { hint: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
      <p className="max-w-sm text-body text-muted">{hint}</p>
    </div>
  );
}

function TrainingChat({ scope }: { scope: TrainingScope }) {
  const meta = TRAINING_SCOPE_META[scope];
  const queryClient = useQueryClient();
  const reduced = usePrefersReducedMotion();
  const endRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const [failed, setFailed] = useState(false);
  const [pendingPaste, setPendingPaste] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const aiQuery = useQuery({
    queryKey: ["ai-status"],
    queryFn: () => getAiStatus(),
  });
  const llmReady = aiQuery.data?.llm ?? false;
  const llmKnown = aiQuery.isSuccess;

  const listQuery = useQuery({
    queryKey: knowledgeEntriesQueryKey(scope),
    queryFn: () => listKnowledgeEntries({ data: { scope } }),
  });

  const send = useMutation({
    mutationFn: (content: string) => sendTrainingMessage({ data: { scope, content } }),
    onMutate: (content) => {
      setFailed(false);
      setPendingPaste(content);
      setDraft("");
    },
    onSuccess: (entry) => {
      setPendingPaste(null);
      queryClient.setQueryData<TrainingEntry[]>(knowledgeEntriesQueryKey(scope), (current) => [
        ...(current ?? []),
        entry,
      ]);
      void queryClient.invalidateQueries({ queryKey: knowledgeEntriesQueryKey(scope) });
    },
    onError: (error, content) => {
      setPendingPaste(null);
      setDraft((current) => (current.trim() ? current : content));
      setFailed(true);
      captureClientError(error, { source: "training-send" });
      toast.error(userFacingErrorMessage(error));
    },
  });

  const summarize = useMutation({
    mutationFn: () => summarizeKnowledge({ data: { scope } }),
    onSuccess: (result) => setSummary(result.summary),
    onError: (error) => {
      captureClientError(error, { source: "training-summary" });
      toast.error(userFacingErrorMessage(error));
    },
  });

  const reset = useMutation({
    mutationFn: () => resetKnowledge({ data: { scope, confirm: true } }),
    onSuccess: () => {
      queryClient.setQueryData(knowledgeEntriesQueryKey(scope), []);
      void queryClient.invalidateQueries({ queryKey: knowledgeEntriesQueryKey(scope) });
      setResetOpen(false);
      setSummary(null);
      toast.success(`${meta.title} cleared`);
    },
    onError: (error) => {
      captureClientError(error, { source: "training-reset" });
      toast.error(userFacingErrorMessage(error));
    },
  });

  const entries = listQuery.data ?? [];
  const inFlight = send.isPending || summarize.isPending;
  const overLimit = draft.length > MAX_TRAINING_CHARS;
  const inputDisabled = (llmKnown && !llmReady) || inFlight;
  const sizeHint = useMemo(() => {
    if (!draft) return undefined;
    return overLimit
      ? `${formatCharCount(draft.length)} — over the ${formatCharCount(MAX_TRAINING_CHARS)} limit`
      : formatCharCount(draft.length);
  }, [draft, overLimit]);

  useEffect(() => {
    if (reduced) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [entries.length, send.isPending, pendingPaste, reduced]);

  function onSend() {
    const content = draft.trim();
    if (!content || overLimit || inputDisabled) return;
    send.mutate(content);
  }

  return (
    <GlassCard className="flex min-h-[28rem] flex-col overflow-hidden p-0">
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="grid size-9 place-items-center rounded-control bg-secondary-surface">
            {scope === "THUMBNAIL_GLOBAL" ? (
              <Image className="size-4" aria-hidden="true" />
            ) : (
              <Video className="size-4" aria-hidden="true" />
            )}
          </span>
          <div>
            <h3 className="text-card font-semibold tracking-tight">{meta.title}</h3>
            <p className="text-caption text-muted">Injects into {meta.injectsInto}</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setViewOpen(true);
              summarize.mutate();
            }}
          >
            <BookOpen className="size-4" aria-hidden="true" />
            View current knowledge
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={entries.length === 0}
            onClick={() => setResetOpen(true)}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Reset knowledge
          </Button>
        </div>
      </div>

      {llmKnown && !llmReady ? (
        <div className="px-4 pt-4">
          <AIFallbackPanel />
        </div>
      ) : null}

      {listQuery.isPending ? (
        <div className="flex flex-1 flex-col gap-3 px-4 py-4">
          <Skeleton className="h-16 w-3/4 rounded-card" />
          <Skeleton className="ml-auto h-16 w-2/3 rounded-card" />
          <Skeleton className="h-20 w-4/5 rounded-card" />
        </div>
      ) : listQuery.isError ? (
        <div className="flex flex-1 items-center px-4 py-4">
          <ErrorState
            title="Couldn’t load training"
            description="Retry this trainer. Other settings are still available."
            onRetry={() => void listQuery.refetch()}
          />
        </div>
      ) : (
        <div
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4"
          aria-live="polite"
          aria-busy={send.isPending}
        >
          {entries.length === 0 && !send.isPending && !pendingPaste ? (
            <TrainerEmpty hint={meta.emptyHint} />
          ) : null}
          {entries.map((entry) => (
            <div key={entry.id} className="flex flex-col gap-3">
              <div className="flex justify-end">
                <div className="msg-bubble-user max-w-[min(100%,36rem)] px-4 py-3">
                  <CollapsiblePaste text={entry.userInput} />
                </div>
              </div>
              <div className="flex justify-start">
                <div className="msg-bubble-assistant max-w-[min(100%,36rem)] px-4 py-3">
                  <SafeMarkdown content={entry.learnedPrinciple} />
                </div>
              </div>
            </div>
          ))}
          {pendingPaste ? (
            <div className="flex justify-end">
              <div className="msg-bubble-user max-w-[min(100%,36rem)] px-4 py-3">
                <CollapsiblePaste text={pendingPaste} />
              </div>
            </div>
          ) : null}
          {send.isPending ? <TypingIndicator /> : null}
          {failed && !send.isPending ? (
            <div className="flex justify-start">
              <div className="msg-bubble-assistant max-w-[min(100%,36rem)] px-4 py-3" role="alert">
                <p className="text-body">Nothing was stored. The paste is still in the composer.</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    if (draft.trim()) send.mutate(draft);
                  }}
                  disabled={!draft.trim() || inputDisabled}
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : null}
          <div ref={endRef} />
        </div>
      )}

      <div className="shrink-0 px-3 pb-3 pt-1">
        <ChatInput
          value={draft}
          onChange={setDraft}
          onSend={onSend}
          disabled={inputDisabled}
          sending={send.isPending}
          placeholder={TRAINING_PLACEHOLDER}
          inputId={`training-input-${scope.toLowerCase()}`}
          maxLength={null}
          maxGrowPx={240}
          sendDisabled={overLimit}
          hint={sizeHint}
        />
      </div>

      <Dialog
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open);
          if (!open) {
            setSummary(null);
            summarize.reset();
          }
        }}
      >
        <DialogContent className="w-[min(100%-2rem,36rem)]">
          <DialogTitle>Current {meta.short} knowledge</DialogTitle>
          <DialogDescription>
            Topic-grouped summary of ACTIVE principles. This summary is not stored as new training.
          </DialogDescription>
          {llmKnown && !llmReady ? (
            <div className="mt-4">
              <AIFallbackPanel />
            </div>
          ) : summarize.isPending ? (
            <div className="mt-4 flex flex-col gap-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : summarize.isError ? (
            <div className="mt-4">
              <ErrorState
                title="Couldn’t summarize"
                description="Retry to generate the topic summary. Your training is unchanged."
                onRetry={() => summarize.mutate()}
              />
            </div>
          ) : summary ? (
            <div className="mt-4 max-h-[min(24rem,50dvh)] overflow-y-auto pr-1">
              <SafeMarkdown content={summary} />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogTitle>Reset {meta.title}?</DialogTitle>
          <DialogDescription>
            This clears {meta.title} ({scope}). {meta.injectsInto} will stop receiving these
            principles immediately. Records are kept internally as deprecated so an admin can
            recover them — they are no longer injected.
          </DialogDescription>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => reset.mutate()}
              disabled={reset.isPending}
            >
              Reset knowledge
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
}

export function AiTrainingSection() {
  return (
    <section id="ai-training" className="mt-10 scroll-mt-24" aria-labelledby="ai-training-heading">
      <header className="max-w-2xl">
        <h2 id="ai-training-heading" className="text-section font-semibold tracking-tight">
          AI Training
        </h2>
        <p className="mt-2 text-body text-muted">
          Train the global knowledge used by Ideation and Thumbnails. Knowledge compounds over
          time and is injected into every relevant AI call. Winning posts draft proposals here —
          they never auto-inject.
        </p>
      </header>
      <div className="mt-5">
        <LearningPanel />
      </div>
      <div className="mt-5">
        <KnowledgeProposalsInbox />
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionBoundary title="Thumbnail Training">
          <TrainingChat scope="THUMBNAIL_GLOBAL" />
        </SectionBoundary>
        <SectionBoundary title="Video & Ideation Training">
          <TrainingChat scope="VIDEO_GLOBAL" />
        </SectionBoundary>
      </div>
    </section>
  );
}
