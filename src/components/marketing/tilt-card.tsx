import { useRef, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

export function TiltCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  function onMove(event: MouseEvent<HTMLDivElement>) {
    if (reduced) return;
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return;
    const node = ref.current;
    if (!node) return;
    const box = node.getBoundingClientRect();
    const px = (event.clientX - box.left) / box.width - 0.5;
    const py = (event.clientY - box.top) / box.height - 0.5;
    node.style.transform = `perspective(1100px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 9).toFixed(2)}deg)`;
  }

  function onLeave() {
    const node = ref.current;
    if (!node) return;
    node.style.transform = "perspective(1100px) rotateX(0deg) rotateY(0deg)";
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn(
        "max-w-full transform-gpu overflow-hidden transition-transform duration-200 ease-[var(--ease-out)] will-change-transform",
        className,
      )}
    >
      {children}
    </div>
  );
}
