import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Lightbulb, RefreshCw, Type } from "lucide-react";
import type { Client, SuggestedIdea, SuggestedTitleGroup } from "@/lib/entities";
import type { ClientBundle } from "@/lib/server/clients";
import { formatRelativeTime } from "@/lib/format";
import { formatVideoDuration } from "@/lib/client-tools";
import { copyTextToClipboard } from "@/lib/clipboard";
import {
  generateSuggestedIdeas,
  generateSuggestedTitles,
} from "@/lib/server/client-tools";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { AIFallbackPanel } from "@/components/ui/ai-fallback-panel";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionBoundary } from "@/components/clients/section-boundary";
import { ClientTrainingBox } from "@/components/clients/client-training-box";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { captureClientError, userFacingErrorMessage } from "@/lib/errors";

function CopyTitle({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <li className="flex items-start justify-between gap-2 rounded-control bg-secondary-surface/50 px-3 py-2">
      <p className="min-w-0 flex-1 text-body">{text}</p>
      <Button
        variant="ghost"
        size="icon"
        className="size-11 shrink-0"
        aria-label={copied ? `Copied “${text}”` : `Copy “${text}”`}
        onClick={async () => {
          const ok = await copyTextToClipboard(text);
          if (ok) {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          } else {
            toast.message("Select the title and copy it.");
          }
        }}
      >
        {copied ? (
          <Check className="size-4" aria-hidden="true" />
        ) : (
          <Copy className="size-4" aria-hidden="true" />
        )}
        <span className="sr-only">{copied ? "Copied" : "Copy"}</span>
      </Button>
    </li>
  );
}

function TitleGroup({ group }: { group: SuggestedTitleGroup }) {
  return (
    <article className="rounded-control border border-border/70 p-3">
      <div className="flex gap-3">
        {group.originalThumbnail ? (
          <img
            src={group.originalThumbnail}
            alt=""
            className="size-16 shrink-0 rounded-control object-cover"
          />
        ) : null}
        <div className="min-w-0">
          <a
            href={group.originalUrl}
            target="_blank"
            rel="noreferrer"
            className="text-body font-medium hover:text-accent"
          >
            {group.originalTitle}
          </a>
          <p className="mt-1 text-caption text-muted">
            {formatVideoDuration(group.durationSeconds)}
            {group.publishedAt ? ` · ${formatRelativeTime(group.publishedAt)}` : ""}
          </p>
        </div>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5">
        {group.alternatives.map((title) => (
          <CopyTitle key={title} text={title} />
        ))}
      </ul>
    </article>
  );
}

