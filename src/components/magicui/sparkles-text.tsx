import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

type Sparkle = { id: number; x: string; y: string; delay: string; scale: number };

function SparkleGlyph({ sparkle }: { sparkle: Sparkle }) {
  return (
    <svg
      className="pointer-events-none absolute z-[1] animate-sparkle"
      style={{
        left: sparkle.x,
        top: sparkle.y,
        animationDelay: sparkle.delay,
        transform: `scale(${sparkle.scale})`,
      }}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 0L13.8 8.2L22 10L13.8 11.8L12 20L10.2 11.8L2 10L10.2 8.2L12 0Z"
        fill="var(--accent)"
      />
    </svg>
  );
}

export function SparklesText({
  children,
  className,
  sparkleCount = 5,
}: {
  children: string;
  className?: string;
  sparkleCount?: number;
}) {
  const reduced = usePrefersReducedMotion();
  const sparkles = useMemo<Sparkle[]>(
    () =>
      Array.from({ length: sparkleCount }, (_, id) => ({
        id,
        x: `${8 + ((id * 19) % 84)}%`,
        y: `${id % 2 === 0 ? -18 : 78}%`,
        delay: `${id * 0.35}s`,
        scale: 0.55 + (id % 3) * 0.18,
      })),
    [sparkleCount],
  );

  return (
    <span className={cn("relative inline-block", className)}>
      {!reduced
        ? sparkles.map((sparkle) => (
            <SparkleGlyph key={sparkle.id} sparkle={sparkle} />
          ))
        : null}
      <span className="relative z-[2]">{children}</span>
    </span>
  );
}
