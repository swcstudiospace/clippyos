import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { PanelRight } from "lucide-react";
import { IDEATION_PANEL_STORAGE_KEY } from "@/lib/constants";
import {
  IDEATION_THREADS_QUERY_KEY,
  ideationMessagesQueryKey,
} from "@/lib/ideation";
import { getAiStatus, listClients } from "@/lib/server/clients";
import {
  archiveIdeationThread,
  deleteIdeationThread,
  listIdeationMessages,
  listIdeationThreads,
  renameIdeationThread,
  retryIdeationTurn,
  sendIdeationMessage,
  tagIdeationThread,
  type ThreadListItem,
} from "@/lib/server/ideation";
import type { IdeationMessage } from "@/lib/entities";
import { ChatInput } from "@/components/ideation/chat-input";
import { MessageList } from "@/components/ideation/message-list";
import {
  DeleteThreadDialog,
  RenameThreadDialog,
  TagClientDialog,
  ThreadList,
  ThreadPanel,
} from "@/components/ideation/thread-panel";
import { AIFallbackPanel } from "@/components/ui/ai-fallback-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { SectionBoundary } from "@/components/clients/section-boundary";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { TypingAnimation } from "@/components/magicui/typing-animation";
import { Particles } from "@/components/magicui/particles";
import { toast } from "sonner";
import { captureClientError, userFacingErrorMessage } from "@/lib/errors";

type IdeationSearch = { thread?: string };

export const Route = createFileRoute("/_app/ideation")({
  validateSearch: (search: Record<string, unknown>): IdeationSearch => ({
    thread:
      typeof search.thread === "string" && search.thread.length > 0
        ? search.thread
        : undefined,
  }),
  component: IdeationPage,
});

function readPanelCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(IDEATION_PANEL_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function IdeationPage() {
  const { thread: threadId } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [rename, setRename] = useState<ThreadListItem | null>(null);
  const [tag, setTag] = useState<ThreadListItem | null>(null);
  const [remove, setRemove] = useState<ThreadListItem | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCollapsed(readPanelCollapsed());
  }, []);

  useEffect(() => {
    setFailed(false);
  }, [threadId]);

  const aiQuery = useQuery({
    queryKey: ["ai-status"],
    queryFn: () => getAiStatus(),
  });
  const threadsQuery = useQuery({
    queryKey: IDEATION_THREADS_QUERY_KEY,
    queryFn: () => listIdeationThreads(),
  });
  const messagesQuery = useQuery({
    queryKey: ideationMessagesQueryKey(threadId ?? ""),
    queryFn: () => listIdeationMessages({ data: threadId! }),
    enabled: Boolean(threadId),
  });
  const clientsQuery = useQuery({
    queryKey: ["clients"],
    queryFn: () => listClients(),
  });

  const llmReady = aiQuery.data?.llm !== false;
  const llmKnown = aiQuery.isSuccess;
  const selected = useMemo(
    () => threadsQuery.data?.find((row) => row.id === threadId) ?? null,
    [threadsQuery.data, threadId],
  );

  function goToThread(id?: string) {
    void navigate({ search: id ? { thread: id } : {} });
    setMobileOpen(false);
  }

  function togglePanel() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(IDEATION_PANEL_STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const send = useMutation({
    mutationFn: (content: string) =>
      sendIdeationMessage({ data: { threadId, content } }),
    onMutate: () => {
      setDraft("");
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: IDEATION_THREADS_QUERY_KEY });
      queryClient.setQueryData(ideationMessagesQueryKey(result.thread.id), result.messages);
      if (result.thread.id !== threadId) {
        goToThread(result.thread.id);
      }
      setFailed(result.fallback ? false : !result.ok);
      if (result.fallback) {
        toast.message("Generation is paused until AI is connected.");
      }
    },
    onError: (error, content) => {
      setDraft((current) => (current.trim() ? current : content));
      captureClientError(error, { source: "ideation-send" });
      toast.error(userFacingErrorMessage(error));
      setFailed(true);
    },
  });

  const retry = useMutation({
    mutationFn: () => retryIdeationTurn({ data: threadId! }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: IDEATION_THREADS_QUERY_KEY });
      queryClient.setQueryData(ideationMessagesQueryKey(result.thread.id), result.messages);
      setFailed(!result.ok && !result.fallback);
    },
    onError: (error) => {
      captureClientError(error, { source: "ideation-retry" });
      toast.error(userFacingErrorMessage(error));
      setFailed(true);
    },
  });

  const renameMut = useMutation({
    mutationFn: (title: string) =>
      renameIdeationThread({ data: { id: rename!.id, title } }),
    onSuccess: async () => {
      setRename(null);
      await queryClient.invalidateQueries({ queryKey: IDEATION_THREADS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const tagMut = useMutation({
    mutationFn: (clientId: string | null) =>
      tagIdeationThread({ data: { id: tag!.id, clientId } }),
    onSuccess: async () => {
      setTag(null);
      await queryClient.invalidateQueries({ queryKey: IDEATION_THREADS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const archiveMut = useMutation({
    mutationFn: (id: string) => archiveIdeationThread({ data: id }),
    onSuccess: async (_data, id) => {
      toast.success("Conversation archived");
      await queryClient.invalidateQueries({ queryKey: IDEATION_THREADS_QUERY_KEY });
      if (id === threadId) goToThread(undefined);
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteIdeationThread({ data: id }),
    onSuccess: async (_data, id) => {
      setRemove(null);
      toast.success("Conversation deleted");
      await queryClient.invalidateQueries({ queryKey: IDEATION_THREADS_QUERY_KEY });
      if (id === threadId) goToThread(undefined);
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const generating = send.isPending || retry.isPending;
  const messages: IdeationMessage[] = messagesQuery.data ?? [];
  const optimistic =
    send.isPending && send.variables
      ? ([
          ...messages,
          {
            id: "optimistic",
            threadId: threadId ?? "new",
            role: "user" as const,
            content: send.variables,
            timestamp: new Date().toISOString(),
            metadata: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: null,
          },
        ] satisfies IdeationMessage[])
      : messages;

  const listProps = {
    threads: threadsQuery.data ?? [],
    selectedId: threadId,
    onSelect: goToThread,
    onNew: () => goToThread(undefined),
    onRename: setRename,
    onTag: setTag,
    onArchive: (thread: ThreadListItem) => archiveMut.mutate(thread.id),
    onDelete: setRemove,
  };

  const showChat = Boolean(threadId) || send.isPending;
  const inputDisabled = llmKnown && !llmReady;
  const composer = (
    <SectionBoundary title="Composer">
      <ChatInput
        value={draft}
        onChange={setDraft}
        onSend={() => send.mutate(draft)}
        disabled={inputDisabled}
        sending={generating}
        autoFocus={!showChat}
      />
    </SectionBoundary>
  );

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100dvh-3.5rem)] min-h-0 md:-mx-8 md:-my-8">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex min-h-14 items-center gap-2 border-b border-border px-4 md:px-6">
          <h1 className="sr-only">Ideation</h1>
          <p className="min-w-0 flex-1 truncate text-body font-medium">
            {selected?.title ?? (showChat ? "New Ideation" : "Ideation")}
          </p>
          {selected?.clientName ? (
            <Badge tone="blue" className="max-w-[10rem] truncate">
              {selected.clientName}
            </Badge>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open threads"
          >
            <PanelRight className="size-5" />
          </Button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          {threadsQuery.isError ? (
            <div className="p-6">
              <ErrorState
                title="Couldn’t load threads"
                onRetry={() => void threadsQuery.refetch()}
              />
            </div>
          ) : !showChat ? (
            <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-10">
              <Particles className="opacity-50" quantity={24} />
              <h2 className="relative z-[1] text-page text-center font-semibold tracking-tight">
                <SparklesText>What are we ideating today?</SparklesText>
              </h2>
              <p className="relative z-[1] mt-2 max-w-md text-center text-body text-muted">
                <TypingAnimation>
                  Titles, hooks, thumbnails, and growth.
                </TypingAnimation>
              </p>
              {llmKnown && !llmReady ? (
                <div className="mt-6 w-full max-w-md">
                  <AIFallbackPanel />
                </div>
              ) : null}
              <div className="mt-8 w-full max-w-2xl">{composer}</div>
            </div>
          ) : messagesQuery.isError && threadId ? (
            <div className="p-6">
              <ErrorState
                title="Couldn’t load this conversation"
                onRetry={() => void messagesQuery.refetch()}
              />
            </div>
          ) : threadId && messagesQuery.isPending && !send.isPending ? (
            <div className="flex flex-1 flex-col gap-3 px-6 py-8">
              <Skeleton className="h-16 w-2/3 self-end" />
              <Skeleton className="h-24 w-3/4" />
              <Skeleton className="h-16 w-1/2 self-end" />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              {llmKnown && !llmReady ? (
                <div className="px-4 pt-4 md:px-8">
                  <AIFallbackPanel />
                </div>
              ) : null}
              <SectionBoundary title="Messages">
                <MessageList
                  messages={optimistic}
                  generating={generating && llmReady}
                  failed={failed}
                  onRetry={() => {
                    if (threadId) retry.mutate();
                    else if (draft.trim()) send.mutate(draft);
                  }}
                />
              </SectionBoundary>
              <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-8">{composer}</div>
            </div>
          )}
        </div>
      </div>

      <ThreadPanel collapsed={collapsed} onToggle={togglePanel} {...listProps} />

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="top-0 right-0 left-auto h-dvh w-[min(100%,20rem)] max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-none border-y-0 border-r-0 p-0">
          <DialogTitle className="sr-only">Conversation list</DialogTitle>
          <DialogDescription className="sr-only">
            Conversations in Ideation
          </DialogDescription>
          <ThreadList {...listProps} />
        </DialogContent>
      </Dialog>

      <RenameThreadDialog
        thread={rename}
        onClose={() => setRename(null)}
        onSave={(title) => renameMut.mutate(title)}
        busy={renameMut.isPending}
      />
      <TagClientDialog
        thread={tag}
        clients={clientsQuery.data ?? []}
        onClose={() => setTag(null)}
        onSave={(clientId) => tagMut.mutate(clientId)}
        busy={tagMut.isPending}
      />
      <DeleteThreadDialog
        thread={remove}
        onClose={() => setRemove(null)}
        onConfirm={() => remove && deleteMut.mutate(remove.id)}
        busy={deleteMut.isPending}
      />
    </div>
  );
}
