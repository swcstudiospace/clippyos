import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

export function Particles({
  className,
  quantity = 46,
}: {
  className?: string;
  quantity?: number;
}) {
  const reduced = usePrefersReducedMotion();
  const dots = useMemo(
    () =>
      Array.from({ length: quantity }, (_, index) => ({
        id: index,
        left: `${(index * 17 + 3) % 100}%`,
        top: `${(index * 29 + 11) % 100}%`,
        size: 2 + (index % 3),
        delay: `${(index % 12) * 0.35}s`,
        duration: `${6 + (index % 5)}s`,
      })),
    [quantity],
  );

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {dots.map((dot) => (
        <span
          key={dot.id}
          className={cn(
            "absolute rounded-full bg-fg/30",
            !reduced && "animate-particle",
          )}
          style={{
            left: dot.left,
            top: dot.top,
            width: dot.size,
            height: dot.size,
            animationDelay: dot.delay,
            animationDuration: dot.duration,
          }}
        />
      ))}
    </div>
  );
}
