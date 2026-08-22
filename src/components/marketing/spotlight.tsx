import { useEffect, useRef, type MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

export function Spotlight({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;
    const node = ref.current;
    if (!node) return;
    node.style.setProperty("--spot-x", "50%");
    node.style.setProperty("--spot-y", "20%");
  }, [reduced]);

  function onMove(event: MouseEvent<HTMLDivElement>) {
    if (reduced) return;
    const node = ref.current;
    if (!node) return;
    const box = node.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * 100;
    const y = ((event.clientY - box.top) / box.height) * 100;
    node.style.setProperty("--spot-x", `${x}%`);
    node.style.setProperty("--spot-y", `${y}%`);
  }

  return (
    <div
      ref={ref}
      aria-hidden="true"
      onMouseMove={onMove}
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(520px circle at var(--spot-x, 50%) var(--spot-y, 18%), color-mix(in srgb, var(--accent) 22%, transparent), transparent 58%)",
        }}
      />
    </div>
  );
}
