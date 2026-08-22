import { useEffect, useMemo, useRef } from "react";
import type { ThumbnailMessage } from "@/lib/entities";
import { SafeMarkdown } from "@/lib/markdown";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { Button } from "@/components/ui/button";
import { ImageBubble, ImageShimmer } from "@/components/thumbnails/image-bubble";
import { cn } from "@/lib/utils";

export function ThumbnailMessageList({
  messages,
  generatingText,
  generatingImageId,
  variationParentId,
  failed,
  busyMessageId,
  onRetry,
  onRegenerate,
  onVariations,
  onDownload,
  onRate,
  onOverlay,
  onRetryImage,
  onSaveToLibrary,
}: {
  messages: ThumbnailMessage[];
  generatingText: boolean;
  generatingImageId: string | null;
  variationParentId: string | null;
  failed: boolean;
  busyMessageId: string | null;
  onRetry: () => void;
  onRegenerate: (message: ThumbnailMessage) => void;
  onVariations: (message: ThumbnailMessage) => void;
  onDownload: (message: ThumbnailMessage) => void;
  onRate: (message: ThumbnailMessage, rating: number) => void;
  onOverlay: (message: ThumbnailMessage) => void;
  onRetryImage: (message: ThumbnailMessage) => void;
  onSaveToLibrary?: (message: ThumbnailMessage) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const variationsByParent = useMemo(() => {
    const map = new Map<string, ThumbnailMessage[]>();
    for (const message of messages) {
      if (message.metadata?.kind === "variation" && message.metadata.parentId) {
        const list = map.get(message.metadata.parentId) ?? [];
        list.push(message);
        map.set(message.metadata.parentId, list);
      }
    }
    return map;
  }, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "end" });
  }, [messages, generatingText, generatingImageId, variationParentId, failed, reduced]);

  const visible = messages.filter((message) => message.metadata?.kind !== "variation");

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 md:px-8"
      aria-live="polite"
      aria-busy={generatingText || Boolean(generatingImageId)}
    >
      {visible.map((message) => {
        const user = message.role === "user";
        const showImage =
          !user &&
          (Boolean(message.imageUrl) ||
            message.metadata?.imageFailed ||
            generatingImageId === message.id ||
            message.metadata?.kind === "turn" ||
            message.metadata?.kind === "regenerate" ||
            message.metadata?.kind === "overlay");
        const variations = variationsByParent.get(message.id) ?? [];
        const showVariationShimmers = variationParentId === message.id && variations.length === 0;
        return (
          <div key={message.id} className={cn("flex flex-col gap-3", user ? "items-end" : "items-start")}>
            {message.content && message.metadata?.kind !== "overlay" ? (
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
              </div>
            ) : null}
            {showImage ? (
              <ImageBubble
                message={message}
                generating={generatingImageId === message.id && !message.imageUrl}
                busy={busyMessageId === message.id}
                onRegenerate={
                  message.metadata?.kind === "overlay" ? undefined : () => onRegenerate(message)
                }
                onVariations={
                  message.metadata?.kind === "overlay" || message.metadata?.kind === "regenerate"
                    ? undefined
                    : () => onVariations(message)
                }
                onDownload={() => onDownload(message)}
                onRate={(rating) => onRate(message, rating)}
                onOverlay={() => onOverlay(message)}
                onRetry={() => onRetryImage(message)}
                onSaveToLibrary={onSaveToLibrary ? () => onSaveToLibrary(message) : undefined}
              />
            ) : null}
            {showVariationShimmers ? (
              <div className="flex w-full max-w-[min(100%,42rem)] gap-3 overflow-x-auto pb-2">
                <ImageShimmer label="Variation 1" className="min-w-[16rem] max-w-[20rem] shrink-0" />
                <ImageShimmer label="Variation 2" className="min-w-[16rem] max-w-[20rem] shrink-0" />
                <ImageShimmer label="Variation 3" className="min-w-[16rem] max-w-[20rem] shrink-0" />
              </div>
            ) : null}
            {variations.length > 0 ? (
              <div className="flex w-full max-w-[min(100%,54rem)] gap-3 overflow-x-auto pb-2">
                {variations.map((variation) => (
                  <ImageBubble
                    key={variation.id}
                    message={variation}
                    compact
                    generating={generatingImageId === variation.id && !variation.imageUrl}
                    busy={busyMessageId === variation.id}
                    onDownload={() => onDownload(variation)}
                    onRate={(rating) => onRate(variation, rating)}
                    onOverlay={() => onOverlay(variation)}
                    onRetry={() => onRetryImage(variation)}
                    onRegenerate={() => onRegenerate(variation)}
                    onSaveToLibrary={onSaveToLibrary ? () => onSaveToLibrary(variation) : undefined}
                  />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
      {generatingText ? (
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
      ) : null}
      {failed && !generatingText ? (
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
