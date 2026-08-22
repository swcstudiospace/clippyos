import { useId } from "react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

export function ClippyMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const rid = useId().replace(/:/g, "");
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-control shadow-(--shadow-border)",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" width={size} height={size} className="block">
        <defs>
          <linearGradient id={`clippy-g-${rid}`} x1="4" y1="2" x2="28" y2="30">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="#04140e" />
        <rect x="1" y="1" width="30" height="30" rx="7" fill="none" stroke={`url(#clippy-g-${rid})`} strokeWidth="1.2" />
        <polygon
          points="16,4.5 26,10 26,22 16,27.5 6,22 6,10"
          fill="#0b3d2c"
          stroke="#34d399"
          strokeWidth="1.15"
          strokeLinejoin="round"
        />
        <path
          d="M12.2 16.2c0-2.4 1.9-4.2 4.3-4.2 2.2 0 3.9 1.5 4.2 3.5"
          fill="none"
          stroke="#ecfdf5"
          strokeWidth="1.85"
          strokeLinecap="round"
        />
        <path
          d="M20.7 16.2c0 2.4-1.9 4.2-4.3 4.2-2.2 0-3.9-1.5-4.2-3.5"
          fill="none"
          stroke="#ecfdf5"
          strokeWidth="1.85"
          strokeLinecap="round"
        />
        <circle cx="16.4" cy="16.2" r="1.35" fill="#10b981" />
      </svg>
      <span className="clippy-mark-shine pointer-events-none absolute inset-0" />
    </span>
  );
}

export function BrandLockup({
  collapsed = false,
  size = 32,
  nameClassName,
}: {
  collapsed?: boolean;
  size?: number;
  nameClassName?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
      <ClippyMark size={size} />
      <span
        className={cn(
          "overflow-hidden text-body font-semibold tracking-tight whitespace-nowrap transition-[opacity,max-width] duration-(--motion-fast) ease-[var(--ease-out)]",
          collapsed ? "max-w-0 opacity-0" : "max-w-44 opacity-100",
          nameClassName,
        )}
      >
        {APP_NAME}
      </span>
    </div>
  );
}
