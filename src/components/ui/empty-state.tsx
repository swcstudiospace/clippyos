import type { ReactNode } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Ripple } from "@/components/magicui/ripple";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <GlassCard className={cn("relative flex flex-col items-start gap-3 overflow-hidden", className)}>
      <Ripple className="opacity-40" mainCircleSize={120} numCircles={4} />
      <h2 className="relative z-[1] text-card font-semibold tracking-tight">{title}</h2>
      {description ? (
        <p className="relative z-[1] max-w-md text-body text-muted">{description}</p>
      ) : null}
      {action ? <div className="relative z-[1]">{action}</div> : null}
    </GlassCard>
  );
}