function IdeaRow({ idea }: { idea: SuggestedIdea }) {
  const [copied, setCopied] = useState(false);
  return (
    <li className="rounded-control border border-border/70 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-body font-medium">{idea.title}</p>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 shrink-0"
          aria-label={copied ? `Copied “${idea.title}”` : `Copy “${idea.title}”`}
          onClick={async () => {
            const ok = await copyTextToClipboard(idea.title);
            if (ok) {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            } else {
              toast.message("Select the title and copy it.");
            }
          }}
        >
          {copied ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
        </Button>
      </div>
      {idea.rationale ? <p className="mt-1 text-caption text-muted">{idea.rationale}</p> : null}
    </li>
  );
}

function ToolSkeleton() {
  return (
    <div className="mt-4 flex flex-col gap-3" aria-busy="true" aria-live="polite">
      <span className="sr-only">Generating…</span>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-16 w-2/3" />
    </div>
  );
}

function patchClientBundle(
  current: ClientBundle | undefined,
  patch: Partial<Client>,
): ClientBundle | undefined {
  if (!current) return current;
  return { ...current, client: { ...current.client, ...patch } };
}

export function SuggestedTools({
  client,
  llmReady,
}: {
  client: Client;
  llmReady: boolean;
}) {
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState<"titles" | "ideas" | null>(null);
  const hasChannel = Boolean(client.channelUrl);

  const titlesMut = useMutation({
    mutationFn: () => generateSuggestedTitles({ data: { clientId: client.id } }),
    onSuccess: async (payload) => {
      toast.success("Titles updated");
      const apply = (current: ClientBundle | undefined) =>
        patchClientBundle(current, {
          suggestedTitles: payload,
          suggestedTitlesAt: payload.generatedAt,
        });
      queryClient.setQueryData(["client", client.id], apply);
      await queryClient.invalidateQueries({ queryKey: ["client", client.id] });
      queryClient.setQueryData(["client", client.id], (current: ClientBundle | undefined) =>
        current?.client.suggestedTitles ? current : apply(current),
      );
    },
    onError: (error) => {
      captureClientError(error, { source: "suggest-titles" });
      toast.error(userFacingErrorMessage(error));
    },
  });
  const ideasMut = useMutation({
    mutationFn: () => generateSuggestedIdeas({ data: { clientId: client.id } }),
    onSuccess: async (payload) => {
      toast.success("Ideas updated");
      const apply = (current: ClientBundle | undefined) =>
        patchClientBundle(current, {
          suggestedIdeas: payload,
          suggestedIdeasAt: payload.generatedAt,
        });
      queryClient.setQueryData(["client", client.id], apply);
      await queryClient.invalidateQueries({ queryKey: ["client", client.id] });
      queryClient.setQueryData(["client", client.id], (current: ClientBundle | undefined) =>
        current?.client.suggestedIdeas ? current : apply(current),
      );
    },
    onError: (error) => {
      captureClientError(error, { source: "suggest-ideas" });
      toast.error(userFacingErrorMessage(error));
    },
  });

  function requestTitles() {
    if (!llmReady) {
      toast.message("Connect AI to generate titles.");
      return;
    }
    if (!hasChannel) {
      toast.message("Add a YouTube channel URL before generating titles.");
      return;
    }
    if (client.suggestedTitles) {
      setConfirm("titles");
      return;
    }
    titlesMut.mutate();
  }

  function requestIdeas() {
    if (!llmReady) {
      toast.message("Connect AI to generate ideas.");
      return;
    }
    if (client.suggestedIdeas) {
      setConfirm("ideas");
      return;
    }
    ideasMut.mutate();
  }

  const titles = titlesMut.data ?? client.suggestedTitles;
  const ideas = ideasMut.data ?? client.suggestedIdeas;
  const titlesBusy = titlesMut.isPending;
  const ideasBusy = ideasMut.isPending;

  return (
    <>
      <SectionBoundary title="Suggested Titles">
        <GlassCard className="min-w-0 overflow-x-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
                <Type className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-card font-semibold tracking-tight">Suggested Titles</h2>
                <p className="text-caption text-muted">
                  {titles
                    ? `Last generated ${formatRelativeTime(client.suggestedTitlesAt ?? titles.generatedAt)}`
                    : "Never generated"}
                  {titles
                    ? ` · ${titles.longFormCount} long-form video${titles.longFormCount === 1 ? "" : "s"}`
                    : ""}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              disabled={titlesBusy || !llmReady || !hasChannel}
              onClick={requestTitles}
            >
              <RefreshCw className={`size-4 ${titlesBusy ? "animate-spin" : ""}`} aria-hidden="true" />
              {titlesBusy ? "Generating…" : titles ? "Regenerate" : "Generate Titles"}
            </Button>
          </div>
          {!llmReady ? (
            <div className="mt-4">
              <AIFallbackPanel title="Title generation and title training will be available once analysis is connected" />
            </div>
          ) : null}
          {titlesMut.isError && !titlesBusy ? (
            <div className="mt-4">
              <ErrorState
                title="Couldn’t generate titles"
                description="Previous results are unchanged. Retry when you’re ready."
                onRetry={() => titlesMut.mutate()}
              />
            </div>
          ) : null}
          {titlesBusy ? (
            <ToolSkeleton />
          ) : titles && titles.groups.length > 0 ? (
            <div className="mt-4 flex flex-col gap-3">
              {titles.groups.map((group) => (
                <TitleGroup key={group.originalVideoId} group={group} />
              ))}
            </div>
          ) : titles && titles.groups.length === 0 ? (
            <p className="mt-4 text-body text-muted">
              No long-form videos (4 minutes or longer) were found on this channel.
            </p>
          ) : !titlesMut.isError ? (
            <div className="mt-4">
              <p className="text-body text-muted">
                Generate 3 alternative titles for each of the last 5 long-form uploads (4 minutes
                or longer). Results stay until you regenerate.
              </p>
              {!hasChannel ? (
                <p className="mt-2 text-caption text-muted">
                  Add a YouTube channel URL in Edit first.
                </p>
              ) : (
                <Button className="mt-3" disabled={!llmReady} onClick={requestTitles}>
                  Generate Titles
                </Button>
              )}
            </div>
          ) : null}
          <ClientTrainingBox
            scope="CLIENT_TITLES"
            clientId={client.id}
            label="Train titles for this client"
            placeholder="Critique a title or paste a preferred example…"
            disabled={!llmReady || titlesBusy}
          />
        </GlassCard>
      </SectionBoundary>

      <SectionBoundary title="Suggested Ideas">
        <GlassCard className="min-w-0 overflow-x-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
                <Lightbulb className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-card font-semibold tracking-tight">Suggested Ideas</h2>
                <p className="text-caption text-muted">
                  {ideas
                    ? `Last generated ${formatRelativeTime(client.suggestedIdeasAt ?? ideas.generatedAt)}`
                    : "Never generated"}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              disabled={ideasBusy || !llmReady}
              onClick={requestIdeas}
            >
              <RefreshCw className={`size-4 ${ideasBusy ? "animate-spin" : ""}`} aria-hidden="true" />
              {ideasBusy ? "Generating…" : ideas ? "Regenerate" : "Generate Ideas"}
            </Button>
          </div>
          {!llmReady ? (
            <div className="mt-4">
              <AIFallbackPanel title="Idea generation and idea training will be available once analysis is connected" />
            </div>
          ) : null}
          {ideasMut.isError && !ideasBusy ? (
            <div className="mt-4">
              <ErrorState
                title="Couldn’t generate ideas"
                description="Previous results are unchanged. Retry when you’re ready."
                onRetry={() => ideasMut.mutate()}
              />
            </div>
          ) : null}
          {ideasBusy ? (
            <ToolSkeleton />
          ) : ideas && ideas.ideas.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-2">
              {ideas.ideas.map((idea) => (
                <IdeaRow key={idea.title} idea={idea} />
              ))}
            </ul>
          ) : !ideasMut.isError ? (
            <div className="mt-4">
              <p className="text-body text-muted">
                Generate fresh long-form ideas tailored to this client. They stay until you
                regenerate.
              </p>
              <Button className="mt-3" disabled={!llmReady} onClick={requestIdeas}>
                Generate Ideas
              </Button>
            </div>
          ) : null}
          <ClientTrainingBox
            scope="CLIENT_IDEAS"
            clientId={client.id}
            label="Train ideas for this client"
            placeholder="Add an angle, example, or critique…"
            disabled={!llmReady || ideasBusy}
          />
        </GlassCard>
      </SectionBoundary>

      <Dialog open={Boolean(confirm)} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent>
          <DialogTitle>
            {confirm === "titles" ? "Replace suggested titles?" : "Replace suggested ideas?"}
          </DialogTitle>
          <DialogDescription>
            This overwrites the stored set with a new generation using the latest long-form
            uploads and this client’s training notes. The previous set is not kept.
          </DialogDescription>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const which = confirm;
                setConfirm(null);
                if (which === "titles") titlesMut.mutate();
                if (which === "ideas") ideasMut.mutate();
              }}
            >
              Regenerate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
