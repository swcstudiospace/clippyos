import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Phone, Send } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CHANNELS_QUERY_KEY, CHANNEL_LABELS, type ChannelProvider } from "@/lib/channels";
import {
  assignChannelThreadFn,
  getChannelsSnapshotFn,
  listChannelMessagesFn,
  sendChannelMessageFn,
} from "@/lib/server/channel-fns";
import { formatRelativeTime } from "@/lib/format";
import { userFacingErrorMessage } from "@/lib/errors";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/inbox")({
  component: InboxPage,
});

function InboxPage() {
  const queryClient = useQueryClient();
  const snapshot = useQuery({
    queryKey: CHANNELS_QUERY_KEY,
    queryFn: () => getChannelsSnapshotFn(),
  });
  const [threadId, setThreadId] = useState<string | null>(null);
  const [compose, setCompose] = useState("");
  const [newProvider, setNewProvider] = useState<ChannelProvider>("telegram");
  const [newTo, setNewTo] = useState("");

  const threadQuery = useQuery({
    queryKey: [...CHANNELS_QUERY_KEY, "thread", threadId],
    queryFn: () => listChannelMessagesFn({ data: { threadId: threadId as string } }),
    enabled: Boolean(threadId),
  });

  const send = useMutation({
    mutationFn: () =>
      sendChannelMessageFn({
        data: threadId
          ? { threadId, body: compose }
          : { provider: newProvider, to: newTo, body: compose },
      }),
    onSuccess: async (result) => {
      setCompose("");
      setNewTo("");
      setThreadId(result.thread.id);
      toast.success("Sent");
      await queryClient.invalidateQueries({ queryKey: CHANNELS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const assign = useMutation({
    mutationFn: (clientId: string | null) =>
      assignChannelThreadFn({ data: { threadId: threadId as string, clientId } }),
    onSuccess: async () => {
      toast.success("Client linked");
      await queryClient.invalidateQueries({ queryKey: CHANNELS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const threads = snapshot.data?.threads ?? [];
  const selected = useMemo(
    () => threads.find((row) => row.id === threadId) ?? threadQuery.data?.thread ?? null,
    [threads, threadId, threadQuery.data?.thread],
  );

  if (snapshot.isPending) {
    return (
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title="Inbox"
          description="Telegram and WhatsApp for customers and companies — not Computer Use."
        />
        <Skeleton className="mt-6 h-96 w-full rounded-card" />
      </div>
    );
  }

  if (snapshot.isError || !snapshot.data) {
    return (
      <div className="mx-auto max-w-6xl">
        <PageHeader title="Inbox" />
        <ErrorState
          className="mt-6"
          title="Couldn’t load inbox"
          description="Retry in a moment."
          onRetry={() => void snapshot.refetch()}
        />
      </div>
    );
  }

  function onSend(event: FormEvent) {
    event.preventDefault();
    send.mutate();
  }

  return (
    <div className="mx-auto max-w-6xl pb-24 md:pb-8">
      <PageHeader
        title="Inbox"
        description="Professional liaison. Telegram Bot API and WhatsApp Cloud API. The Windows Social Machine is never used for these chats."
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone={snapshot.data.telegramConfigured ? "green" : "orange"}>
          Telegram {snapshot.data.telegramConfigured ? "connected" : "not configured"}
        </Badge>
        <Badge tone={snapshot.data.whatsappConfigured ? "green" : "orange"}>
          WhatsApp {snapshot.data.whatsappConfigured ? "connected" : "not configured"}
        </Badge>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <GlassCard className="p-0">
          <div className="border-b border-border px-4 py-3">
            <p className="text-caption font-medium text-muted">Threads</p>
          </div>
          {threads.length === 0 ? (
            <p className="px-4 py-8 text-caption text-muted">No conversations yet.</p>
          ) : (
            <ul className="flex flex-col">
              {threads.map((thread) => (
                <li key={thread.id}>
                  <button
                    type="button"
                    onClick={() => setThreadId(thread.id)}
                    className={cn(
                      "flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-glass",
                      thread.id === threadId && "bg-glass",
                    )}
                  >
                    <span className="flex min-w-0 items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-body font-medium">{thread.contactName}</span>
                      {thread.provider === "whatsapp" ? (
                        <Phone className="size-3.5 shrink-0 text-muted" aria-hidden="true" />
                      ) : (
                        <MessageCircle className="size-3.5 shrink-0 text-muted" aria-hidden="true" />
                      )}
                    </span>
                    <span className="truncate text-caption text-muted">
                      {thread.lastPreview ?? CHANNEL_LABELS[thread.provider]}
                    </span>
                    <span className="text-caption text-muted">
                      {formatRelativeTime(thread.lastMessageAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
        <GlassCard className="flex min-h-96 flex-col p-0">
          {selected ? (
            <>
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div className="min-w-0">
                  <h2 className="truncate text-card font-semibold tracking-tight">{selected.contactName}</h2>
                  <p className="text-caption text-muted">
                    {CHANNEL_LABELS[selected.provider]}
                    {selected.contactHandle ? ` · ${selected.contactHandle}` : ""}
                  </p>
                </div>
                <Select
                  value={selected.clientId ?? "none"}
                  onValueChange={(value) => assign.mutate(value === "none" ? null : value)}
                >
                  <SelectTrigger className="w-full min-w-0 max-w-xs" aria-label="Link client">
                    <SelectValue placeholder="Link client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No client</SelectItem>
                    {snapshot.data.clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
                {threadQuery.isPending ? (
                  <Skeleton className="h-24 w-full rounded-card" />
                ) : (threadQuery.data?.messages ?? []).length === 0 ? (
                  <EmptyState title="No messages" description="Send the first reply." />
                ) : (
                  threadQuery.data?.messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "max-w-[85%] rounded-card px-3 py-2 text-body",
                        message.direction === "out"
                          ? "ml-auto bg-accent text-accent-fg"
                          : "bg-secondary-surface text-fg",
                      )}
                    >
                      <p>{message.body}</p>
                      <p
                        className={cn(
                          "mt-1 text-caption",
                          message.direction === "out" ? "text-accent-fg/80" : "text-muted",
                        )}
                      >
                        {formatRelativeTime(message.createdAt)} · {message.status}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6">
              <EmptyState
                title="Pick a thread or start one"
                description="New chats use a Telegram chat id or a WhatsApp E.164 number."
              />
            </div>
          )}
          <form onSubmit={onSend} className="border-t border-border p-4">
            {!selected ? (
              <div className="mb-3 grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ch-provider">Channel</Label>
                  <Select
                    value={newProvider}
                    onValueChange={(value) => setNewProvider(value as ChannelProvider)}
                  >
                    <SelectTrigger id="ch-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="telegram">Telegram</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ch-to">{newProvider === "whatsapp" ? "E.164 number" : "Chat id"}</Label>
                  <Input
                    id="ch-to"
                    value={newTo}
                    onChange={(event) => setNewTo(event.target.value)}
                    placeholder={newProvider === "whatsapp" ? "+61412345678" : "@company or 123456"}
                  />
                </div>
              </div>
            ) : null}
            <div className="flex gap-2">
              <Input
                value={compose}
                onChange={(event) => setCompose(event.target.value)}
                placeholder="Write a professional reply"
                required
              />
              <Button type="submit" disabled={send.isPending || !compose.trim()}>
                <Send className="size-4" aria-hidden="true" />
                {send.isPending ? "Sending…" : "Send"}
              </Button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
