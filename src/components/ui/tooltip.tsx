import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function TooltipProvider({
  delayDuration = 200,
  children,
}: {
  delayDuration?: number;
  children: ReactNode;
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      {children}
    </TooltipPrimitive.Provider>
  );
}

export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  className,
  sideOffset = 8,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "glass-card z-50 px-2.5 py-1.5 text-caption text-fg data-[state=delayed-open]:animate-in data-[state=closed]:animate-out motion-reduce:animate-none",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
