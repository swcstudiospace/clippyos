import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export function BorderBeam({
  className,
  size = 72,
  duration = 8,
  delay = 0,
  colorFrom = "var(--accent)",
  colorTo = "var(--purple)",
  borderWidth = 1.5,
  reverse = false,
}: {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
  reverse?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-[inherit] border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]"
      style={{ borderWidth } as CSSProperties}
    >
      <div
        className={cn(
          "absolute aspect-square [offset-path:rect(0_auto_auto_0_round_9999px)]",
          reverse ? "animate-border-beam-reverse" : "animate-border-beam",
          className,
        )}
        style={
          {
            width: size,
            background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
            animationDuration: `${duration}s`,
            animationDelay: `-${delay}s`,
          } as CSSProperties
        }
      />
    </div>
  );
}
