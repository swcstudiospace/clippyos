import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-control bg-secondary-surface before:absolute before:inset-0 before:animate-shimmer-slide before:bg-linear-to-r before:from-transparent before:via-fg/10 before:to-transparent motion-reduce:before:hidden motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}
