import type { InputHTMLAttributes, Ref, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const fieldClass =
  "w-full min-h-11 rounded-button border border-border bg-elevated px-3 text-body text-fg shadow-(--shadow-border) transition-[box-shadow,border-color] duration-(--motion-quick) ease-[var(--ease-out)] placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_18%,transparent),0_12px_28px_-16px_var(--accent)] disabled:opacity-50";

export function Input({
  className,
  type = "text",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input type={type} className={cn(fieldClass, className)} {...props} />;
}

export function Textarea({
  className,
  ref,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  ref?: Ref<HTMLTextAreaElement>;
}) {
  return (
    <textarea
      ref={ref}
      className={cn(fieldClass, "min-h-28 py-2.5", className)}
      {...props}
    />
  );
}
