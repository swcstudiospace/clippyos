import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AnimatedShinyText({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("text-shine", className)}>{children}</span>
  );
}
