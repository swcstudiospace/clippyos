import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { PanelRight } from "lucide-react";
import {
  THUMBNAILS_CLIENT_STORAGE_KEY,
  THUMBNAILS_PANEL_STORAGE_KEY,
} from "@/lib/constants";
import {
  THUMBNAIL_PLACEHOLDER,
  THUMBNAIL_SESSIONS_QUERY_KEY,
  thumbnailMessagesQueryKey,
  MAX_THUMBNAIL_MESSAGE_CHARS,
} from "@/lib/thumbnails";
import { getAiStatus, listClients } from "@/lib/server/clients";
import {
  archiveThumbnailSession,
  deleteThumbnailSession,
  fetchTrustedImage,
  generateThumbnailImageFn,
  listThumbnailMessages,
  listThumbnailSessions,
  rateThumbnailMessage,
  regenerateThumbnail,
  renameThumbnailSession,
  saveThumbnailOverlay,
  sendThumbnailMessage,
  startThumbnailVariations,
  type SessionListItem,
} from "@/lib/server/thumbnails";
import type { ThumbnailMessage } from "@/lib/entities";
import { ChatInput } from "@/components/ideation/chat-input";
import { ClientSelector } from "@/components/thumbnails/client-selector";
import { ThumbnailMessageList } from "@/components/thumbnails/message-list";
import {
  DeleteSessionDialog,
  RenameSessionDialog,
  SessionList,
  SessionPanel,
} from "@/components/thumbnails/session-panel";
import { CanvasEditor } from "@/components/thumbnails/canvas-editor";
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
import { toast } from "sonner";
import { captureClientError, userFacingErrorMessage } from "@/lib/errors";
import { ingestThumbnailFn } from "@/lib/server/library-fns";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { TypingAnimation } from "@/components/magicui/typing-animation";
import { Particles } from "@/components/magicui/particles";

type ThumbnailsSearch = { session?: string };

export const Route = createFileRoute("/_app/thumbnails")({
  validateSearch: (search: Record<string, unknown>): ThumbnailsSearch => ({
    session:
      typeof search.session === "string" && search.session.length > 0
        ? search.session
        : undefined,
  }),
  component: ThumbnailsPage,
});

function readPanelCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(THUMBNAILS_PANEL_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function readStoredClient(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(THUMBNAILS_CLIENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function ThumbnailsPage() {
  const { session: sessionId } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [rename, setRename] = useState<SessionListItem | null>(null);
  const [remove, setRemove] = useState<SessionListItem | null>(null);
  const [failed, setFailed] = useState(false);
  const [overlay, setOverlay] = useState<ThumbnailMessage | null>(null);
  const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);
  const [variationParentId, setVariationParentId] = useState<string | null>(null);

  useEffect(() => {
    setCollapsed(readPanelCollapsed());
    setClientId(readStoredClient());
  }, []);

  useEffect(() => {
    setFailed(false);
  }, [sessionId]);

  const aiQuery = useQuery({
    queryKey: ["ai-status"],
    queryFn: () => getAiStatus(),
  });
  const sessionsQuery = useQuery({
    queryKey: THUMBNAIL_SESSIONS_QUERY_KEY,
    queryFn: () => listThumbnailSessions(),
  });
  const messagesQuery = useQuery({
    queryKey: thumbnailMessagesQueryKey(sessionId ?? ""),
    queryFn: () => listThumbnailMessages({ data: sessionId! }),
    enabled: Boolean(sessionId),
  });
  const clientsQuery = useQuery({
    queryKey: ["clients"],
    queryFn: () => listClients(),
  });

  const llmReady = aiQuery.data?.llm !== false;
  const imageReady = aiQuery.data?.imageGen !== false;
  const llmKnown = aiQuery.isSuccess;
  const selected = useMemo(
    () => sessionsQuery.data?.find((row) => row.id === sessionId) ?? null,
    [sessionsQuery.data, sessionId],
  );

  useEffect(() => {
    if (selected?.clientId && selected.clientId !== clientId) {
      setClientId(selected.clientId);
    }
  }, [selected?.clientId, clientId]);

  function persistClient(id: string) {
    setClientId(id);
    try {
      window.sessionStorage.setItem(THUMBNAILS_CLIENT_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }

  function goToSession(id?: string) {
    void navigate({ search: id ? { session: id } : {} });
    setMobileOpen(false);
  }

  function togglePanel() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(THUMBNAILS_PANEL_STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function cacheMessages(id: string, messages: ThumbnailMessage[]) {
    queryClient.setQueryData(thumbnailMessagesQueryKey(id), messages);
  }

  async function refreshSessions() {
    await queryClient.invalidateQueries({ queryKey: THUMBNAIL_SESSIONS_QUERY_KEY });
  }

  async function runImage(messageId: string) {
    setGeneratingImageId(messageId);
    try {
      const result = await generateThumbnailImageFn({ data: { messageId } });
      cacheMessages(result.session.id, result.messages);
      await refreshSessions();
      if (result.imageFallback) {
        toast.message("Image generation is paused until an API key is connected.");
      } else if (!result.ok) {
        toast.error("The image didn’t come through. Retry.");
      }
    } catch (error) {
      captureClientError(error, { source: "thumbnail-image" });
      toast.error(userFacingErrorMessage(error));
    } finally {
      setGeneratingImageId(null);
    }
  }

  const send = useMutation({
    mutationFn: (content: string) => {
      if (!clientId) throw new Error("CLIENT_REQUIRED");
      return sendThumbnailMessage({
        data: { sessionId, clientId, content },
      });
    },
    onMutate: () => setDraft(""),
    onSuccess: async (result) => {
      await refreshSessions();
      cacheMessages(result.session.id, result.messages);
      if (result.session.id !== sessionId) goToSession(result.session.id);
      setFailed(result.fallback ? false : !result.ok);
      if (result.fallback) {
        toast.message("Generation is paused until AI is connected.");
        return;
      }
      if (result.pendingImageId && !result.imageFallback) {
        void runImage(result.pendingImageId);
      } else if (result.imageFallback) {
        toast.message("Image generation is paused until an API key is connected.");
      }
    },
    onError: (error, content) => {
      setDraft((current) => (current.trim() ? current : content));
      captureClientError(error, { source: "thumbnail-send" });
      toast.error(userFacingErrorMessage(error));
      setFailed(true);
    },
  });

  const regenerate = useMutation({
    mutationFn: (message: ThumbnailMessage) =>
      regenerateThumbnail({ data: { messageId: message.id } }),
    onSuccess: async (result) => {
      cacheMessages(result.session.id, result.messages);
      await refreshSessions();
      if (result.pendingImageId) void runImage(result.pendingImageId);
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const variations = useMutation({
    mutationFn: async (message: ThumbnailMessage) => {
      setVariationParentId(message.id);
      const started = await startThumbnailVariations({ data: { messageId: message.id } });
      cacheMessages(started.session.id, started.messages);
      for (const id of started.variationIds) {
        await runImage(id);
      }
      return started;
    },
    onSettled: () => setVariationParentId(null),
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const rateMut = useMutation({
    mutationFn: (input: { message: ThumbnailMessage; rating: number }) =>
      rateThumbnailMessage({ data: { messageId: input.message.id, rating: input.rating } }),
    onMutate: async (input) => {
      if (!sessionId) return;
      await queryClient.cancelQueries({ queryKey: thumbnailMessagesQueryKey(sessionId) });
      const prev = queryClient.getQueryData<ThumbnailMessage[]>(
        thumbnailMessagesQueryKey(sessionId),
      );
      if (prev) {
        cacheMessages(
          sessionId,
          prev.map((row) =>
            row.id === input.message.id ? { ...row, rating: input.rating } : row,
          ),
        );
      }
      return { prev };
    },
    onError: (error, _input, ctx) => {
      if (sessionId && ctx?.prev) cacheMessages(sessionId, ctx.prev);
      toast.error(userFacingErrorMessage(error));
    },
    onSuccess: async () => {
      await refreshSessions();
    },
  });

  const overlayMut = useMutation({
    mutationFn: (input: { overlayText: string; imageDataUrl: string }) =>
      saveThumbnailOverlay({
        data: {
          sessionId: overlay!.sessionId,
          parentId: overlay!.id,
          overlayText: input.overlayText,
          imageDataUrl: input.imageDataUrl,
        },
      }),
    onSuccess: async (result) => {
      setOverlay(null);
      cacheMessages(result.session.id, result.messages);
      await refreshSessions();
      toast.success("Overlay saved");
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const saveToLibrary = useMutation({
    mutationFn: (message: ThumbnailMessage) => ingestThumbnailFn({ data: { messageId: message.id } }),
    onSuccess: (asset) => {
      toast.success(`Saved to Library: ${asset.title}`);
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const renameMut = useMutation({
    mutationFn: (title: string) =>
      renameThumbnailSession({ data: { id: rename!.id, title } }),
    onSuccess: async () => {
      setRename(null);
      await refreshSessions();
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const archiveMut = useMutation({
    mutationFn: (id: string) => archiveThumbnailSession({ data: id }),
    onSuccess: async (_data, id) => {
      toast.success("Session archived");
      await refreshSessions();
      if (id === sessionId) goToSession(undefined);
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteThumbnailSession({ data: id }),
    onSuccess: async (_data, id) => {
      setRemove(null);
      toast.success("Session deleted");
      await refreshSessions();
      if (id === sessionId) goToSession(undefined);
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  async function downloadMessage(message: ThumbnailMessage) {
    if (!message.imageUrl) return;
    try {
      const { dataUrl, filename } = await fetchTrustedImage({
        data: { url: message.imageUrl },
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename;
      a.rel = "noopener";
      a.click();
    } catch (error) {
      toast.error(userFacingErrorMessage(error));
    }
  }

  const generatingText = send.isPending;
  const messages: ThumbnailMessage[] = messagesQuery.data ?? [];
  const optimistic =
    send.isPending && send.variables
      ? ([
          ...messages,
          {
            id: "optimistic",
            sessionId: sessionId ?? "new",
            role: "user" as const,
            content: send.variables,
            imageUrl: null,
            rating: null,
            timestamp: new Date().toISOString(),
            metadata: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: null,
          },
        ] satisfies ThumbnailMessage[])
      : messages;

  const listProps = {
    sessions: sessionsQuery.data ?? [],
    selectedId: sessionId,
    onSelect: goToSession,
    onNew: () => goToSession(undefined),
    onRename: setRename,
    onArchive: (session: SessionListItem) => archiveMut.mutate(session.id),
    onDelete: setRemove,
  };

  const showChat = Boolean(sessionId) || send.isPending;
  const noClient = !clientId;
  const inputDisabled = (llmKnown && !llmReady) || noClient;
  const activeClients = (clientsQuery.data ?? []).filter(
    (client) => client.status === "ACTIVE" && !client.deletedAt,
  );
  const selectedClient = activeClients.find((client) => client.id === clientId) ?? null;
  const showFallback = llmKnown && (!llmReady || !imageReady);

  const composer = (
    <SectionBoundary title="Composer">
      <div className="flex flex-col gap-2">
        {selectedClient ? (
          <p className="px-1 text-caption text-muted">
            Tagged to <span className="text-fg">{selectedClient.name}</span>
          </p>
        ) : (
          <p className="px-1 text-caption text-muted">
            Select a client to generate.{" "}
            {activeClients.length === 0 ? (
              <Link to="/clients" className="text-accent">
                Add a client
              </Link>
            ) : null}
          </p>
        )}
        <ChatInput
          value={draft}
          onChange={setDraft}
          onSend={() => send.mutate(draft)}
          disabled={inputDisabled}
          sending={generatingText || Boolean(generatingImageId)}
          placeholder={THUMBNAIL_PLACEHOLDER}
          autoFocus={!showChat}
          inputId="thumbnail-input"
          maxLength={MAX_THUMBNAIL_MESSAGE_CHARS}
        />
      </div>
    </SectionBoundary>
  );

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100dvh-3.5rem)] min-h-0 md:-mx-8 md:-my-8">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex min-h-14 items-center gap-2 border-b border-border px-4 md:px-6">
          <h1 className="sr-only">Thumbnails</h1>
          <p className="min-w-0 flex-1 truncate text-body font-medium">
            {selected?.title ?? (showChat ? "New thumbnail" : "Thumbnails")}
          </p>
          {selected?.clientName ? (
            <Badge tone="blue" className="hidden max-w-[10rem] truncate sm:inline-flex">
              {selected.clientName}
            </Badge>
          ) : null}
          <ClientSelector
            clients={clientsQuery.data ?? []}
            value={clientId}
            onChange={persistClient}
          />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open sessions"
          >
            <PanelRight className="size-5" />
          </Button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          {sessionsQuery.isError ? (
            <div className="p-6">
              <ErrorState
                title="Couldn’t load sessions"
                onRetry={() => void sessionsQuery.refetch()}
              />
            </div>
          ) : !showChat ? (
            <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-10">
              <Particles className="opacity-50" quantity={24} />
              <h2 className="relative z-[1] text-page text-center font-semibold tracking-tight">
                <SparklesText>Make a thumbnail that stops the scroll</SparklesText>
              </h2>
              <p className="relative z-[1] mt-2 max-w-md text-center text-body text-muted">
                <TypingAnimation>
                  Creative direction plus a 16:9 4K frame, tagged to a client.
                </TypingAnimation>
              </p>
              {showFallback ? (
                <div className="mt-6 w-full max-w-md">
                  <AIFallbackPanel />
                </div>
              ) : null}
              <div className="mt-8 w-full max-w-2xl">{composer}</div>
            </div>
          ) : messagesQuery.isError && sessionId ? (
            <div className="p-6">
              <ErrorState
                title="Couldn’t load this session"
                onRetry={() => void messagesQuery.refetch()}
              />
            </div>
          ) : sessionId && messagesQuery.isPending && !send.isPending ? (
            <div className="flex flex-1 flex-col gap-3 px-6 py-8">
              <Skeleton className="h-16 w-2/3 self-end" />
              <Skeleton className="aspect-video w-full max-w-xl" />
              <Skeleton className="h-16 w-1/2 self-end" />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              {showFallback ? (
                <div className="px-4 pt-4 md:px-8">
                  <AIFallbackPanel />
                </div>
              ) : null}
              <SectionBoundary title="Messages">
                <ThumbnailMessageList
                  messages={optimistic}
                  generatingText={generatingText && llmReady}
                  generatingImageId={generatingImageId}
                  variationParentId={variationParentId}
                  failed={failed}
                  busyMessageId={generatingImageId}
                  onRetry={() => {
                    if (draft.trim()) send.mutate(draft);
                  }}
                  onRegenerate={(message) => regenerate.mutate(message)}
                  onVariations={(message) => variations.mutate(message)}
                  onDownload={(message) => void downloadMessage(message)}
                  onRate={(message, rating) => rateMut.mutate({ message, rating })}
                  onOverlay={setOverlay}
                  onRetryImage={(message) => void runImage(message.id)}
                  onSaveToLibrary={(message) => saveToLibrary.mutate(message)}
                />
              </SectionBoundary>
              <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-8">{composer}</div>
            </div>
          )}
        </div>
      </div>

      <SessionPanel collapsed={collapsed} onToggle={togglePanel} {...listProps} />

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="top-0 right-0 left-auto h-dvh w-[min(100%,20rem)] max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-none border-y-0 border-r-0 p-0">
          <DialogTitle className="sr-only">Session list</DialogTitle>
          <DialogDescription className="sr-only">
            Thumbnail sessions grouped by client
          </DialogDescription>
          <SessionList {...listProps} />
        </DialogContent>
      </Dialog>

      <RenameSessionDialog
        session={rename}
        onClose={() => setRename(null)}
        onSave={(title) => renameMut.mutate(title)}
        busy={renameMut.isPending}
      />
      <DeleteSessionDialog
        session={remove}
        onClose={() => setRemove(null)}
        onConfirm={() => remove && deleteMut.mutate(remove.id)}
        busy={deleteMut.isPending}
      />
      <SectionBoundary title="Canvas editor">
        <CanvasEditor
          open={Boolean(overlay)}
          imageUrl={overlay?.imageUrl ?? null}
          onClose={() => setOverlay(null)}
          onSave={(payload) => overlayMut.mutate(payload)}
          busy={overlayMut.isPending}
        />
      </SectionBoundary>
    </div>
  );
}
