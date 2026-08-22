import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

export function Ripple({
  className,
  mainCircleSize = 180,
  numCircles = 6,
}: {
  className?: string;
  mainCircleSize?: number;
  numCircles?: number;
}) {
  const reduced = usePrefersReducedMotion();
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden",
        className,
      )}
    >
      {Array.from({ length: numCircles }, (_, index) => {
        const size = mainCircleSize + index * 56;
        return (
          <span
            key={index}
            className={cn(
              "absolute rounded-full border border-accent/25",
              !reduced && "animate-ripple",
            )}
            style={{
              width: size,
              height: size,
              animationDelay: `${index * 0.18}s`,
              opacity: 0.42 - index * 0.05,
            }}
          />
        );
      })}
    </div>
  );
}
