import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_IDEATION_MESSAGE_CHARS } from "@/lib/ideation";
import { ShineBorder } from "@/components/magicui/shine-border";
import { cn } from "@/lib/utils";

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  sending = false,
  placeholder = "Ask for titles, hooks, angles…",
  autoFocus = false,
  inputId = "chat-input",
  maxLength = MAX_IDEATION_MESSAGE_CHARS,
  maxGrowPx = 160,
  hint,
  sendDisabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  sending?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  inputId?: string;
  /** Pass `null` to accept very large pastes with no client-side truncation. */
  maxLength?: number | null;
  maxGrowPx?: number;
  hint?: ReactNode;
  sendDisabled?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const canSend = !disabled && !sending && !sendDisabled && value.trim().length > 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxGrowPx)}px`;
  }, [value, maxGrowPx]);

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) onSend();
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="chat-composer relative flex min-w-0 items-end gap-2 overflow-hidden px-3 py-2">
        <ShineBorder duration={10} />
        <label className="sr-only" htmlFor={inputId}>
          Message
        </label>
        <textarea
          id={inputId}
          ref={ref}
          rows={1}
          value={value}
          onChange={(event) => {
            const next = event.target.value;
            onChange(maxLength == null ? next : next.slice(0, maxLength));
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          maxLength={maxLength ?? undefined}
          enterKeyHint="send"
          autoComplete="off"
          className={cn(
            "min-h-11 min-w-0 flex-1 resize-none bg-transparent py-2.5 text-body text-fg placeholder:text-muted",
            "focus-visible:outline-none disabled:opacity-50",
          )}
          style={{ maxHeight: maxGrowPx }}
        />
        <Button
          type="button"
          size="icon"
          className="mb-0.5 shrink-0 rounded-full"
          disabled={!canSend}
          onClick={onSend}
          aria-label="Send"
        >
          <ArrowUp className="size-5" />
        </Button>
      </div>
      {hint}
    </div>
  );
}
