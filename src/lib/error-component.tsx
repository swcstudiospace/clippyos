import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { OrbsBackground } from "@/components/layout/orbs-background";

export function AppErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-bg px-6 text-fg">
      <OrbsBackground />
      <GlassCard className="relative z-10 w-full max-w-md px-8 py-10 text-center">
        <TriangleAlert
          className="mx-auto size-10 text-danger"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <h1 className="mt-4 text-section font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-2 break-words text-body text-muted">
          {error.message || "An unexpected error occurred. Try reloading the page."}
        </p>
        {typeof reset === "function" ? (
          <Button className="mt-6" onClick={reset}>
            Try again
          </Button>
        ) : null}
      </GlassCard>
    </main>
  );
}
