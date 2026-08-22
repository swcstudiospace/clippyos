import { useId, useMemo } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

export function AnimatedGridPattern({
  className,
  width = 36,
  height = 36,
  numSquares = 28,
  maxOpacity = 0.35,
}: {
  className?: string;
  width?: number;
  height?: number;
  numSquares?: number;
  maxOpacity?: number;
}) {
  const reduced = usePrefersReducedMotion();
  const patternId = useId().replace(/:/g, "");
  const squares = useMemo(
    () =>
      Array.from({ length: numSquares }, (_, index) => ({
        id: index,
        x: (index * 3) % 22,
        y: (index * 5) % 14,
        delay: `${(index % 10) * 0.4}s`,
      })),
    [numSquares],
  );

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-[color-mix(in_srgb,var(--accent)_18%,transparent)] stroke-border/70",
        className,
      )}
    >
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M.5 ${height}V.5H${width}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.6"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      {!reduced
        ? squares.map((square) => (
            <rect
              key={square.id}
              width={width - 2}
              height={height - 2}
              x={square.x * width + 1}
              y={square.y * height + 1}
              className="animate-grid-pulse"
              style={{
                animationDelay: square.delay,
                opacity: maxOpacity,
              }}
            />
          ))
        : null}
    </svg>
  );
}
