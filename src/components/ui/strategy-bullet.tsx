import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function StrategyBullet({
  title,
  reasoning,
}: {
  title: string;
  reasoning: string;
}) {
  const [open, setOpen] = useState(false);
  const expandable = Boolean(reasoning);
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} disabled={!expandable}>
      <div className="rounded-control bg-secondary-surface/50 px-3 py-2.5">
        <Collapsible.Trigger asChild disabled={!expandable}>
          <button
            type="button"
            className={cn(
              "flex w-full items-start gap-2 text-left",
              expandable ? "min-h-11" : "cursor-default",
            )}
            aria-expanded={expandable ? open : undefined}
          >
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            <span className="flex-1 text-body">{title}</span>
            {expandable ? (
              <ChevronDown
                className={cn(
                  "mt-1 size-4 shrink-0 text-muted transition-transform duration-(--motion-fast) ease-[var(--ease-out)] motion-reduce:transition-none",
                  open && "rotate-180",
                )}
                aria-hidden="true"
              />
            ) : null}
          </button>
        </Collapsible.Trigger>
        {expandable ? (
          <Collapsible.Content className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out motion-reduce:animate-none">
            <p className="mt-2 pr-6 pb-1 pl-3.5 text-caption text-muted">{reasoning}</p>
          </Collapsible.Content>
        ) : null}
      </div>
    </Collapsible.Root>
  );
}
