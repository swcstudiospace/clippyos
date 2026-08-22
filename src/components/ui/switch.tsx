import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Switch({
  className,
  ...props
}: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-border bg-secondary-surface transition-[background-color,box-shadow] duration-(--motion-quick) ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg data-[state=checked]:bg-accent data-[state=checked]:shadow-[0_0_18px_-4px_var(--accent)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-5 translate-x-1 rounded-full bg-fg shadow-sm transition-transform duration-(--motion-quick) ease-[var(--ease-out)] data-[state=checked]:translate-x-6 data-[state=checked]:bg-accent-fg" />
    </SwitchPrimitive.Root>
  );
}
