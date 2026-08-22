import { useEffect, useRef } from "react";
import type { IdeationMessage } from "@/lib/entities";
import { SafeMarkdown } from "@/lib/markdown";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function toolsCaption(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const tools = (metadata as { toolsUsed?: unknown }).toolsUsed;
  if (!Array.isArray(tools) || tools.length === 0) return null;
  const labels = tools.map((name) => {
    if (name === "query_clients") return "client lookup";
    if (name === "analyze_youtube") return "YouTube analysis";
    if (name === "general_lookup") return "web lookup";
    return "tool";
  });
  return `Used ${labels.join(", ")}`;
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="msg-bubble-assistant max-w-[min(100%,42rem)] px-4 py-3" aria-live="polite">
        <span className="sr-only">Assistant is writing</span>
        <span className="typing-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </div>
    </div>
  );
}

export function MessageList({
  messages,
  generating,
  toolHint,
  failed,
  onRetry,
}: {
  messages: IdeationMessage[];
  generating: boolean;
  toolHint?: boolean;
  failed: boolean;
  onRetry: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "end" });
  }, [messages, generating, failed, reduced]);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 md:px-8"
      aria-live="polite"
      aria-busy={generating}
    >
      {messages.map((message) => {
        const user = message.role === "user";
        const caption = !user ? toolsCaption(message.metadata) : null;
        return (
          <div
            key={message.id}
            className={cn("flex", user ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[min(100%,42rem)] px-4 py-3",
                user ? "msg-bubble-user" : "msg-bubble-assistant",
              )}
            >
              {user ? (
                <p className="whitespace-pre-wrap text-body">{message.content}</p>
              ) : (
                <SafeMarkdown content={message.content} />
              )}
              {caption ? (
                <p className="mt-2 text-caption text-muted">{caption}</p>
              ) : null}
            </div>
          </div>
        );
      })}
      {generating ? (
        <div className="flex flex-col gap-2">
          {toolHint ? (
            <p className="text-caption text-muted">Looking something up…</p>
          ) : null}
          <TypingIndicator />
        </div>
      ) : null}
      {failed && !generating ? (
        <div className="flex justify-start">
          <div className="msg-bubble-assistant max-w-[min(100%,42rem)] px-4 py-3" role="alert">
            <p className="text-body">The reply didn’t come through.</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
              Retry
            </Button>
          </div>
        </div>
      ) : null}
      <div ref={endRef} />
    </div>
  );
}
