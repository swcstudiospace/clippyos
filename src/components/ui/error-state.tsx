import type { ReactNode } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ErrorState({
  title = "Something went wrong",
  description = "Please try again.",
  onRetry,
  action,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <GlassCard
      role="alert"
      className={cn("flex flex-col items-start gap-3", className)}
    >
      <h2 className="text-card font-semibold tracking-tight">{title}</h2>
      <p className="max-w-md text-body text-muted">{description}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : (
        action
      )}
    </GlassCard>
  );
}
