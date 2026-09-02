import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type LiquidGlassProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
};

export function LiquidGlass({ className, interactive = false, ...props }: LiquidGlassProps) {
  return (
    <div
      className={cn("liquid-glass", interactive && "liquid-glass-interactive", className)}
      {...props}
    />
  );
}
