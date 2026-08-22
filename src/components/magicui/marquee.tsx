import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Marquee({
  children,
  className,
  pauseOnHover = true,
  reverse = false,
  duration = 36,
}: {
  children: ReactNode;
  className?: string;
  pauseOnHover?: boolean;
  reverse?: boolean;
  duration?: number;
}) {
  return (
    <div
      className={cn(
        "group flex overflow-hidden [--gap:1rem] [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
        className,
      )}
      style={{ "--duration": `${duration}s` } as CSSProperties}
    >
      <div
        className={cn(
          "flex min-w-full shrink-0 items-center gap-(--gap) py-2",
          reverse ? "animate-marquee-reverse" : "animate-marquee",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
        )}
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        className={cn(
          "flex min-w-full shrink-0 items-center gap-(--gap) py-2",
          reverse ? "animate-marquee-reverse" : "animate-marquee",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
        )}
      >
        {children}
      </div>
    </div>
  );
}
