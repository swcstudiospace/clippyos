import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

export function TypingAnimation({
  children,
  className,
  duration = 36,
}: {
  children: string;
  className?: string;
  duration?: number;
}) {
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(reduced ? children : "");

  useEffect(() => {
    if (reduced) {
      setShown(children);
      return;
    }
    setShown("");
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setShown(children.slice(0, index));
      if (index >= children.length) window.clearInterval(timer);
    }, duration);
    return () => window.clearInterval(timer);
  }, [children, duration, reduced]);

  return (
    <span className={cn("whitespace-pre-wrap", className)}>
      {shown}
      {!reduced && shown.length < children.length ? (
        <span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-pulse bg-fg" />
      ) : null}
    </span>
  );
}
