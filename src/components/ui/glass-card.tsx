import {
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent,
} from "react";
import { cn } from "@/lib/utils";
import { BorderBeam } from "@/components/magicui/border-beam";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
  beam?: boolean;
};

export function GlassCard({
  className,
  interactive = false,
  beam = true,
  children,
  onMouseMove,
  onMouseLeave,
  ...props
}: GlassCardProps) {
  const reduced = usePrefersReducedMotion();
  const [spot, setSpot] = useState({ x: 0, y: 0, on: false });

  function handleMove(event: MouseEvent<HTMLDivElement>) {
    onMouseMove?.(event);
    if (reduced) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setSpot({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      on: true,
    });
  }

  function handleLeave(event: MouseEvent<HTMLDivElement>) {
    onMouseLeave?.(event);
    setSpot((current) => ({ ...current, on: false }));
  }

  return (
    <div
      className={cn(
        "glass-card relative isolate min-w-0 p-5",
        interactive && "glass-card-interactive",
        className,
      )}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
      >
        <div
          className="absolute inset-0 transition-opacity duration-(--motion-fast)"
          style={
            {
              opacity: spot.on ? 1 : 0,
              background: `radial-gradient(320px circle at ${spot.x}px ${spot.y}px, color-mix(in srgb, var(--accent) 22%, transparent), transparent 58%)`,
            } as CSSProperties
          }
        />
        {beam && !reduced ? (
          <BorderBeam colorFrom="var(--accent)" colorTo="var(--purple)" />
        ) : null}
      </div>
      {children}
    </div>
  );
}
