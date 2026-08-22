import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AuroraText({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn("aurora-text", className)}>{children}</span>;
}
