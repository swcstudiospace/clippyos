import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChatInput } from "@/components/ideation/chat-input";
import { Button } from "@/components/ui/button";
import { SafeMarkdown } from "@/lib/markdown";
import {
  clientTrainingQueryKey,
  type ClientTrainingScope,
} from "@/lib/client-tools";
import {
  listClientTraining,
  sendClientTraining,
  type ClientTrainingEntry,
} from "@/lib/server/client-tools";
import {
  TRAINING_COLLAPSE_CHARS,
  TRAINING_COLLAPSE_PREVIEW,
  formatCharCount,
} from "@/lib/knowledge";
import { captureClientError, userFacingErrorMessage } from "@/lib/errors";
import { toast } from "sonner";

function CollapsedPaste({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  if (text.length <= TRAINING_COLLAPSE_CHARS) {
    return <p className="whitespace-pre-wrap">{text}</p>;
  }
  return (
    <div>
      <p className="whitespace-pre-wrap">
        {open ? text : `${text.slice(0, TRAINING_COLLAPSE_PREVIEW).trim()}…`}
      </p>
      <button
        type="button"
        className="mt-1 min-h-11 text-caption text-accent hover:underline"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Show less" : `Show full paste (${formatCharCount(text.length)})`}
      </button>
    </div>
  );
}

export function ClientTrainingBox({
  scope,
  clientId,
  label,
  placeholder,
  disabled,
}: {
  scope: ClientTrainingScope;
  clientId: string;
  label: string;
  placeholder: string;
  disabled: boolean;
}) {
  const queryClient = useQueryClient();
  const endRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const listQuery = useQuery({
    queryKey: clientTrainingQueryKey(scope, clientId),
    queryFn: () => listClientTraining({ data: { scope, clientId } }),
  });
  const send = useMutation({
    mutationFn: (content: string) =>
      sendClientTraining({ data: { scope, clientId, content } }),
    onMutate: () => setDraft(""),
    onSuccess: (entry) => {
      queryClient.setQueryData<ClientTrainingEntry[]>(
        clientTrainingQueryKey(scope, clientId),
        (current) => [...(current ?? []), entry],
      );
    },
    onError: (error, content) => {
      setDraft((current) => (current.trim() ? current : content));
      captureClientError(error, { source: "client-training" });
      toast.error(userFacingErrorMessage(error));
    },
  });

  const entries = (listQuery.data ?? []).slice(-6);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [entries.length, send.isPending]);

  return (
    <div className="mt-5 min-w-0 overflow-x-hidden rounded-control border border-border bg-secondary-surface/40 p-3">
      <p className="text-caption font-medium">{label}</p>
      <div className="mt-2 flex max-h-40 flex-col gap-2 overflow-y-auto">
        {listQuery.isPending ? (
          <p className="text-caption text-muted">Loading notes…</p>
        ) : entries.length === 0 && !send.isPending ? (
          <p className="text-caption text-muted">
            Critique a title, paste a preferred example, or add a principle. Stored for this
            client only.
          </p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="flex flex-col gap-1.5">
              <div className="self-end max-w-[90%] rounded-control bg-accent/15 px-3 py-2 text-caption">
                <CollapsedPaste text={entry.userInput} />
              </div>
              <div className="self-start max-w-[90%] rounded-control bg-elevated px-3 py-2 text-caption">
                <SafeMarkdown content={entry.learnedPrinciple} />
              </div>
            </div>
          ))
        )}
        {send.isPending ? (
          <p className="text-caption text-muted" aria-live="polite">
            Extracting principle…
          </p>
        ) : null}
        {send.isError && !send.isPending ? (
          <div>
            <p className="text-caption">Nothing was stored.</p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-1"
              onClick={() => {
                if (draft.trim()) send.mutate(draft);
              }}
            >
              Retry
            </Button>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>
      <div className="mt-2">
        <ChatInput
          value={draft}
          onChange={setDraft}
          onSend={() => {
            const content = draft.trim();
            if (!content || disabled || send.isPending) return;
            send.mutate(content);
          }}
          disabled={disabled || send.isPending}
          sending={send.isPending}
          placeholder={placeholder}
          inputId={`client-train-${scope}-${clientId}`}
          maxLength={null}
          maxGrowPx={96}
        />
      </div>
    </div>
  );
}
