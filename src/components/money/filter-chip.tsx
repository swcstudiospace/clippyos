import { cn } from "@/lib/utils";

export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-11 rounded-full px-3 text-caption font-medium transition-[background-color,box-shadow,transform] duration-(--motion-quick) ease-[var(--ease-out)] motion-safe:active:scale-[0.96]",
        active
          ? "chip-active-glow bg-accent text-accent-fg"
          : "bg-secondary-surface text-fg hover:bg-secondary-surface/80",
      )}
    >
      {label}
    </button>
  );
}
