import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

export function Meteors({
  number = 12,
  className,
}: {
  number?: number;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const items = useMemo(
    () =>
      Array.from({ length: number }, (_, index) => ({
        id: index,
        left: `${(index * 17) % 100}%`,
        delay: `${(index % 8) * 0.35}s`,
        duration: `${3.2 + (index % 5) * 0.45}s`,
      })),
    [number],
  );
  if (reduced) return null;
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {items.map((item) => (
        <span
          key={item.id}
          className="animate-meteor absolute top-0 h-px w-20 bg-linear-to-r from-accent to-transparent"
          style={{
            left: item.left,
            animationDelay: item.delay,
            animationDuration: item.duration,
          }}
        />
      ))}
    </div>
  );
}
