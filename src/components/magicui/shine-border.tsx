import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export function ShineBorder({
  className,
  duration = 12,
  shineColor = ["var(--accent)", "var(--purple)", "var(--teal)"],
  borderWidth = 1,
}: {
  className?: string;
  duration?: number;
  shineColor?: string | string[];
  borderWidth?: number;
}) {
  const colors = Array.isArray(shineColor) ? shineColor.join(",") : shineColor;
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] will-change-[background-position] motion-safe:animate-shine",
        className,
      )}
      style={
        {
          padding: borderWidth,
          backgroundImage: `radial-gradient(transparent, transparent, ${colors}, transparent, transparent)`,
          backgroundSize: "300% 300%",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          animationDuration: `${duration}s`,
        } as CSSProperties
      }
    />
  );
}
