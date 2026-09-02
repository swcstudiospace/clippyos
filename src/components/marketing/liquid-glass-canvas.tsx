import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

export function LiquidGlassCanvas({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let dispose = () => {};

    void import("./liquid-glass-scene")
      .then(({ mountLiquidGlassScene }) => {
        if (cancelled || !hostRef.current) return;
        dispose = mountLiquidGlassScene(hostRef.current, { reducedMotion: reduced }).dispose;
      })
      .catch(() => {
        // WebGL unavailable — CSS liquid glass still paints.
      });

    return () => {
      cancelled = true;
      dispose();
    };
  }, [reduced]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      data-testid="liquid-glass-canvas"
      className={cn("pointer-events-none fixed inset-0 z-0 overflow-hidden", className)}
    />
  );
}
